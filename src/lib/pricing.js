import { formatNaira, percentOf, sumKobo } from './money.js'
import { DELIVERY, PROMOS } from '../config.js'
import { normalisePromoCode } from '../state/storeReducer.js'

/*
  Every number on the cart and checkout pages comes from getCartTotals().
  Nothing here is stored: it's recalculated from the cart lines, the promo
  CODE and the delivery state each time they change. Pure functions, integer
  kobo in and integer kobo out, so the same cart always gives the same total.

  Order of operations (written down because it changes the answer):
    1. subtotal  = Σ price × qty
    2. discount  = promo applied to the subtotal (rounded once, in percentOf)
    3. delivery  = by state, FREE if (subtotal − discount) ≥ the threshold
    4. total     = subtotal − discount + delivery
  The free-delivery check uses the amount AFTER the discount, so a promo
  can't push you over the line and then take the money back off.
*/

/** Look up a promo and work out what it's worth on this subtotal. */
export function evaluatePromo(code, subtotalKobo) {
  const key = normalisePromoCode(code)
  const promo = PROMOS[key]
  if (!promo) return { code: key, valid: false, discountKobo: 0, reason: 'That promo code isn’t valid. Check the spelling and try again.' }

  if (promo.minSubtotalKobo && subtotalKobo < promo.minSubtotalKobo) {
    return {
      code: key,
      promo,
      valid: false,
      discountKobo: 0,
      reason: `${key} needs a subtotal of ${formatNaira(promo.minSubtotalKobo)}. Add ${formatNaira(promo.minSubtotalKobo - subtotalKobo)} more to use it.`,
    }
  }

  const discountKobo =
    promo.type === 'percent'
      ? percentOf(subtotalKobo, promo.percent)
      : Math.min(promo.amountKobo, subtotalKobo) // a fixed discount can never make the order negative
  return { code: key, promo, valid: true, discountKobo }
}

/** Delivery fee and ETA for a state, after discounts. null until a state is chosen. */
export function getDelivery(state, discountedSubtotalKobo) {
  if (!state) return null
  const free = discountedSubtotalKobo >= DELIVERY.freeOverKobo
  return {
    state,
    feeKobo: free ? 0 : (DELIVERY.feesByState[state] ?? DELIVERY.defaultFeeKobo),
    free,
    eta: DELIVERY.etaByState[state] ?? DELIVERY.defaultEta,
  }
}

/** The cheapest delivery fee anywhere, for "Delivery from ₦2,500" before a state is chosen. */
export const lowestDeliveryFee = () => Math.min(DELIVERY.defaultFeeKobo, ...Object.values(DELIVERY.feesByState))

export function getCartTotals({ cart, promoCode, state }) {
  const lines = cart.map((line) => ({ ...line, lineTotalKobo: line.product.priceKobo * line.qty }))
  const itemCount = cart.reduce((n, line) => n + line.qty, 0)
  const subtotalKobo = sumKobo(lines.map((l) => l.lineTotalKobo))
  // What the "was" prices add up to: the savings already built into the prices.
  const priceSavingsKobo = sumKobo(cart.map((l) => (l.product.wasKobo ? (l.product.wasKobo - l.product.priceKobo) * l.qty : 0)))

  const promo = promoCode && itemCount > 0 ? evaluatePromo(promoCode, subtotalKobo) : null
  const discountKobo = promo?.valid ? promo.discountKobo : 0
  const afterDiscountKobo = subtotalKobo - discountKobo

  const delivery = itemCount > 0 ? getDelivery(state, afterDiscountKobo) : null
  const freeDeliveryGapKobo = Math.max(0, DELIVERY.freeOverKobo - afterDiscountKobo)

  return {
    lines,
    itemCount,
    subtotalKobo,
    priceSavingsKobo,
    promo,
    discountKobo,
    delivery,
    freeDeliveryGapKobo,
    totalKobo: afterDiscountKobo + (delivery?.feeKobo ?? 0),
  }
}
