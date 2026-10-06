import { PRICE_ROUNDING, USD_TO_NGN } from '../config.js'

/*
  MONEY RULE: every amount in this app is a whole number of KOBO.
  (₦1 = 100 kobo.) We only turn kobo into "₦16,000" when printing it.

  Why not just use naira with decimals, like 159.99?
  JavaScript numbers are binary floating point. They cannot store most
  decimal fractions exactly, so tiny errors appear and add up:

      0.1 + 0.2              → 0.30000000000000004
      19.99 * 7              → 139.92999999999998   (7 items at ₦19.99)
      4.35 * 3               → 13.049999999999999
      1.15 * 100             → 114.99999999999999   (so Math.floor gives 114, not 115!)
      19.99 * 7 === 139.93   → false

  In a shop, that means a total that's off by a kobo, a "free delivery
  over ₦150,000" check that fails at exactly ₦150,000, or a payment
  provider rejecting an amount like 13992.999999999998.

  Integers don't have this problem (up to 9 quadrillion, far beyond any cart):
      1999 * 7               → 13993, exactly
  So we store kobo, add and multiply integers, and round ONCE, on purpose,
  wherever a percentage or a conversion could produce a fraction.
  Paystack works the same way: it expects `amount` in kobo.
*/

/** True for a valid money amount: a whole, non-negative number of kobo. */
export const isKobo = (v) => Number.isSafeInteger(v) && v >= 0

/** Whole naira (e.g. from a URL "?minPrice=5000") to kobo. */
export const nairaToKobo = (naira) => Math.round(naira) * 100

/** Kobo to whole naira, for form fields and URLs (drops any kobo). */
export const koboToWholeNaira = (kobo) => Math.floor(kobo / 100)

/** Round to a retail-looking price using the steps in config (₦100 or ₦1,000). */
export function roundRetail(kobo) {
  const rule = PRICE_ROUNDING.find((r) => kobo < r.below) ?? PRICE_ROUNDING.at(-1)
  return Math.max(rule.step, Math.round(kobo / rule.step) * rule.step)
}

/*
  US dollars → kobo, done ONCE in the product normaliser.
  Step 1: dollars to whole cents, rounding away float noise (9.99 → 999).
  Step 2: cents × rate is ALREADY kobo, with integer maths only:
          1 cent = $0.01 = ₦(rate / 100) = `rate` kobo.
          999 cents × 1600 = 1,598,400 kobo = ₦15,984
  Step 3: retail rounding → ₦16,000.
*/
export function usdToKobo(usd) {
  const cents = Math.round(Number(usd) * 100)
  if (!Number.isFinite(cents) || cents <= 0) return 0
  return roundRetail(cents * USD_TO_NGN)
}

/*
  A percentage of an amount, rounded to the nearest kobo (halves round up).
  This is the ONE place percentages become money, so the rounding rule is
  the same for promos everywhere. 10% of ₦15,999.95 (1,599,995 kobo) is
  159,999.5 kobo → 160,000 kobo.
*/
export function percentOf(kobo, percent) {
  return Math.round((kobo * percent) / 100)
}

/** Add up amounts. Integers in, integer out. */
export const sumKobo = (amounts) => amounts.reduce((total, k) => total + k, 0)

const whole = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  currencyDisplay: 'narrowSymbol', // "₦", not "NGN"
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})
const withKobo = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  currencyDisplay: 'narrowSymbol',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/*
  The only place kobo becomes text. Dividing by 100 here is safe: the
  result is only printed (rounded to 2 places by Intl), never stored or
  used in more maths. Whole-naira amounts drop the ".00": ₦16,000.
  Negative amounts (discounts) use a real minus sign: −₦2,000.
*/
export function formatNaira(kobo) {
  if (!Number.isFinite(kobo)) return '₦—'
  const abs = Math.abs(kobo)
  const text = (abs % 100 === 0 ? whole : withKobo).format(abs / 100)
  return kobo < 0 ? `−${text}` : text
}

