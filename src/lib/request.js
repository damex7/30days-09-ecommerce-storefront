import { session } from './storage.js'

/*
  The one place the app calls fetch. It:
  1. answers from a sessionStorage cache when there's a fresh copy,
  2. shares one request between callers asking for the same URL at the
     same time (in-flight dedupe),
  3. gives up after TIMEOUT_MS so a stalled API can't spin forever,
  4. retries ONCE after a short pause when the failure looks temporary
     (dropped connection, timeout, 5xx, 429), but not a 404,
  5. turns every failure into an ApiError with a message a person can read.
*/

const TIMEOUT_MS = 10_000
// Bump when the normaliser changes shape, so old cached copies are ignored.
const CACHE_VERSION = 'ibi-oja:api:v1:'

export const MINUTE = 60_000

export class ApiError extends Error {
  /** kind: 'offline' | 'timeout' | 'ratelimit' | 'http' | 'notfound' | 'parse' */
  constructor(message, { kind = 'http', status, retryable = false } = {}) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.retryable = retryable
  }
}

const inFlight = new Map()

/**
 * @param {string} url
 * @param {object} options
 * @param {AbortSignal} [options.signal]   stop waiting (the shared request carries on and is cached)
 * @param {number} [options.ttl]           how long a cached copy stays fresh, in ms (0 = don't cache)
 * @param {(json) => any} [options.select] normalise BEFORE caching: we store what we use, not the raw payload
 */
export function request(url, { signal, ttl = 0, select = (json) => json } = {}) {
  const cacheKey = CACHE_VERSION + url

  if (ttl > 0) {
    const hit = session.get(cacheKey, null)
    if (hit && Date.now() - hit.savedAt < hit.ttl) return Promise.resolve(hit.data)
  }

  let shared = inFlight.get(cacheKey)
  if (!shared) {
    shared = fetchWithRetry(url, select)
      .then((data) => {
        if (ttl > 0) session.set(cacheKey, { savedAt: Date.now(), ttl, data }) // fails quietly if storage is full
        return data
      })
      .finally(() => inFlight.delete(cacheKey))
    inFlight.set(cacheKey, shared)
  }
  return untilAborted(shared, signal)
}

async function fetchWithRetry(url, select) {
  try {
    return await fetchOnce(url, select)
  } catch (err) {
    if (!err.retryable) throw err
    await new Promise((r) => setTimeout(r, 700))
    return fetchOnce(url, select)
  }
}

async function fetchOnce(url, select) {
  let res
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  } catch (err) {
    if (err.name === 'TimeoutError') {
      throw new ApiError('The shop took too long to answer.', { kind: 'timeout', retryable: true })
    }
    // fetch only rejects (rather than returning a bad status) when the request never got an answer
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false
    throw new ApiError(offline ? "You're offline. Reconnect and try again." : "Couldn't reach the shop. Check your connection.", {
      kind: 'offline',
      retryable: true,
    })
  }

  if (res.status === 429) {
    throw new ApiError('The shop is busy right now. Wait a moment and try again.', { kind: 'ratelimit', status: 429, retryable: true })
  }
  if (res.status === 404) {
    throw new ApiError("We couldn't find that.", { kind: 'notfound', status: 404 })
  }
  if (!res.ok) {
    throw new ApiError(`The shop returned an error (${res.status}).`, { kind: 'http', status: res.status, retryable: res.status >= 500 })
  }

  let json
  try {
    json = await res.json()
  } catch {
    throw new ApiError('The shop sent back something unexpected.', { kind: 'parse', status: res.status })
  }
  return select(json)
}

/** Resolve with `promise`, unless `signal` aborts first. */
function untilAborted(promise, signal) {
  if (!signal) return promise
  if (signal.aborted) return Promise.reject(signal.reason)
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(signal.reason)
    signal.addEventListener('abort', onAbort, { once: true })
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort))
  })
}
