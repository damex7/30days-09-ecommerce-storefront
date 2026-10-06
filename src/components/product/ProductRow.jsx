import { Link } from 'react-router-dom'
import { ProductCard } from './ProductCard.jsx'
import { WishlistButton } from './WishlistButton.jsx'
import { CardSkeleton } from './ProductGrid.jsx'
import { ErrorState } from '../ui/States.jsx'
import { cx } from '../../lib/cx.js'

/*
  A titled row of products (Featured, Related, Recently viewed). On phones
  it scrolls sideways with snap points; on wider screens it's a 4-up grid.
*/
const ITEM = 'w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-auto'
const TRACK = '-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible lg:px-0'

export function ProductRow({ title, products, status = 'success', error, onRetry, seeAllTo, action, className }) {
  if (status === 'success' && !products?.length) return null
  const headingId = `row-${title.replace(/\W+/g, '-').toLowerCase()}`
  return (
    <section aria-labelledby={headingId} className={cx('mt-12', className)}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 id={headingId} className="font-display text-xl font-bold sm:text-2xl">
          {title}
        </h2>
        {seeAllTo && (
          <Link to={seeAllTo} className="shrink-0 text-sm font-bold text-palm-ink underline-offset-4 hover:underline">
            See all
          </Link>
        )}
        {action}
      </div>

      {status === 'error' ? (
        <ErrorState error={error} onRetry={onRetry} title={`Couldn’t load ${title.toLowerCase()}`} />
      ) : status === 'success' ? (
        <ul className={TRACK}>
          {products.map((p) => (
            <li key={p.id} className={ITEM}>
              <ProductCard product={p} actions={<WishlistButton product={p} compact />} />
            </li>
          ))}
        </ul>
      ) : (
        <div className={TRACK} aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={ITEM}>
              <CardSkeleton />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
