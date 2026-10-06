import { useCallback, useEffect, useState } from 'react'
import { session } from '../lib/storage.js'
import { createOrderNumber, ORDER_NUMBER } from '../lib/orders.js'
import { PAYMENT_METHODS } from '../lib/validation.js'
import { NG_STATES, STORAGE_PREFIX } from '../config.js'

const KEY = `${STORAGE_PREFIX}:checkout:v1`

const empty = () => ({
  fullName: '',
  phone: '',
  email: '',
  address: '',
  landmark: '',
  city: '',
  state: '',
  paymentMethod: '',
  // Made once per checkout, so the bank-transfer reference shown in step 2
  // is the same number the order gets when it's placed.
  reference: createOrderNumber(),
})

const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '')

/** sessionStorage is user-editable too: keep only known fields, as strings, with sane lengths. */
function cleanDraft(raw) {
  const base = empty()
  if (!raw || typeof raw !== 'object') return base
  return {
    fullName: str(raw.fullName, 80),
    phone: str(raw.phone, 20),
    email: str(raw.email, 120),
    address: str(raw.address, 200),
    landmark: str(raw.landmark, 120),
    city: str(raw.city, 60),
    state: NG_STATES.includes(raw.state) ? raw.state : '',
    paymentMethod: PAYMENT_METHODS.includes(raw.paymentMethod) ? raw.paymentMethod : '',
    reference: ORDER_NUMBER.test(raw.reference) ? raw.reference : base.reference,
  }
}

/*
  The checkout form's values. They live ABOVE the three steps (in the
  Checkout page), so going Back never loses what you typed, and they're
  mirrored to sessionStorage, so a refresh (or the phone killing the tab
  while you open your banking app) doesn't wipe them either. Session, not
  local, storage: an address shouldn't linger on a shared computer.
*/
export function useCheckoutDraft() {
  const [values, setValues] = useState(() => cleanDraft(session.get(KEY, null)))

  useEffect(() => {
    session.set(KEY, values)
  }, [values])

  const setField = useCallback((name, value) => setValues((v) => ({ ...v, [name]: value })), [])
  const clear = useCallback(() => {
    session.remove(KEY)
    setValues(empty())
  }, [])

  return { values, setField, setValues, clear }
}
