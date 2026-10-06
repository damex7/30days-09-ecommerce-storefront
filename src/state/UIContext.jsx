import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

/*
  UI state that several distant components share but that should NOT be
  saved: is the cart drawer open, and which product was just added (so the
  drawer can highlight it). Kept apart from the store reducer on purpose:
  the reducer is the shopper's data; this is just what's on screen.
*/
const UIContext = createContext(null)

export function UIProvider({ children }) {
  const [cartOpen, setCartOpen] = useState(false)
  const [justAddedId, setJustAddedId] = useState(null)

  const openCart = useCallback((addedId = null) => {
    setJustAddedId(addedId)
    setCartOpen(true)
  }, [])
  const closeCart = useCallback(() => setCartOpen(false), [])

  // Following a link out of the drawer (Checkout, a product) closes it.
  const { pathname } = useLocation()
  useEffect(() => setCartOpen(false), [pathname])

  const value = useMemo(() => ({ cartOpen, openCart, closeCart, justAddedId }), [cartOpen, openCart, closeCart, justAddedId])
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI() {
  const value = useContext(UIContext)
  if (!value) throw new Error('useUI must be used inside <UIProvider>')
  return value
}
