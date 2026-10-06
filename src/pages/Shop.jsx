import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAsync } from '../hooks/useAsync.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { categoryLabel, getCategories, getProducts } from '../lib/store.js'
import { SORTS, hasActiveFilters, parseShopParams, toShopSearch, withFilters, DEFAULT_FILTERS } from '../lib/shopParams.js'
import { formatNaira, nairaToKobo } from '../lib/money.js'
import { plural } from '../lib/format.js'
import { FilterPanel } from '../components/shop/FilterPanel.jsx'
import { ProductGrid, ProductGridSkeleton } from '../components/product/ProductGrid.jsx'
import { Pagination } from '../components/ui/Pagination.jsx'
import { Sheet } from '../components/ui/Sheet.jsx'
import { EmptyState, ErrorState } from '../components/ui/States.jsx'
import { Button, buttonClass } from '../components/ui/Button.jsx'
import { Icon } from '../components/ui/Icon.jsx'
import { PAGE_SIZE } from '../config.js'

/*
  /shop: every filter, the sort and the page number live in the URL (see
  lib/shopParams.js). This component parses them, loads the matching
  products, and turns clicks back into URLs. There is no filter useState.
*/
export default function Shop() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const filters = useMemo(() => parseShopParams(searchParams), [searchParams])
  const key = toShopSearch(filters) // the canonical form: one cache entry, one effect run per real change
  const [sheetOpen, setSheetOpen] = useState(false)
  const resultsRef = useRef(null)

  const categories = useAsync((signal) => getCategories(signal), [])
  const results = useAsync((signal) => getProducts(filters, signal), [key])

  const categoryName = categories.data?.find((c) => c.slug === filters.category)?.name ?? (filters.category && categoryLabel(filters.category))
  const title = filters.q ? `Results for “${filters.q}”` : categoryName || 'All products'
  useDocumentTitle(filters.page > 1 ? `${title} (page ${filters.page})` : title)

  /** Apply filter changes by navigating: the URL is the state. */
  const update = (changes) => navigate(`/shop${toShopSearch(withFilters(filters, changes))}`)
  const hrefFor = (page) => `/shop${toShopSearch({ ...filters, page })}`

  // A page number past the end (e.g. ?page=40, or after narrowing a filter): go to the last real page.
  const pageCount = results.data?.pageCount
  useEffect(() => {
    if (results.status === 'success' && results.data.total > 0 && filters.page > pageCount) {
      navigate(hrefFor(pageCount), { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.status, pageCount, filters.page])

  // New page of results: bring the top of the list back into view.
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    resultsRef.current?.scrollIntoView({ block: 'start' })
  }, [filters.page])

  const data = results.data
  const loading = results.status === 'loading'
  const first = data ? (filters.page - 1) * PAGE_SIZE + 1 : 0
  const last = data ? Math.min(filters.page * PAGE_SIZE, data.total) : 0

  return (
    <div className="lg:grid lg:grid-cols-[15rem_1fr] lg:gap-8">
      <aside aria-label="Filters" className="hidden lg:block">
        <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-2xl border border-line bg-panel p-5">
          <FilterPanel filters={filters} categories={categories.data} onChange={update} idPrefix="side" />
        </div>
      </aside>

      <section aria-labelledby="results-title" ref={resultsRef} className="scroll-mt-40 lg:scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-xs font-semibold tracking-widest text-palm-ink uppercase">
              <Link to="/shop" className="hover:underline">
                Shop
              </Link>
              {categoryName && !filters.q && <> / {categoryName}</>}
            </p>
            <h1 id="results-title" className="mt-1 font-display text-2xl font-bold break-words sm:text-3xl">
              {title}
            </h1>
            {/* Announced when the results change, so screen-reader users know a filter worked. */}
            <p aria-live="polite" className="mt-1 text-sm text-ink-soft">
              {loading && !data
                ? 'Loading products…'
                : data
                  ? data.total === 0
                    ? 'No products found'
                    : `Showing ${first}–${last} of ${plural(data.total, 'product')}`
                  : ''}
            </p>
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Button variant="outline" className="shrink-0 lg:hidden" onClick={() => setSheetOpen(true)}>
              <Icon name="filter" className="size-4" />
              Filters
              {countFilters(filters) > 0 && (
                <span className="grid size-5 place-items-center rounded-full bg-palm text-xs text-on-palm">{countFilters(filters)}</span>
              )}
            </Button>
            <label className="flex min-w-0 flex-1 items-center gap-2 text-sm font-bold sm:flex-none">
              <span className="sr-only whitespace-nowrap sm:not-sr-only">Sort by</span>
              <select
                value={filters.sort}
                onChange={(e) => update({ sort: e.target.value })}
                className="h-11 w-full min-w-0 rounded-full border border-line-strong bg-panel pr-8 pl-4 text-sm font-bold sm:w-auto"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <ActiveFilters filters={filters} categoryName={categoryName} update={update} />

        <div className="mt-6">
          {results.status === 'error' ? (
            <ErrorState error={results.error} onRetry={results.retry} title="Couldn’t load products" />
          ) : !data ? (
            <ProductGridSkeleton count={PAGE_SIZE} />
          ) : data.total === 0 ? (
            <NoResults filters={filters} update={update} />
          ) : (
            // Keep the old page visible (dimmed) while the next one loads, so nothing jumps.
            <div aria-busy={loading} className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
              <ProductGrid products={data.products} headingLevel={2} />
              <Pagination page={Math.min(filters.page, data.pageCount)} pageCount={data.pageCount} hrefFor={hrefFor} />
            </div>
          )}
        </div>
      </section>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
        side="left"
        footer={
          <div className="flex gap-2">
            <Link to="/shop" onClick={() => setSheetOpen(false)} className={buttonClass('outline', 'md', 'flex-1')}>
              Clear all
            </Link>
            <Button className="flex-[2]" onClick={() => setSheetOpen(false)}>
              {data ? `Show ${plural(data.total, 'product')}` : 'Show products'}
            </Button>
          </div>
        }
      >
        <FilterPanel filters={filters} categories={categories.data} onChange={update} idPrefix="sheet" />
      </Sheet>
    </div>
  )
}

const countFilters = (f) =>
  [f.category, f.minPrice != null || f.maxPrice != null, f.minRating != null].filter(Boolean).length

/** Removable chips for each active filter: "Smartphones ×", "₦50,000 – ₦200,000 ×". */
function ActiveFilters({ filters, categoryName, update }) {
  if (!hasActiveFilters(filters)) return null
  const chips = []
  if (filters.q) chips.push({ label: `“${filters.q}”`, remove: { q: '' } })
  if (filters.category) chips.push({ label: categoryName, remove: { category: '' } })
  if (filters.minPrice != null || filters.maxPrice != null) {
    const min = filters.minPrice != null ? formatNaira(nairaToKobo(filters.minPrice)) : '₦0'
    const max = filters.maxPrice != null ? formatNaira(nairaToKobo(filters.maxPrice)) : 'any'
    chips.push({ label: `${min} – ${max}`, remove: { minPrice: null, maxPrice: null } })
  }
  if (filters.minRating) chips.push({ label: `${filters.minRating}★ & up`, remove: { minRating: null } })

  return (
    <ul className="mt-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
      {chips.map((chip) => (
        <li key={chip.label}>
          <button
            type="button"
            onClick={() => update(chip.remove)}
            className="flex min-h-9 items-center gap-1.5 rounded-full bg-indigo-soft py-1 pr-2 pl-3.5 text-sm font-bold text-indigo-ink hover:bg-indigo-soft/70"
          >
            {chip.label}
            <Icon name="x" className="size-4" />
            <span className="sr-only">Remove filter</span>
          </button>
        </li>
      ))}
      <li>
        <Link to="/shop" className="px-2 text-sm font-bold text-palm-ink underline underline-offset-4">
          Clear all
        </Link>
      </li>
    </ul>
  )
}

/** Empty results that suggest the most likely fix, not just "nothing found". */
function NoResults({ filters, update }) {
  const narrowing = filters.minPrice != null || filters.maxPrice != null || filters.minRating != null
  return (
    <EmptyState
      icon="search"
      title="Nothing on this stall"
      action={
        <>
          {narrowing && (
            <button type="button" className={buttonClass('outline')} onClick={() => update({ minPrice: null, maxPrice: null, minRating: null })}>
              Remove price and rating filters
            </button>
          )}
          <Link to={`/shop${toShopSearch(DEFAULT_FILTERS)}`} className={buttonClass('primary')}>
            See all products
          </Link>
        </>
      }
    >
      {filters.q ? (
        <>No products match “{filters.q}”. Check the spelling, or try a shorter word like “phone” or “watch”.</>
      ) : (
        <>No products match these filters. Try a wider price range or a lower rating.</>
      )}
    </EmptyState>
  )
}
