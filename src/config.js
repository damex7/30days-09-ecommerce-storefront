/*
  Every business rule the shop owner might want to change lives here:
  the exchange rate, promo codes, delivery fees, where pay-on-delivery is
  offered, bank details and the WhatsApp number.

  MONEY IS IN KOBO. ₦1 = 100 kobo, and every amount below is a whole number
  of kobo. The underscore is just a digit separator that JavaScript ignores,
  used here to split naira from kobo so the numbers read naturally:
    2500_00   = 250000 kobo = ₦2,500.00
    150000_00 = ₦150,000.00
*/

// The name contains Yoruba letters (ọ with a dot below, à with a grave
// accent). normalize('NFC') makes sure each is stored as ONE code point, so
// the name compares, searches and URL-encodes the same way everywhere.
export const STORE_NAME = 'Ibi ọjà'.normalize('NFC')
export const STORE_TAGLINE = 'Shop the market. Pay your way.'

// ASCII-only identifiers, where diacritics would only cause trouble.
export const STORAGE_PREFIX = 'ibi-oja'
export const ORDER_PREFIX = 'OJA'

/* ---------- Pricing (DEMO) ---------- */

// DummyJSON prices are in US dollars. This fixed rate turns them into Naira
// ONCE, in the product normaliser (src/lib/store.js). It is a demo rate,
// not a live one: a real shop sets its own Naira prices.
export const USD_TO_NGN = 1600

// Retail rounding, so prices look like real shop prices (₦16,000, not ₦15,984).
// The first rule whose `below` is greater than the price wins.
export const PRICE_ROUNDING = [
  { below: 100000_00, step: 100_00 }, // under ₦100,000: nearest ₦100
  { below: Infinity, step: 1000_00 }, // ₦100,000 and up: nearest ₦1,000
]

/* ---------- Promo codes ---------- */

// Codes are matched case-insensitively. The cart stores only the CODE; the
// discount is always recalculated from the current subtotal.
export const PROMOS = {
  NAIJA10: {
    type: 'percent',
    percent: 10,
    label: '10% off your order',
  },
  WELCOME2000: {
    type: 'fixed',
    amountKobo: 2000_00,
    minSubtotalKobo: 20000_00,
    label: '₦2,000 off orders of ₦20,000 or more',
  },
}

/* ---------- Delivery ---------- */

export const DELIVERY = {
  // Flat fee for any state not listed in feesByState.
  defaultFeeKobo: 5000_00,
  feesByState: {
    Lagos: 2500_00,
  },
  // Free delivery when the subtotal AFTER discounts reaches this.
  freeOverKobo: 150000_00,
  etaByState: {
    Lagos: '1–2 working days',
  },
  defaultEta: '3–5 working days',
}

// Pay on delivery is only offered where the seller's riders go.
export const POD_STATES = ['Lagos', 'Ogun', 'FCT (Abuja)']

export const NG_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara',
]

/* ---------- Payment ---------- */

// DEMO account details. Not a real account: never send money to it.
export const BANK_DETAILS = {
  bankName: 'Demo Bank (not a real account)',
  accountName: 'Ibi ọjà Stores'.normalize('NFC'),
  accountNumber: '0123456789',
}

// Paystack TEST public key, read from .env.local (see .env.example).
// A public key is designed to be seen by browsers. The SECRET key must
// never appear in front-end code or in any VITE_ variable.
export const PAYSTACK_PUBLIC_KEY = (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ?? '').trim()

/* ---------- WhatsApp ---------- */

// International format, digits only (234 + the number without its leading 0).
// The placeholder below is not a real shop; set VITE_SELLER_WHATSAPP or edit it.
export const SELLER_WHATSAPP = ((import.meta.env.VITE_SELLER_WHATSAPP ?? '').replace(/\D/g, '') || '2348000000000')

/* ---------- Store limits ---------- */

export const PAGE_SIZE = 12
export const MAX_RECENT = 12
export const LOW_STOCK_AT = 5 // "Only 3 left" below this
