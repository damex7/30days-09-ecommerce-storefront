import { useEffect, useId, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Icon } from '../ui/Icon.jsx'
import { cx } from '../../lib/cx.js'

/*
  A plain <form role="search">: pressing Enter submits, and submitting goes
  to /shop?q=... . The URL is the single source of truth for the search, so
  the box is pre-filled from it (e.g. after a refresh or a shared link).
*/
export function SearchBar({ className, size = 'md', autoFocus = false }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const urlQuery = params.get('q') ?? ''
  const [text, setText] = useState(urlQuery)
  const id = useId()

  // Keep the box in step with the URL when it changes elsewhere (Back button, "Clear filters").
  useEffect(() => setText(urlQuery), [urlQuery])

  function submit(e) {
    e.preventDefault()
    const q = text.trim()
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop')
  }

  const big = size === 'lg'
  return (
    <form role="search" onSubmit={submit} className={cx('relative', className)}>
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <input
        id={id}
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Search phones, perfume, shoes…"
        autoFocus={autoFocus}
        enterKeyHint="search"
        className={cx(
          'w-full rounded-full border border-line-strong bg-panel text-ink placeholder:text-ink-faint',
          big ? 'h-14 pr-16 pl-5 text-base sm:pr-32' : 'h-11 pr-12 pl-4 text-sm',
        )}
      />
      <button
        type="submit"
        className={cx(
          'absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center gap-2 rounded-full bg-palm font-bold text-on-palm transition-colors hover:bg-palm-hover',
          big ? 'size-11 justify-center sm:w-auto sm:px-5' : 'size-8 justify-center',
        )}
      >
        <Icon name="search" className={big ? 'size-5' : 'size-4'} />
        <span className={big ? 'sr-only sm:not-sr-only' : 'sr-only'}>Search</span>
      </button>
    </form>
  )
}
