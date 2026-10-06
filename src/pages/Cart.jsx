import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useCartTotals, useStoreDispatch } from '../state/StoreContext.jsx'
import { clearCart } from '../state/storeReducer.js'
import { CartLine } from '../components/cart/CartLine.jsx'
import { CartSummary } from '../components/cart/CartSummary.jsx'
import { PromoCode } from '../components/cart/PromoCode.jsx'
import { UndoBar } from '../components/cart/UndoBar.jsx'
import { RecentlyViewedRow } from '../components/product/RecentlyViewedRow.jsx'
import { EmptyState } from '../components/ui/States.jsx'
import { buttonClass } from '../components/ui/Button.jsx'
import { Icon } from '../components/ui/Icon.jsx'
import { formatNaira } from '../lib/money.js'
import { plural } from '../lib/format.js'

export default function Cart() {
  useDocumentTitle('Your cart')
  const totals = useCartTotals()
  const dispatch = useStoreDispatch()

  if (totals.itemCount === 0) {
    return (
      <>
        <UndoBar />
        <EmptyState
          icon="bag"
          title="Your cart is empty"
          action={
            <>
              <Link to="/wishlist" className={buttonClass('outline')}>
                Check your wishlist
              </Link>
              <Link to="/shop" className={buttonClass('primary')}>
                Start shopping
              </Link>
            </>
          }
        >
          Nothing here yet. Find something you like and tap “Add to cart”.
        </EmptyState>
        <RecentlyViewedRow title="Recently viewed" />
      </>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Your cart</h1>
        <p className="text-sm text-ink-soft">{plural(totals.itemCount, 'item')}</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <section aria-label="Items in your cart">
          <UndoBar />
          <ul className="space-y-2 rounded-3xl border border-line bg-panel p-2 sm:p-3">
            {totals.lines.map((line) => (
              <CartLine key={line.id} line={line} />
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap justify-between gap-2">
            <Link to="/shop" className={buttonClass('ghost', 'sm')}>
              <Icon name="back" className="size-4" />
              Keep shopping
            </Link>
            <button
              type="button"
              // Emptying the whole cart can't be undone, so ask first.
              onClick={() => window.confirm('Remove everything from your cart?') && dispatch(clearCart())}
              className={buttonClass('danger', 'sm')}
            >
              <Icon name="trash" className="size-4" />
              Empty cart
            </button>
          </div>
        </section>

        <aside aria-label="Order summary" className="space-y-4 rounded-3xl border border-line bg-panel p-4 sm:p-5 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-bold">Order summary</h2>
          <PromoCode totals={totals} />
          <CartSummary totals={totals} />
          <div className="hidden lg:block">
            <Link to="/checkout" className={buttonClass('primary', 'lg', 'w-full')}>
              <Icon name="lock" className="size-5" />
              Go to checkout
            </Link>
          </div>
        </aside>
      </div>

      {/* Phones: the total and the checkout button stay in reach of your thumb. */}
      <div data-sticky-bar className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-panel/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <p className="min-w-0 flex-1 text-sm leading-tight">
            <span className="block text-ink-soft">Total</span>
            <span className="font-mono text-lg font-semibold tabular-nums">{formatNaira(totals.totalKobo)}</span>
          </p>
          <Link to="/checkout" className={buttonClass('primary', 'lg')}>
            Checkout
            <Icon name="arrow" className="size-5" />
          </Link>
        </div>
      </div>
    </>
  )
}
