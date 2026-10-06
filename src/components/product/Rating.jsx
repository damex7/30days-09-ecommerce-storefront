import { Icon } from '../ui/Icon.jsx'
import { cx } from '../../lib/cx.js'

/** Five stars plus the number. Read out as one phrase: "Rated 4.5 out of 5". */
export function Rating({ value, count, className, size = 'sm' }) {
  const filled = Math.round(value)
  return (
    <p className={cx('flex items-center gap-1.5 text-ink-soft', size === 'sm' ? 'text-xs' : 'text-sm', className)}>
      <span role="img" aria-label={`Rated ${value} out of 5`} className="flex text-kola-ink dark:text-kola">
        {[1, 2, 3, 4, 5].map((n) => (
          <Icon key={n} name="star" className={cx(size === 'sm' ? 'size-3.5' : 'size-4.5', n > filled && 'opacity-25')} />
        ))}
      </span>
      <span aria-hidden="true" className="font-mono tabular-nums">
        {value.toFixed(1)}
      </span>
      {count != null && <span>({count} {count === 1 ? 'review' : 'reviews'})</span>}
    </p>
  )
}
