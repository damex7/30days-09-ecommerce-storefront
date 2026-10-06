import { ProductCard } from './ProductCard.jsx'
import { Skeleton } from '../ui/States.jsx'
import { cx } from '../../lib/cx.js'

const GRID = 'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4'

export function ProductGrid({ products, className, headingLevel }) {
  return (
    <ul className={cx(GRID, className)}>
      {products.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  )
}

/** Same grid, same card proportions, so nothing jumps when the products arrive. */
export function ProductGridSkeleton({ count = 8, className }) {
  return (
    <div className={cx(GRID, className)} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-panel p-2.5">
      <Skeleton className="aspect-square rounded-xl" />
      <Skeleton className="mt-3 h-3 w-1/3" />
      <Skeleton className="mt-2 h-4 w-5/6" />
      <Skeleton className="mt-2 h-3 w-1/2" />
      <Skeleton className="mt-3 h-5 w-2/5" />
    </div>
  )
}
