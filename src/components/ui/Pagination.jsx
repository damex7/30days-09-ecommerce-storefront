import { Link } from 'react-router-dom'
import { Icon } from './Icon.jsx'
import { cx } from '../../lib/cx.js'

/** [1, '…', 4, 5, 6, '…', 17]: first, last, and a window around the current page. */
function pageList(page, count) {
  const pages = new Set([1, count, page - 1, page, page + 1].filter((p) => p >= 1 && p <= count))
  const sorted = [...pages].sort((a, b) => a - b)
  const out = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(`gap-${p}`)
    out.push(p)
  })
  return out
}

/*
  Real links (not buttons), so every page has its own URL, works with
  middle-click / open-in-new-tab, and the Back button walks back through pages.
*/
export function Pagination({ page, pageCount, hrefFor }) {
  if (pageCount <= 1) return null
  const item = 'grid min-w-11 h-11 place-items-center rounded-full px-3 text-sm font-bold'
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1">
      <PageArrow to={page > 1 ? hrefFor(page - 1) : null} icon="left" label="Previous page" />
      <p className="px-3 text-sm font-bold sm:hidden">
        Page {page} of {pageCount}
      </p>
      <ul className="hidden items-center gap-1 sm:flex">
        {pageList(page, pageCount).map((p) =>
          typeof p === 'string' ? (
            <li key={p} aria-hidden="true" className="px-1 text-ink-faint">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                to={hrefFor(p)}
                aria-current={p === page ? 'page' : undefined}
                className={cx(item, p === page ? 'bg-indigo text-on-indigo' : 'hover:bg-panel-2')}
              >
                <span className="sr-only">Page </span>
                {p}
              </Link>
            </li>
          ),
        )}
      </ul>
      <PageArrow to={page < pageCount ? hrefFor(page + 1) : null} icon="right" label="Next page" />
    </nav>
  )
}

function PageArrow({ to, icon, label }) {
  const cls = 'grid size-11 place-items-center rounded-full border border-line-strong/60'
  if (!to)
    return (
      <span className={cx(cls, 'opacity-35')} aria-hidden="true">
        <Icon name={icon} />
      </span>
    )
  return (
    <Link to={to} className={cx(cls, 'bg-panel hover:bg-panel-2')}>
      <Icon name={icon} />
      <span className="sr-only">{label}</span>
    </Link>
  )
}
