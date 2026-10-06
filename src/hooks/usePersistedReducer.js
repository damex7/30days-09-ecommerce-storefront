import { useEffect, useReducer, useState } from 'react'
import { readValidated, writeJSON } from '../lib/storage.js'

/**
 * useReducer that survives reloads (the Day 4 pattern).
 *  - Reads storage ONCE, in useReducer's lazy initialiser (not every render).
 *  - `validate` cleans what was saved, or returns null to reject it.
 *  - `createFallback` builds the state when nothing usable was saved.
 *  - `serialize` picks which part of the state gets saved.
 * Returns [state, dispatch, loadStatus] where loadStatus is "missing" | "ok" | "corrupt".
 */
export function usePersistedReducer(reducer, key, { validate, createFallback, serialize = (s) => s }) {
  const [load] = useState(() => readValidated(key, validate))

  const [state, dispatch] = useReducer(reducer, load, (loaded) => (loaded.status === 'ok' ? loaded.value : createFallback(loaded.status)))

  useEffect(() => {
    writeJSON(key, serialize(state))
  }, [key, state, serialize])

  return [state, dispatch, load.status]
}
