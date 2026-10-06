import { useStore } from '../../state/StoreContext.jsx'
import { cardFromSnapshot } from '../../lib/store.js'
import { ProductRow } from './ProductRow.jsx'

/** The last products you opened (newest first), from the store's recentlyViewed list. */
export function RecentlyViewedRow({ excludeId, title = 'Recently viewed' }) {
  const { recentlyViewed } = useStore()
  const products = recentlyViewed
    .filter((p) => p.id !== excludeId)
    .slice(0, 8)
    .map(cardFromSnapshot)
  return <ProductRow title={title} products={products} />
}
