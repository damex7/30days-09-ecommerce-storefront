import { useEffect, useId, useState } from 'react'
import { Icon } from '../ui/Icon.jsx'
import { cx } from '../../lib/cx.js'

/*
  − [ 2 ] +   with the limits enforced: the buttons disable at `min` and
  at `max`, and anything typed is clamped when you leave the box (or press
  Enter). While typing, the box may briefly hold "" or "1" on the way to
  "12", so we only commit a real number.
*/
export function QuantityPicker({ value, onChange, max, min = 1, label = 'Quantity', showLabel = false, size = 'md', title }) {
  const id = useId()
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])

  const clamp = (n) => Math.max(min, Math.min(max, n))
  function commit() {
    const n = parseInt(draft, 10)
    const next = Number.isFinite(n) ? clamp(n) : value
    setDraft(String(next))
    if (next !== value) onChange(next)
  }

  const small = size === 'sm'
  const btn = cx(
    'grid place-items-center rounded-full transition-colors hover:bg-panel-2 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent',
    small ? 'size-9' : 'size-11',
  )
  // On cart lines the names include the product, so each line's buttons are distinguishable.
  const what = title ? ` of ${title}` : ''
  return (
    <div>
      <label htmlFor={id} className={showLabel ? 'mb-1.5 block text-sm font-bold' : 'sr-only'}>
        {label}
        {title && <span className="sr-only"> of {title}</span>}
      </label>
      <div className="inline-flex items-center rounded-full border border-line-strong bg-panel p-0.5">
        <button type="button" className={btn} onClick={() => onChange(clamp(value - 1))} disabled={value <= min}>
          <Icon name="minus" className="size-4" />
          <span className="sr-only">Decrease quantity{what}</span>
        </button>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, '').slice(0, 4))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            }
          }}
          className={cx('bg-transparent text-center font-mono font-semibold tabular-nums', small ? 'w-9 text-sm' : 'w-12')}
        />
        <button type="button" className={btn} onClick={() => onChange(clamp(value + 1))} disabled={value >= max}>
          <Icon name="plus" className="size-4" />
          <span className="sr-only">Increase quantity{what}</span>
        </button>
      </div>
    </div>
  )
}
