import { formatNaira } from '../../lib/money.js'
import { lowestDeliveryFee } from '../../lib/pricing.js'
import { plural } from '../../lib/format.js'
import { DELIVERY } from '../../config.js'
import { cx } from '../../lib/cx.js'

/*
  The running total. Every figure comes from `totals` (useCartTotals), so
  it can never disagree with the cart. Used by the drawer, the cart page
  and every checkout step.
*/
export function CartSummary({ totals, className, compact = false }) {
  const { itemCount, subtotalKobo, discountKobo, promo, delivery, totalKobo, freeDeliveryGapKobo, priceSavingsKobo } = totals
  const qualifiesFree = freeDeliveryGapKobo === 0
  const progress = Math.min(100, Math.round(((DELIVERY.freeOverKobo - freeDeliveryGapKobo) / DELIVERY.freeOverKobo) * 100))

  return (
    <div className={className}>
      {!compact && (
        <div className="mb-4 rounded-2xl bg-panel-2 p-3 text-sm">
          <p className="font-bold">
            {qualifiesFree ? (
              <span className="text-leaf">You’ve got free delivery!</span>
            ) : (
              <>
                Add <span className="font-mono tabular-nums">{formatNaira(freeDeliveryGapKobo)}</span> more for free delivery
              </>
            )}
          </p>
          <div
            role="progressbar"
            aria-label="Progress to free delivery"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="mt-2 h-2 overflow-hidden rounded-full bg-panel"
          >
            <div className="h-full rounded-full bg-leaf transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <dl className="space-y-2 text-sm">
        <Row label={`Subtotal (${plural(itemCount, 'item')})`} value={formatNaira(subtotalKobo)} />
        {promo?.valid && <Row label={`Promo ${promo.code}`} value={formatNaira(-discountKobo)} className="text-leaf" />}
        <Row
          label={delivery ? `Delivery to ${delivery.state}` : 'Delivery'}
          value={
            delivery ? (
              delivery.free ? (
                <span className="font-sans font-bold text-leaf">Free</span>
              ) : (
                formatNaira(delivery.feeKobo)
              )
            ) : qualifiesFree ? (
              <span className="font-sans font-bold text-leaf">Free</span>
            ) : (
              <span className="font-sans text-ink-faint">From {formatNaira(lowestDeliveryFee())}, at checkout</span>
            )
          }
        />
        <div className="flex items-baseline justify-between gap-3 border-t border-line pt-3">
          <dt className="font-display font-bold">Total</dt>
          <dd className="font-mono text-xl font-semibold tabular-nums">{formatNaira(totalKobo)}</dd>
        </div>
      </dl>
      {(priceSavingsKobo > 0 || discountKobo > 0) && (
        <p className="mt-2 text-right text-xs font-bold text-leaf">
          You’re saving {formatNaira(priceSavingsKobo + discountKobo)} on this order
        </p>
      )}
      {!delivery && !qualifiesFree && <p className="mt-1 text-right text-xs text-ink-faint">Total before delivery</p>}
    </div>
  )
}

function Row({ label, value, className }) {
  return (
    <div className={cx('flex items-baseline justify-between gap-3', className)}>
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right font-mono tabular-nums">{value}</dd>
    </div>
  )
}
