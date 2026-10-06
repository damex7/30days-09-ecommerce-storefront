import { formatNaira } from '../../lib/money.js'
import { cx } from '../../lib/cx.js'

/*
  Price with the old price shown as "was ₦X". The old price is struck
  through for sighted users, and the visible word "was" makes it clear to
  everyone (screen readers often don't announce <del> at all).
*/
export function Price({ priceKobo, wasKobo, size = 'md', className }) {
  const big = size === 'lg'
  return (
    <p className={cx('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
      <span className={cx('font-mono font-semibold tabular-nums text-ink', big ? 'text-3xl' : 'text-base')}>
        {wasKobo && <span className="sr-only">Now </span>}
        {formatNaira(priceKobo)}
      </span>
      {wasKobo && (
        <span className={cx('text-ink-faint', big ? 'text-base' : 'text-xs')}>
          was <del className="font-mono tabular-nums">{formatNaira(wasKobo)}</del>
        </span>
      )}
    </p>
  )
}

/** A kola-gold sticker, like the hand-written price tags on market stalls. */
export function DiscountSticker({ pct, className }) {
  if (!pct) return null
  return (
    <span
      className={cx(
        'inline-block -rotate-6 rounded-md bg-kola px-1.5 py-0.5 font-mono text-xs font-semibold text-on-kola shadow-card',
        className,
      )}
    >
      −{pct}%<span className="sr-only"> off</span>
    </span>
  )
}
