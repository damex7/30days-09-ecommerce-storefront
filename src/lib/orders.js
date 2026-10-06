import { isKobo, sumKobo } from './money.js'
import { normalisePhone } from './validation.js'
import { NG_STATES, ORDER_PREFIX } from '../config.js'

/*
  Order numbers look like OJA-261006-K7Q2: prefix, date (YYMMDD), then 4
  random characters. The alphabet leaves out 0/O and 1/I/L, because people
  read this number aloud on the phone and type it as a bank-transfer
  reference, where "O or zero?" causes real mix-ups.
*/
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function createOrderNumber(date = new Date()) {
  const yymmdd = [date.getFullYear() % 100, date.getMonth() + 1, date.getDate()].map((n) => String(n).padStart(2, '0')).join('')
  const random = crypto.getRandomValues(new Uint32Array(4))
  const suffix = Array.from(random, (n) => ALPHABET[n % ALPHABET.length]).join('')
  return `${ORDER_PREFIX}-${yymmdd}-${suffix}`
}

export const ORDER_NUMBER = new RegExp(`^${ORDER_PREFIX}-\\d{6}-[${ALPHABET}]{4}$`)

/* ---------- Payment status ---------- */

export const PAYMENT_STATUS = {
  // Paystack (test) or the simulated popup said "success", but no server checked it.
  paid_unverified: { label: 'Paid · unverified (demo)', tone: 'kola' },
  awaiting_transfer: { label: 'Awaiting bank transfer', tone: 'indigo' },
  pay_on_delivery: { label: 'Pay on delivery', tone: 'leaf' },
}

/* ---------- Building an order ---------- */

/*
  An order is a RECEIPT. Unlike the cart, it FREEZES everything at the
  moment it was placed: prices, discount, delivery fee, total. If a
  product's price changes tomorrow, yesterday's order must still show what
  was actually charged. (The cart derives totals; an order records them.)
*/
export function buildOrder({ values, totals, payment, now = new Date() }) {
  return {
    version: 1,
    number: values.reference,
    createdAt: now.toISOString(),
    customer: {
      fullName: values.fullName.trim(),
      phone: normalisePhone(values.phone),
      email: values.email.trim(),
    },
    delivery: {
      address: values.address.trim(),
      landmark: values.landmark.trim(),
      city: values.city.trim(),
      state: values.state,
      eta: totals.delivery.eta,
    },
    items: totals.lines.map((line) => ({
      id: line.id,
      title: line.product.title,
      thumbnail: line.product.thumbnail,
      priceKobo: line.product.priceKobo,
      qty: line.qty,
      lineTotalKobo: line.lineTotalKobo,
    })),
    promo: totals.promo?.valid ? { code: totals.promo.code, label: totals.promo.promo.label } : null,
    subtotalKobo: totals.subtotalKobo,
    discountKobo: totals.discountKobo,
    deliveryKobo: totals.delivery.feeKobo,
    totalKobo: totals.totalKobo,
    payment,
  }
}

/* ---------- Reading saved orders ---------- */

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '')
export const MAX_ORDERS = 50

function cleanItem(raw) {
  if (!isObject(raw) || !Number.isSafeInteger(raw.id) || !str(raw.title, 200)) return null
  if (!isKobo(raw.priceKobo) || !Number.isSafeInteger(raw.qty) || raw.qty < 1) return null
  if (raw.lineTotalKobo !== raw.priceKobo * raw.qty) return null
  return {
    id: raw.id,
    title: str(raw.title, 200),
    thumbnail: /^https:\/\//.test(raw.thumbnail) ? raw.thumbnail : '',
    priceKobo: raw.priceKobo,
    qty: raw.qty,
    lineTotalKobo: raw.lineTotalKobo,
  }
}

/*
  A saved order is only kept if its numbers ADD UP: line totals = price × qty,
  subtotal = sum of lines, total = subtotal − discount + delivery. A receipt
  that doesn't add up is worse than no receipt, so it's dropped (and the
  storage helper keeps a backup copy of the raw data).
*/
export function cleanOrder(raw) {
  if (!isObject(raw) || !ORDER_NUMBER.test(raw.number) || Number.isNaN(Date.parse(raw.createdAt))) return null
  const items = Array.isArray(raw.items) ? raw.items.map(cleanItem) : []
  if (!items.length || items.includes(null)) return null
  const money = [raw.subtotalKobo, raw.discountKobo, raw.deliveryKobo, raw.totalKobo]
  if (!money.every(isKobo)) return null
  if (raw.subtotalKobo !== sumKobo(items.map((i) => i.lineTotalKobo))) return null
  if (raw.totalKobo !== raw.subtotalKobo - raw.discountKobo + raw.deliveryKobo) return null

  const c = raw.customer
  const d = raw.delivery
  const p = raw.payment
  if (!isObject(c) || !isObject(d) || !isObject(p) || !PAYMENT_STATUS[p.status]) return null
  if (!NG_STATES.includes(d.state) || !normalisePhone(c.phone)) return null

  return {
    version: 1,
    number: raw.number,
    createdAt: raw.createdAt,
    customer: { fullName: str(c.fullName, 80), phone: normalisePhone(c.phone), email: str(c.email, 120) },
    delivery: { address: str(d.address, 200), landmark: str(d.landmark, 120), city: str(d.city, 60), state: d.state, eta: str(d.eta, 40) },
    items,
    promo: isObject(raw.promo) ? { code: str(raw.promo.code, 20), label: str(raw.promo.label, 80) } : null,
    subtotalKobo: raw.subtotalKobo,
    discountKobo: raw.discountKobo,
    deliveryKobo: raw.deliveryKobo,
    totalKobo: raw.totalKobo,
    payment: {
      method: ['online', 'transfer', 'pod'].includes(p.method) ? p.method : 'online',
      status: p.status,
      provider: p.provider === 'paystack-test' ? 'paystack-test' : p.provider === 'simulated' ? 'simulated' : null,
      reference: str(p.reference, 60),
    },
  }
}

export function validateOrders(data) {
  if (!Array.isArray(data)) return null
  const seen = new Set()
  return data
    .map(cleanOrder)
    .filter((o) => o && !seen.has(o.number) && seen.add(o.number))
    .slice(0, MAX_ORDERS)
}
