import { isKobo } from '../lib/money.js'
import { MAX_RECENT, PROMOS } from '../config.js'
import { STORE_VERSION } from './storeReducer.js'

/*
  Anything read from localStorage is untrusted: it may be from an older
  version of the app, hand-edited in DevTools, or simply broken. And here
  it's MONEY, so a price like 15999.5 or "16000" or -100 must never reach
  the cart total.

  validateStore() returns a clean state, or null if the data isn't a store
  at all. Small problems are REPAIRED rather than rejected, so one bad line
  never costs you the whole cart:
   - a product with a broken price, id or image is dropped,
   - quantities are clamped to 1..stock,
   - duplicates are merged,
   - an unknown promo code is forgotten.
*/

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const cleanString = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export function cleanSnapshot(raw) {
  if (!isObject(raw)) return null
  const id = raw.id
  const title = cleanString(raw.title, 200)
  const thumbnail = cleanString(raw.thumbnail, 500)
  if (!Number.isSafeInteger(id) || id <= 0 || !title) return null
  if (!isKobo(raw.priceKobo) || raw.priceKobo === 0) return null // integer kobo, or nothing
  if (!/^https:\/\//.test(thumbnail)) return null
  const stock = Number.isSafeInteger(raw.stock) && raw.stock >= 0 ? raw.stock : 0
  return {
    id,
    title,
    brand: cleanString(raw.brand, 80),
    category: cleanString(raw.category, 40),
    priceKobo: raw.priceKobo,
    wasKobo: isKobo(raw.wasKobo) && raw.wasKobo > raw.priceKobo ? raw.wasKobo : null,
    thumbnail,
    stock,
    rating: typeof raw.rating === 'number' && raw.rating >= 0 && raw.rating <= 5 ? raw.rating : null,
  }
}

function cleanCart(lines) {
  if (!Array.isArray(lines)) return []
  const byId = new Map()
  for (const raw of lines) {
    if (!isObject(raw)) continue
    const product = cleanSnapshot(raw.product)
    if (!product || product.stock === 0) continue
    const qty = Number.isSafeInteger(raw.qty) && raw.qty > 0 ? raw.qty : 1
    const merged = (byId.get(product.id)?.qty ?? 0) + qty
    byId.set(product.id, { id: product.id, qty: Math.min(merged, product.stock), product })
  }
  return [...byId.values()]
}

function cleanList(items, max = Infinity) {
  if (!Array.isArray(items)) return []
  const seen = new Set()
  const out = []
  for (const raw of items) {
    const p = cleanSnapshot(raw)
    if (p && !seen.has(p.id)) {
      seen.add(p.id)
      out.push(p)
    }
  }
  return out.slice(0, max)
}

export function validateStore(data) {
  if (!isObject(data)) return null
  const promoCode = typeof data.promoCode === 'string' && PROMOS[data.promoCode] ? data.promoCode : null
  return {
    version: STORE_VERSION,
    cart: cleanCart(data.cart),
    wishlist: cleanList(data.wishlist),
    recentlyViewed: cleanList(data.recentlyViewed, MAX_RECENT),
    promoCode,
    lastRemoved: null,
  }
}
