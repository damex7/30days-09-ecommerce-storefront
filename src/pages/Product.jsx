import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAsync } from '../hooks/useAsync.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { getProduct, getRelated } from '../lib/store.js'
import { formatNaira } from '../lib/money.js'
import { useStoreDispatch } from '../state/StoreContext.jsx'
import { recordView } from '../state/storeReducer.js'
import { Gallery } from '../components/product/Gallery.jsx'
import { Price } from '../components/product/Price.jsx'
import { Rating } from '../components/product/Rating.jsx'
import { StockBadge } from '../components/product/StockBadge.jsx'
import { AddToCart } from '../components/product/AddToCart.jsx'
import { Reviews } from '../components/product/Reviews.jsx'
import { ProductRow } from '../components/product/ProductRow.jsx'
import { RecentlyViewedRow } from '../components/product/RecentlyViewedRow.jsx'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States.jsx'
import { buttonClass } from '../components/ui/Button.jsx'
import { Icon } from '../components/ui/Icon.jsx'
import { DELIVERY, POD_STATES } from '../config.js'
import { formatList } from '../lib/format.js'

export default function Product() {
  const { id } = useParams()
  const validId = /^\d{1,6}$/.test(id ?? '')
  const product = useAsync(validId ? (signal) => getProduct(id, signal) : null, [id])
  const p = product.data

  useDocumentTitle(p?.title ?? (product.status === 'error' || !validId ? 'Product not found' : 'Loading…'))

  // Remember the visit for "Recently viewed" (once per product, after it loads).
  const dispatch = useStoreDispatch()
  useEffect(() => {
    if (product.status === 'success' && String(p.id) === id) dispatch(recordView(p))
  }, [product.status, p, id, dispatch])

  if (!validId || product.error?.kind === 'notfound') {
    return (
      <EmptyState
        icon="search"
        title="Product not found"
        action={
          <Link to="/shop" className={buttonClass('primary')}>
            Browse the shop
          </Link>
        }
      >
        This product may have been removed, or the link may be wrong.
      </EmptyState>
    )
  }
  if (product.status === 'error') return <ErrorState error={product.error} onRetry={product.retry} title="Couldn’t load this product" />
  // While loading a NEW product, don't show the old one's details.
  if (!p || String(p.id) !== id) return <ProductSkeleton />

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm">
        <ol className="flex flex-wrap items-center gap-1.5 text-ink-faint">
          <li>
            <Link to="/shop" className="font-bold text-palm-ink hover:underline">
              Shop
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to={`/shop?category=${p.category}`} className="font-bold text-palm-ink hover:underline">
              {p.categoryName}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="truncate">
            {p.title}
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <Gallery key={p.id} title={p.title} images={p.images} discountPct={p.discountPct} />

        <div>
          {p.brand && <p className="text-sm font-bold tracking-wide text-ink-faint uppercase">{p.brand}</p>}
          <h1 className="mt-1 font-display text-2xl leading-tight font-bold text-balance sm:text-3xl">{p.title}</h1>
          <a href="#reviews" className="mt-2 inline-block rounded-md hover:underline">
            <Rating value={p.rating} count={p.reviewCount} size="md" />
          </a>

          <div className="mt-5 rounded-2xl border border-line bg-panel p-4 sm:p-5">
            <Price priceKobo={p.priceKobo} wasKobo={p.wasKobo} size="lg" />
            {p.wasKobo && (
              <p className="mt-1 text-sm font-bold text-leaf">
                You save {formatNaira(p.wasKobo - p.priceKobo)} ({p.discountPct}%)
              </p>
            )}
            <StockBadge product={p} className="mt-3" />
            <AddToCart key={p.id} product={p} />
          </div>

          <DeliveryInfo product={p} />

          <h2 className="mt-8 font-display text-lg font-bold">About this product</h2>
          <p className="mt-2 leading-relaxed text-ink-soft">{p.description}</p>
        </div>
      </div>

      <Reviews product={p} />
      <Related product={p} />
      <RecentlyViewedRow excludeId={p.id} />
    </>
  )
}

function DeliveryInfo({ product }) {
  const lagos = DELIVERY.feesByState.Lagos
  const rows = [
    {
      icon: 'truck',
      title: `Delivery ${formatNaira(lagos)} in Lagos, ${formatNaira(DELIVERY.defaultFeeKobo)} elsewhere`,
      text: `Free on orders of ${formatNaira(DELIVERY.freeOverKobo)} or more. ${DELIVERY.etaByState.Lagos} in Lagos, ${DELIVERY.defaultEta} elsewhere.`,
    },
    { icon: 'cash', title: 'Pay on delivery available', text: `In ${formatList(POD_STATES)}.` },
    product.warranty && { icon: 'check', title: 'Warranty', text: product.warranty },
    product.returnPolicy && { icon: 'retry', title: 'Returns', text: product.returnPolicy },
  ].filter(Boolean)
  return (
    <ul className="mt-5 divide-y divide-line rounded-2xl border border-line">
      {rows.map((r) => (
        <li key={r.title} className="flex gap-3 p-4 text-sm">
          <Icon name={r.icon} className="mt-0.5 size-5 shrink-0 text-indigo-ink" />
          <span>
            <span className="block font-bold">{r.title}</span>
            <span className="block text-ink-soft">{r.text}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

function Related({ product }) {
  const related = useAsync((signal) => getRelated(product, signal), [product.id])
  return (
    <ProductRow
      title={`More in ${product.categoryName}`}
      products={related.data}
      status={related.status}
      error={related.error}
      onRetry={related.retry}
      seeAllTo={`/shop?category=${product.category}`}
    />
  )
}

function ProductSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12" aria-busy="true">
      <span className="sr-only" role="status">
        Loading product…
      </span>
      <Skeleton className="aspect-square rounded-3xl" />
      <div>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-9 w-4/5" />
        <Skeleton className="mt-3 h-4 w-40" />
        <Skeleton className="mt-6 h-48 rounded-2xl" />
        <Skeleton className="mt-5 h-32 rounded-2xl" />
      </div>
    </div>
  )
}
