import { createContext, useContext, useMemo } from 'react'
import { usePersistedReducer } from '../hooks/usePersistedReducer.js'
import { initialState, serializeStore, storeReducer } from './storeReducer.js'
import { validateStore } from './validateStore.js'
import { getCartTotals } from '../lib/pricing.js'
import { STORAGE_PREFIX } from '../config.js'

export const STORE_KEY = `${STORAGE_PREFIX}:store:v1`

/*
  Two contexts instead of one. `dispatch` never changes, so components that
  only SEND actions (an "Add to cart" button) subscribe to the dispatch
  context and don't re-render every time the cart changes.
*/
const StoreStateContext = createContext(null)
const StoreDispatchContext = createContext(null)
const LoadStatusContext = createContext('ok')

export function StoreProvider({ children }) {
  const [state, dispatch, loadStatus] = usePersistedReducer(storeReducer, STORE_KEY, {
    validate: validateStore,
    createFallback: () => initialState,
    serialize: serializeStore,
  })

  return (
    <StoreDispatchContext.Provider value={dispatch}>
      <StoreStateContext.Provider value={state}>
        <LoadStatusContext.Provider value={loadStatus}>{children}</LoadStatusContext.Provider>
      </StoreStateContext.Provider>
    </StoreDispatchContext.Provider>
  )
}

function useRequiredContext(context, name) {
  const value = useContext(context)
  if (value === null) throw new Error(`${name} must be used inside <StoreProvider>`)
  return value
}

export const useStore = () => useRequiredContext(StoreStateContext, 'useStore')
export const useStoreDispatch = () => useRequiredContext(StoreDispatchContext, 'useStoreDispatch')
export const useStoreLoadStatus = () => useContext(LoadStatusContext)

/* Small selector hooks, so components ask for what they mean. */
export const useCart = () => useStore().cart
export const useIsWishlisted = (id) => useStore().wishlist.some((p) => p.id === id)

/**
 * Subtotal, discount, delivery and total, DERIVED from the cart every time.
 * useMemo only skips the (cheap) maths when nothing it depends on changed.
 * Pass the delivery state once it's known (checkout); without it, delivery is null.
 */
export function useCartTotals(deliveryState = null) {
  const { cart, promoCode } = useStore()
  return useMemo(() => getCartTotals({ cart, promoCode, state: deliveryState }), [cart, promoCode, deliveryState])
}
