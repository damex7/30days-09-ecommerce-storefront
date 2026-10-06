import { Link } from 'react-router-dom'
import { useCartTotals } from '../../state/StoreContext.jsx'
import { useUI } from '../../state/UIContext.jsx'
import { Sheet } from '../ui/Sheet.jsx'
import { CartLine } from './CartLine.jsx'
import { CartSummary } from './CartSummary.jsx'
import { PromoCode } from './PromoCode.jsx'
import { UndoBar } from './UndoBar.jsx'
import { EmptyState } from '../ui/States.jsx'
import { buttonClass } from '../ui/Button.jsx'
import { plural } from '../../lib/format.js'

/** The slide-over cart: opens after "Add to cart" and from the header bag. */
export function CartDrawer() {
  const { cartOpen, closeCart, justAddedId } = useUI()
  const totals = useCartTotals()
  const empty = totals.itemCount === 0

  return (
    <Sheet
      open={cartOpen}
      onClose={closeCart}
      title={empty ? 'Your cart' : `Your cart (${plural(totals.itemCount, 'item')})`}
      footer={
        !empty && (
          <div>
            <CartSummary totals={totals} compact />
            <div className="mt-3 grid grid-cols-[1fr_2fr] gap-2">
              <Link to="/cart" className={buttonClass('outline')}>
                View cart
              </Link>
              <Link to="/checkout" className={buttonClass('primary')}>
                Checkout
              </Link>
            </div>
          </div>
        )
      }
    >
      <UndoBar />
      {empty ? (
        <EmptyState
          icon="bag"
          title="Your cart is empty"
          className="py-8"
          action={
            <Link to="/shop" className={buttonClass('primary')}>
              Start shopping
            </Link>
          }
        >
          Browse the market and tap “Add to cart” on anything you like.
        </EmptyState>
      ) : (
        <>
          <ul className="-mx-2 space-y-1">
            {totals.lines.map((line) => (
              <CartLine key={line.id} line={line} highlight={line.id === justAddedId} />
            ))}
          </ul>
          <details className="mt-4 rounded-2xl border border-line p-3 open:pb-4">
            <summary className="cursor-pointer text-sm font-bold">{totals.promo ? `Promo: ${totals.promo.code}` : 'Have a promo code?'}</summary>
            <div className="mt-3">
              <PromoCode totals={totals} />
            </div>
          </details>
        </>
      )}
    </Sheet>
  )
}
