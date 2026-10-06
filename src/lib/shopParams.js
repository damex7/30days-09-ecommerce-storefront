/*
  The /shop page keeps ALL of its state in the URL:
    /shop?q=phone&category=smartphones&minPrice=50000&maxPrice=900000&minRating=4&sort=price-asc&page=2

  That means refresh, Back/Forward, bookmarks and shared links all just work,
  and there's no useState to keep in sync with the address bar.

  The URL is user input, so it's parsed defensively: anything invalid
  (?page=banana, ?sort=cheapest) falls back to the default instead of
  breaking the page. Prices in the URL are WHOLE NAIRA, because that's what
  people type; they become kobo only when filtering.
*/

export const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high', sortBy: 'price', order: 'asc' },
  { value: 'price-desc', label: 'Price: high to low', sortBy: 'price', order: 'desc' },
  { value: 'rating', label: 'Top rated', sortBy: 'rating', order: 'desc' },
  { value: 'name', label: 'Name: A to Z', sortBy: 'title', order: 'asc' },
]

export const RATING_OPTIONS = [4, 3, 2]

export const DEFAULT_FILTERS = {
  q: '',
  category: '',
  minPrice: null,
  maxPrice: null,
  minRating: null,
  sort: 'featured',
  page: 1,
}

const MAX_NAIRA = 1_000_000_000

function parseNaira(value) {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isInteger(n) && n >= 0 && n <= MAX_NAIRA ? n : null
}

export function parseShopParams(searchParams) {
  const q = (searchParams.get('q') ?? '').trim().slice(0, 80)
  const category = (searchParams.get('category') ?? '').trim()
  let minPrice = parseNaira(searchParams.get('minPrice'))
  let maxPrice = parseNaira(searchParams.get('maxPrice'))
  // "min 50,000, max 10,000" is almost certainly the two boxes swapped.
  if (minPrice != null && maxPrice != null && minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice]

  const rating = Number(searchParams.get('minRating'))
  const minRating = RATING_OPTIONS.includes(rating) ? rating : null

  const sortValue = searchParams.get('sort')
  const sort = SORTS.some((s) => s.value === sortValue) ? sortValue : 'featured'

  const pageNum = Number(searchParams.get('page'))
  const page = Number.isInteger(pageNum) && pageNum >= 1 ? pageNum : 1

  return { q, category: /^[a-z0-9-]{1,40}$/.test(category) ? category : '', minPrice, maxPrice, minRating, sort, page }
}

/** Filters back to URL params, leaving out defaults so URLs stay short. */
export function toShopSearch(filters) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value == null || value === '' || value === DEFAULT_FILTERS[key]) continue
    params.set(key, String(value))
  }
  const s = params.toString()
  return s ? `?${s}` : ''
}

/** Apply a change and go back to page 1 (any filter change makes the old page number meaningless). */
export function withFilters(filters, changes) {
  return { ...filters, page: 1, ...changes }
}

export const hasActiveFilters = (f) =>
  Boolean(f.q || f.category || f.minPrice != null || f.maxPrice != null || f.minRating != null)

export const getSort = (value) => SORTS.find((s) => s.value === value) ?? SORTS[0]
