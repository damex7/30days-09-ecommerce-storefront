import { useIsWishlisted, useStoreDispatch } from '../../state/StoreContext.jsx'
import { toggleWishlist } from '../../state/storeReducer.js'
import { Icon } from '../ui/Icon.jsx'
import { cx } from '../../lib/cx.js'

/*
  A toggle button: aria-pressed tells screen readers whether it's on, so
  the label stays the same ("Save to wishlist") and doesn't flip-flop.
  On cards it's icon-only, so the label includes the product name, or a
  page of 12 cards would have 12 identical "Save to wishlist" buttons.
*/
export function WishlistButton({ product, compact = false, className }) {
  const saved = useIsWishlisted(product.id)
  const dispatch = useStoreDispatch()
  const onClick = () => dispatch(toggleWishlist(product))

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        className={cx(
          'grid size-10 place-items-center rounded-full bg-panel/90 shadow-card backdrop-blur transition-colors hover:bg-panel',
          saved ? 'text-palm' : 'text-ink-soft',
          className,
        )}
      >
        <Icon name={saved ? 'heartSolid' : 'heart'} className="size-5" />
        <span className="sr-only">Save {product.title} to wishlist</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      className={cx(
        'inline-flex min-h-13 items-center justify-center gap-2 rounded-full border px-5 font-bold transition-colors',
        saved ? 'border-palm bg-palm-soft text-palm-ink' : 'border-line-strong bg-panel text-ink hover:bg-panel-2',
        className,
      )}
    >
      <Icon name={saved ? 'heartSolid' : 'heart'} className={cx('size-5', saved && 'text-palm')} />
      {saved ? 'Saved' : 'Save'}
      <span className="sr-only"> to wishlist</span>
    </button>
  )
}
