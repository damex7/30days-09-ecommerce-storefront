import { useEffect, useId, useState } from 'react'
import { RATING_OPTIONS } from '../../lib/shopParams.js'
import { Icon } from '../ui/Icon.jsx'
import { Button } from '../ui/Button.jsx'
import { cx } from '../../lib/cx.js'

/*
  The filters. It holds no filter state of its own: it reads the current
  filters (parsed from the URL) and calls onChange({ ...changes }), and the
  Shop page writes those changes back to the URL.

  The one exception is the price boxes: typing "50000" shouldn't fire a
  new search on every keystroke, so they're a small form you submit.
*/
export function FilterPanel({ filters, categories, onChange, idPrefix = 'f' }) {
  return (
    <div className="space-y-7">
      <CategoryFilter filters={filters} categories={categories} onChange={onChange} name={`${idPrefix}-category`} />
      <PriceFilter filters={filters} onChange={onChange} />
      <RatingFilter filters={filters} onChange={onChange} name={`${idPrefix}-rating`} />
    </div>
  )
}

const legend = 'mb-3 font-display text-sm font-bold tracking-wide'
const optionRow =
  'flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm hover:bg-panel-2 has-[:checked]:bg-indigo-soft has-[:checked]:font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus'

function CategoryFilter({ filters, categories, onChange, name }) {
  const options = [{ slug: '', name: 'All categories' }, ...(categories ?? [])]
  return (
    <fieldset>
      <legend className={legend}>Category</legend>
      <div className="-mx-2 max-h-72 space-y-0.5 overflow-y-auto pr-1 lg:max-h-96">
        {options.map((c) => (
          <label key={c.slug || 'all'} className={optionRow}>
            <input
              type="radio"
              name={name}
              value={c.slug}
              checked={filters.category === c.slug}
              onChange={() => onChange({ category: c.slug })}
              className="size-4 accent-indigo focus-visible:outline-none"
            />
            {c.name}
          </label>
        ))}
        {!categories && <p className="px-2 py-2 text-sm text-ink-faint">Loading categories…</p>}
      </div>
    </fieldset>
  )
}

function PriceFilter({ filters, onChange }) {
  const id = useId()
  const [min, setMin] = useState(filters.minPrice ?? '')
  const [max, setMax] = useState(filters.maxPrice ?? '')

  // When the URL changes (Clear filters, Back button), show what it now says.
  useEffect(() => {
    setMin(filters.minPrice ?? '')
    setMax(filters.maxPrice ?? '')
  }, [filters.minPrice, filters.maxPrice])

  // Whole naira only: strip commas, spaces and "₦" people may type or paste.
  const clean = (v) => {
    const digits = String(v).replace(/[^\d]/g, '')
    return digits === '' ? null : Number(digits)
  }

  function submit(e) {
    e.preventDefault()
    onChange({ minPrice: clean(min), maxPrice: clean(max) })
  }

  const input =
    'h-11 w-full rounded-xl border border-line-strong bg-panel pr-2 pl-7 font-mono text-sm tabular-nums placeholder:font-sans placeholder:text-ink-faint'
  return (
    <form onSubmit={submit}>
      <fieldset>
        <legend className={legend}>Price (₦)</legend>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor={`${id}-min`} className="mb-1 block text-xs font-bold text-ink-soft">
              Min
            </label>
            <div className="relative">
              <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-ink-faint">
                ₦
              </span>
              <input id={`${id}-min`} inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} placeholder="0" className={input} />
            </div>
          </div>
          <span aria-hidden="true" className="pb-3 text-ink-faint">
            –
          </span>
          <div className="flex-1">
            <label htmlFor={`${id}-max`} className="mb-1 block text-xs font-bold text-ink-soft">
              Max
            </label>
            <div className="relative">
              <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-ink-faint">
                ₦
              </span>
              <input id={`${id}-max`} inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} placeholder="Any" className={input} />
            </div>
          </div>
        </div>
        <Button type="submit" variant="secondary" size="sm" className="mt-3 w-full">
          Apply price
        </Button>
      </fieldset>
    </form>
  )
}

function RatingFilter({ filters, onChange, name }) {
  const options = [{ value: null, label: 'Any rating' }, ...RATING_OPTIONS.map((r) => ({ value: r, label: `${r} stars & up` }))]
  return (
    <fieldset>
      <legend className={legend}>Customer rating</legend>
      <div className="-mx-2 space-y-0.5">
        {options.map((o) => (
          <label key={o.label} className={optionRow}>
            <input
              type="radio"
              name={name}
              checked={filters.minRating === o.value}
              onChange={() => onChange({ minRating: o.value })}
              className="size-4 accent-indigo focus-visible:outline-none"
            />
            <span className="flex items-center gap-1.5">
              {o.value && (
                <span aria-hidden="true" className="flex text-kola-ink dark:text-kola">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Icon key={n} name="star" className={cx('size-3.5', n > o.value && 'opacity-25')} />
                  ))}
                </span>
              )}
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
