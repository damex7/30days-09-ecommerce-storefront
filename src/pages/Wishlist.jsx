import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useCart, useStore, useStoreDispatch } from '../state/StoreContext.jsx'
import { useUI } from '../state/UIContext.jsx'
import { addToCart, addableQuantity, toggleWishlist } from '../state/storeReducer.js'
import { cardFromSnapshot } from '../lib/store.js'
import { plural } from '../lib/format.js'
import { ProductCard } from '../components/product/ProductCard.jsx'
import { WishlistButton } from '../components/product/WishlistButton.jsx'
import { RecentlyViewedRow } from '../components/product/RecentlyViewedRow.jsx'
import { EmptyState } from '../components/ui/States.jsx'
import { Button, buttonClass } from '../components/ui/Button.jsx'
import { Icon } from '../components/ui/Icon.jsx'

export default function Wishlist() {
  useDocumentTitle('Wishlist')
  const { wishlist } = useStore()

  if (wishlist.length === 0) {
    return (
      <>
        <EmptyState
          icon="heart"
          title="Your wishlist is empty"
          action={
            <Link to="/shop" className={buttonClass('primary')}>
              Browse the shop
            </Link>
          }
        >
          Tap the heart on any product to save it here for later. Saved items stay on this device.
        </EmptyState>
        <RecentlyViewedRow title="Recently viewed" />
      </>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Wishlist</h1>
        <p className="text-sm text-ink-soft">{plural(wishlist.length, 'saved item')}</p>
      </div>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {wishlist.map((snapshot) => (
          <li key={snapshot.id} className="flex flex-col gap-2">
            <ProductCard product={cardFromSnapshot(snapshot)} headingLevel={2} actions={<WishlistButton product={snapshot} compact />} />
            <MoveToCart snapshot={snapshot} />
          </li>
        ))}
      </ul>
      <RecentlyViewedRow title="Recently viewed" />
    </>
  )
}

/** Adds one to the cart and takes it off the wishlist, within the same stock limits as everywhere else. */
function MoveToCart({ snapshot }) {
  const cart = useCart()
  const dispatch = useStoreDispatch()
  const { openCart } = useUI()
  const addable = addableQuantity(cart, snapshot)
  const soldOut = snapshot.stock <= 0

  function move() {
    dispatch(addToCart(snapshot, 1))
    dispatch(toggleWishlist(snapshot))
    openCart(snapshot.id)
  }

  return (
    <Button variant="secondary" size="sm" className="w-full" onClick={move} disabled={addable === 0}>
      <Icon name="bag" className="size-4" />
      {soldOut ? 'Out of stock' : addable === 0 ? 'All in your cart' : 'Move to cart'}
      {!soldOut && addable > 0 && <span className="sr-only">: {snapshot.title}</span>}
    </Button>
  )
}
