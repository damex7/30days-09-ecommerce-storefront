import { NG_STATES, POD_STATES } from '../config.js'
import { formatList } from './format.js'

/*
  Checkout validation rules. Each validator is a pure function:
    values in → { fieldName: 'message for the person' } out
  An empty object means the step is valid. The same rules run when you
  press Continue, while you fix a field, and once more before an order is
  placed, so there's exactly one definition of "valid".

  Messages say what to do, not just what's wrong:
  "Enter a Nigerian mobile number, like 0803 123 4567", not "Invalid phone".
*/

/* ---------- Phone numbers ---------- */

/*
  Nigerian mobile numbers are 11 digits starting 070, 071, 080, 081, 090
  or 091 (e.g. 0803 123 4567), or the same number in international format
  with +234 replacing the leading 0 (+234 803 123 4567).
  People type them in many ways, so first we strip spaces, dashes, dots and
  brackets, then accept:
    08031234567      0 + 10 digits
    +2348031234567   +234 + 10 digits
    2348031234567    234 + 10 digits (no plus)
    +23408031234567  +234 with the 0 kept by mistake (common!)
  Everything is stored in ONE format, +2348031234567 (E.164), so WhatsApp
  links and order records always agree.
*/
const LOCAL = /^0([789][01]\d{8})$/
const INTERNATIONAL = /^(?:\+?234)0?([789][01]\d{8})$/

export function normalisePhone(raw) {
  const compact = String(raw ?? '').replace(/[\s\-.()]/g, '')
  const match = compact.match(LOCAL) ?? compact.match(INTERNATIONAL)
  return match ? `+234${match[1]}` : null
}

/** +2348031234567 → "0803 123 4567", the way Nigerians write it. */
export function formatPhoneLocal(e164) {
  const m = String(e164 ?? '').match(/^\+234(\d{3})(\d{3})(\d{4})$/)
  return m ? `0${m[1]} ${m[2]} ${m[3]}` : String(e164 ?? '')
}

/* ---------- Step 1: contact and delivery ---------- */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const CONTACT_FIELDS = ['fullName', 'phone', 'email', 'address', 'city', 'state', 'landmark']

export function validateContact(v) {
  const errors = {}
  const name = (v.fullName ?? '').trim()
  if (!name) errors.fullName = 'Enter your full name.'
  else if (name.length < 2 || !/\p{L}/u.test(name)) errors.fullName = 'Enter your name as it should appear on the delivery.'

  if (!(v.phone ?? '').trim()) errors.phone = 'Enter your phone number, so the rider can reach you.'
  else if (!normalisePhone(v.phone)) errors.phone = 'Enter a Nigerian mobile number, like 0803 123 4567 or +234 803 123 4567.'

  const email = (v.email ?? '').trim()
  if (!email) errors.email = 'Enter your email address. We’ll send your receipt there.'
  else if (!EMAIL.test(email)) errors.email = 'Enter an email address like name@example.com.'

  const address = (v.address ?? '').trim()
  if (!address) errors.address = 'Enter your delivery address.'
  else if (address.length < 10) errors.address = 'Add more detail: house number and street, e.g. 12 Allen Avenue.'

  if (!(v.city ?? '').trim()) errors.city = 'Enter your town, city or area, e.g. Ikeja.'
  if (!NG_STATES.includes(v.state)) errors.state = 'Choose your state.'
  if ((v.landmark ?? '').length > 120) errors.landmark = 'Keep the landmark under 120 characters.'
  return errors
}

/* ---------- Step 2: payment ---------- */

export const PAYMENT_METHODS = ['online', 'transfer', 'pod']
export const PAYMENT_FIELDS = ['paymentMethod']

export const isPodAvailable = (state) => POD_STATES.includes(state)
export const podUnavailableMessage = (state) =>
  `Pay on delivery isn’t available in ${state} yet. It’s offered in ${formatList(POD_STATES)}. Choose online payment or bank transfer.`

export function validatePayment(v) {
  const errors = {}
  if (!PAYMENT_METHODS.includes(v.paymentMethod)) errors.paymentMethod = 'Choose how you’d like to pay.'
  else if (v.paymentMethod === 'pod' && !isPodAvailable(v.state)) errors.paymentMethod = podUnavailableMessage(v.state)
  return errors
}

/* ---------- Steps ---------- */

export const STEPS = [
  { number: 1, label: 'Delivery', title: 'Contact and delivery', validate: validateContact, fields: CONTACT_FIELDS },
  { number: 2, label: 'Payment', title: 'How would you like to pay?', validate: validatePayment, fields: PAYMENT_FIELDS },
  { number: 3, label: 'Review', title: 'Review and place your order', validate: () => ({}), fields: [] },
]

/** The first step with a problem, or null when everything is valid. */
export function firstInvalidStep(values) {
  const bad = STEPS.find((s) => Object.keys(s.validate(values)).length > 0)
  return bad ? bad.number : null
}
