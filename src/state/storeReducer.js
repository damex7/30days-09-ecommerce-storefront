import { MAX_RECENT, PROMOS } from '../config.js'

/*
  ONE reducer for everything the shopper builds up while browsing: the
  cart, the wishlist, recently viewed products and the promo code.

  Why a reducer instead of several useStates?
   - Every change is a named action ("cart/add", "promo/apply"), so you can
     read the list below and know everything that can ever happen to a cart.
   - The rules (stock limits, no duplicates, Undo) live in one pure
     function, not scattered across buttons.
   - It's easy to save: one object goes to localStorage.

  What is NOT in here: subtotal, discount, delivery and total. Those are
  always DERIVED from the cart (see lib/pricing.js). If we stored a total,
  every action would have to remember to update it, and one forgotten
  update means a wrong price. Derived values can't go stale.
*/

export const STORE_VERSION = 1

export const initialState = {
  version: STORE_VERSION,
  cart: [], // [{ id, qty, product: snapshot }]
  wishlist: [], // [snapshot], newest first
  recentlyViewed: [], // [snapshot], newest first, max MAX_RECENT
  promoCode: null, // the CODE only ("NAIJA10"), never the discount amount
  lastRemoved: null, // { line, index } for Undo. Session-only: never saved.
}

/* ---------- Action types: everything that can happen ---------- */

export const ACTIONS = {
  ADD_TO_CART: 'cart/add',
  SET_QUANTITY: 'cart/setQuantity',
  REMOVE_FROM_CART: 'cart/remove',
  UNDO_REMOVE: 'cart/undoRemove',
  CLEAR_CART: 'cart/clear',
  APPLY_PROMO: 'promo/apply',
  REMOVE_PROMO: 'promo/remove',
  TOGGLE_WISHLIST: 'wishlist/toggle',
  RECORD_VIEW: 'recent/record',
  CLEAR_RECENT: 'recent/clear',
}

/*
  The small copy of a product we keep in the cart and wishlist, so those
  pages render instantly without refetching every product. (A real shop
  would re-check prices and stock on the server at checkout.)
*/
export function toSnapshot(p) {
  return {
    id: p.id,
    title: p.title,
    brand: p.brand ?? '',
    category: p.category ?? '',
    priceKobo: p.priceKobo,
    wasKobo: p.wasKobo ?? null,
    thumbnail: p.thumbnail,
    stock: p.stock,
    rating: p.rating ?? null,
  }
}

/* ---------- Action creators: the only way components build actions ---------- */

export const addToCart = (product, qty = 1) => ({ type: ACTIONS.ADD_TO_CART, product: toSnapshot(product), qty })
export const setQuantity = (id, qty) => ({ type: ACTIONS.SET_QUANTITY, id, qty })
export const removeFromCart = (id) => ({ type: ACTIONS.REMOVE_FROM_CART, id })
export const undoRemove = () => ({ type: ACTIONS.UNDO_REMOVE })
export const clearCart = () => ({ type: ACTIONS.CLEAR_CART })
export const applyPromo = (code) => ({ type: ACTIONS.APPLY_PROMO, code })
export const removePromo = () => ({ type: ACTIONS.REMOVE_PROMO })
export const toggleWishlist = (product) => ({ type: ACTIONS.TOGGLE_WISHLIST, product: toSnapshot(product) })
export const recordView = (product) => ({ type: ACTIONS.RECORD_VIEW, product: toSnapshot(product) })
export const clearRecent = () => ({ type: ACTIONS.CLEAR_RECENT })

/* ---------- Stock limits (pure helpers, also used by components) ---------- */

export const quantityInCart = (cart, id) => cart.find((line) => line.id === id)?.qty ?? 0

/** How many more of this product can go in the cart right now. */
export const addableQuantity = (cart, product) => Math.max(0, product.stock - quantityInCart(cart, product.id))

/** 1..stock, whole numbers only. */
const clampQty = (qty, stock) => Math.max(1, Math.min(Math.floor(Number(qty)) || 1, stock))

export const normalisePromoCode = (code) => String(code ?? '').trim().toUpperCase()

/* ---------- The reducer ---------- */

export function storeReducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD_TO_CART: {
      const { product } = action
      if (product.stock <= 0) return state
      const existing = state.cart.find((line) => line.id === product.id)
      if (existing) {
        // Never more than the stock. The component shows the "only N left" message.
        const qty = Math.min(existing.qty + action.qty, product.stock)
        if (qty === existing.qty) return state
        return {
          ...state,
          // Refresh the snapshot too: the price or stock may have changed since it was added.
          cart: state.cart.map((line) => (line.id === product.id ? { ...line, qty, product } : line)),
        }
      }
      return { ...state, cart: [...state.cart, { id: product.id, qty: clampQty(action.qty, product.stock), product }] }
    }

    case ACTIONS.SET_QUANTITY:
      return {
        ...state,
        cart: state.cart.map((line) => (line.id === action.id ? { ...line, qty: clampQty(action.qty, line.product.stock) } : line)),
      }

    case ACTIONS.REMOVE_FROM_CART: {
      const index = state.cart.findIndex((line) => line.id === action.id)
      if (index === -1) return state
      return {
        ...state,
        cart: state.cart.filter((line) => line.id !== action.id),
        // Remember what was removed and where, so Undo puts it back in the same place.
        lastRemoved: { line: state.cart[index], index },
      }
    }

    case ACTIONS.UNDO_REMOVE: {
      const removed = state.lastRemoved
      if (!removed || state.cart.some((line) => line.id === removed.line.id)) return { ...state, lastRemoved: null }
      const cart = [...state.cart]
      cart.splice(Math.min(removed.index, cart.length), 0, removed.line)
      return { ...state, cart, lastRemoved: null }
    }

    case ACTIONS.CLEAR_CART:
      return { ...state, cart: [], promoCode: null, lastRemoved: null }

    case ACTIONS.APPLY_PROMO: {
      // The component checks the code and shows the error; the reducer just refuses unknown codes.
      const code = normalisePromoCode(action.code)
      return PROMOS[code] ? { ...state, promoCode: code } : state
    }

    case ACTIONS.REMOVE_PROMO:
      return { ...state, promoCode: null }

    case ACTIONS.TOGGLE_WISHLIST: {
      const saved = state.wishlist.some((p) => p.id === action.product.id)
      return {
        ...state,
        wishlist: saved ? state.wishlist.filter((p) => p.id !== action.product.id) : [action.product, ...state.wishlist],
      }
    }

    case ACTIONS.RECORD_VIEW: {
      // Move to the front (no duplicates), keep the newest MAX_RECENT.
      const rest = state.recentlyViewed.filter((p) => p.id !== action.product.id)
      return { ...state, recentlyViewed: [action.product, ...rest].slice(0, MAX_RECENT) }
    }

    case ACTIONS.CLEAR_RECENT:
      return { ...state, recentlyViewed: [] }

    default:
      // A typo in an action type is a bug: fail loudly during development.
      throw new Error(`Unknown store action: ${action.type}`)
  }
}

/** What gets saved: everything except the session-only Undo slot. */
export function serializeStore({ version, cart, wishlist, recentlyViewed, promoCode }) {
  return { version, cart, wishlist, recentlyViewed, promoCode }
}
