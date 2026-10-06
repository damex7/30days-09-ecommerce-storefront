import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { readValidated, writeJSON } from '../lib/storage.js'
import { MAX_ORDERS, validateOrders } from '../lib/orders.js'
import { STORAGE_PREFIX } from '../config.js'

export const ORDERS_KEY = `${STORAGE_PREFIX}:orders:v1`

/*
  "My orders", saved in this browser only (no accounts today). Kept apart
  from the cart reducer: orders are permanent receipts, the cart is a
  work in progress, and they change for different reasons.
*/
const OrdersContext = createContext(null)

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState(() => {
    const saved = readValidated(ORDERS_KEY, validateOrders)
    return saved.status === 'ok' ? saved.value : []
  })

  useEffect(() => {
    writeJSON(ORDERS_KEY, orders)
  }, [orders])

  const addOrder = useCallback((order) => setOrders((list) => [order, ...list.filter((o) => o.number !== order.number)].slice(0, MAX_ORDERS)), [])

  const value = useMemo(() => ({ orders, addOrder }), [orders, addOrder])
  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
}

export function useOrders() {
  const value = useContext(OrdersContext)
  if (!value) throw new Error('useOrders must be used inside <OrdersProvider>')
  return value
}
