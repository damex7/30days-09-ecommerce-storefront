import { request, MINUTE } from './request.js'
import { nairaToKobo, roundRetail, usdToKobo } from './money.js'
import { getSort } from './shopParams.js'
import { LOW_STOCK_AT, PAGE_SIZE } from '../config.js'

/*
  Everything the app knows about DummyJSON lives in this file. Components
  never see a raw DummyJSON object, only the clean shape from the
  normalisers below. If we swapped DummyJSON for a real backend tomorrow,
  only this file would change.
*/

const BASE = 'https://dummyjson.com'
const TTL = 10 * MINUTE

// Only the fields a product card needs: smaller responses and a smaller cache.
const CARD_FIELDS = 'id,title,price,discountPercentage,rating,stock,thumbnail,category,brand'

/* ---------- Normalisers ---------- */

/** "mens-shirts" → "Mens shirts" (used until the category list has loaded). */
export const categoryLabel = (slug) => {
  const words = String(slug ?? '').replace(/-/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

const availabilityOf = (stock) => (stock <= 0 ? 'out' : stock < LOW_STOCK_AT ? 'low' : 'in')

/*
  Price and discount. DummyJSON gives a `price` and a `discountPercentage`.
  We treat `price` as TODAY's selling price and work out what it "was"
  before the discount. That way the server's sortBy=price sorts by exactly
  the price the customer sees.
  This is the ONE place dollars become kobo (see usdToKobo in money.js).
*/
function pricing(raw) {
  const priceKobo = usdToKobo(raw.price)
  const pct = Number(raw.discountPercentage)
  let wasKobo = null
  if (Number.isFinite(pct) && pct >= 1 && pct < 90) {
    const was = roundRetail(Math.round(priceKobo / (1 - pct / 100)))
    if (was > priceKobo) wasKobo = was
  }
  // Show the discount we can actually see after rounding, not the raw 10.48%.
  const discountPct = wasKobo ? Math.round((1 - priceKobo / wasKobo) * 100) : 0
  return { priceKobo, wasKobo, discountPct }
}

function normaliseSummary(raw) {
  const stock = Math.max(0, Math.floor(Number(raw.stock) || 0))
  return {
    id: raw.id,
    title: String(raw.title ?? 'Untitled product'),
    brand: raw.brand ? String(raw.brand) : '',
    category: String(raw.category ?? ''),
    categoryName: categoryLabel(raw.category),
    ...pricing(raw),
    rating: Math.round((Number(raw.rating) || 0) * 10) / 10,
    stock,
    availability: availabilityOf(stock),
    thumbnail: raw.thumbnail ?? '',
  }
}

function normaliseProduct(raw) {
  const images = Array.isArray(raw.images) && raw.images.length ? raw.images : [raw.thumbnail].filter(Boolean)
  const reviews = (Array.isArray(raw.reviews) ? raw.reviews : []).map((r) => ({
    name: String(r.reviewerName ?? 'A customer'),
    rating: Math.max(0, Math.min(5, Math.round(Number(r.rating) || 0))),
    comment: String(r.comment ?? ''),
    date: r.date ?? null,
  }))
  return {
    ...normaliseSummary(raw),
    description: String(raw.description ?? ''),
    images,
    reviews,
    reviewCount: reviews.length,
    shipping: raw.shippingInformation ?? '',
    warranty: raw.warrantyInformation ?? '',
    returnPolicy: raw.returnPolicy ?? '',
  }
}

/** A saved snapshot (cart, wishlist, recently viewed) back into the shape a ProductCard needs. */
export function cardFromSnapshot(s) {
  return {
    ...s,
    categoryName: categoryLabel(s.category),
    availability: availabilityOf(s.stock),
    discountPct: s.wasKobo ? Math.round((1 - s.priceKobo / s.wasKobo) * 100) : 0,
  }
}

const normaliseList = (json) => ({
  products: (json?.products ?? []).map(normaliseSummary),
  total: Number(json?.total) || 0,
})

/* ---------- Endpoints ---------- */

export function getCategories(signal) {
  return request(`${BASE}/products/categories`, {
    signal,
    ttl: 60 * MINUTE,
    select: (json) => (Array.isArray(json) ? json : []).map((c) => ({ slug: c.slug, name: c.name })),
  })
}

/** DummyJSON has no "featured" flag, so featured = the top-rated products. */
export function getFeatured(signal, limit = 8) {
  return request(`${BASE}/products?limit=${limit}&sortBy=rating&order=desc&select=${CARD_FIELDS}`, {
    signal,
    ttl: TTL,
    select: (json) => normaliseList(json).products,
  })
}

export function getProduct(id, signal) {
  return request(`${BASE}/products/${encodeURIComponent(id)}`, { signal, ttl: TTL, select: normaliseProduct })
}

export async function getRelated(product, signal, limit = 8) {
  const { products } = await request(
    `${BASE}/products/category/${encodeURIComponent(product.category)}?limit=${limit + 1}&select=${CARD_FIELDS}`,
    { signal, ttl: TTL, select: normaliseList },
  )
  return products.filter((p) => p.id !== product.id).slice(0, limit)
}

/*
  The shop listing. DummyJSON can sort and paginate (limit, skip, sortBy,
  order), but it CAN'T filter by price or rating, and its search endpoint
  ignores the category. So there are two modes:

  SERVER MODE: no price/rating filter, and at most ONE of search/category.
    DummyJSON does all the work and sends back just one page. Cheapest.

  CLIENT MODE: anything else. We ask for the whole scope in one request
    (limit=0, still sorted by the server; at most ~194 products, cached),
    then filter by price (in kobo), rating and category here, and cut the
    page out ourselves. A real backend would do this filtering in its
    database; with this API, this is the honest way to get correct results
    AND correct page counts.

  Either way the caller gets the same shape: { products, total, pageCount }.
*/
export async function getProducts(filters, signal) {
  const sort = getSort(filters.sort)
  const sortQuery = sort.sortBy ? `&sortBy=${sort.sortBy}&order=${sort.order}` : ''
  const needsClientFilter =
    filters.minPrice != null || filters.maxPrice != null || filters.minRating != null || (filters.q && filters.category)

  const scope = filters.q
    ? `${BASE}/products/search?q=${encodeURIComponent(filters.q)}&`
    : filters.category
      ? `${BASE}/products/category/${encodeURIComponent(filters.category)}?`
      : `${BASE}/products?`

  if (!needsClientFilter) {
    const skip = (filters.page - 1) * PAGE_SIZE
    const { products, total } = await request(`${scope}limit=${PAGE_SIZE}&skip=${skip}&select=${CARD_FIELDS}${sortQuery}`, {
      signal,
      ttl: TTL,
      select: normaliseList,
    })
    return { products, total, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)), mode: 'server' }
  }

  const { products: all } = await request(`${scope}limit=0&select=${CARD_FIELDS}${sortQuery}`, {
    signal,
    ttl: TTL,
    select: normaliseList,
  })
  const min = filters.minPrice != null ? nairaToKobo(filters.minPrice) : 0
  const max = filters.maxPrice != null ? nairaToKobo(filters.maxPrice) : Infinity
  const matching = all.filter(
    (p) =>
      (!filters.q || !filters.category || p.category === filters.category) &&
      p.priceKobo >= min &&
      p.priceKobo <= max &&
      (filters.minRating == null || p.rating >= filters.minRating),
  )
  const start = (filters.page - 1) * PAGE_SIZE
  return {
    products: matching.slice(start, start + PAGE_SIZE),
    total: matching.length,
    pageCount: Math.max(1, Math.ceil(matching.length / PAGE_SIZE)),
    mode: 'client',
  }
}
