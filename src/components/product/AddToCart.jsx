import { useState } from 'react'
import { useCart, useStoreDispatch } from '../../state/StoreContext.jsx'
import { useUI } from '../../state/UIContext.jsx'
import { addToCart, addableQuantity, quantityInCart } from '../../state/storeReducer.js'
import { QuantityPicker } from './QuantityPicker.jsx'
import { WishlistButton } from './WishlistButton.jsx'
import { Button } from '../ui/Button.jsx'
import { Icon } from '../ui/Icon.jsx'
import { plural } from '../../lib/format.js'

/*
  Quantity limits come from the product's stock, counting what's ALREADY
  in the cart: with 5 in stock and 3 in your cart, you can add 2 more.
  The reducer would clamp anyway, but clamping silently is confusing, so
  we work the limit out here first and say it in words.
*/
export function AddToCart({ product }) {
  const { openCart } = useUI()
  const cart = useCart()
  const dispatch = useStoreDispatch()
  const inCart = quantityInCart(cart, product.id)
  const addable = addableQuantity(cart, product)
  const [qty, setQty] = useState(1)
  const [status, setStatus] = useState('')

  const soldOut = product.stock <= 0
  const allInCart = !soldOut && addable === 0
  const chosen = Math.min(qty, Math.max(1, addable))

  function add() {
    if (addable <= 0) return
    dispatch(addToCart(product, chosen))
    setStatus(`Added ${plural(chosen, 'item')} to your cart.`)
    setQty(1)
    // Show the cart, with this product highlighted, so the shopper sees what happened.
    openCart(product.id)
  }

  let hint = null
  if (soldOut) hint = 'Sold out for now. Save it to your wishlist to find it again later.'
  else if (allInCart) hint = `You already have all ${product.stock} we have in stock in your cart.`
  else if (inCart > 0) hint = `You have ${inCart} in your cart, so you can add up to ${addable} more.`
  else if (product.availability === 'low') hint = `Only ${product.stock} left in stock.`

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-end gap-3">
        {!soldOut && !allInCart && (
          <QuantityPicker value={chosen} onChange={setQty} max={addable} showLabel label="Quantity" />
        )}
        {/* Source order = visual order = tab order. On phones Add to cart wraps to its own full-width row. */}
        <WishlistButton product={product} />
        <Button size="lg" className="w-full sm:w-auto sm:min-w-48 sm:flex-1" onClick={add} disabled={soldOut || allInCart}>
          <Icon name="bag" />
          {soldOut ? 'Out of stock' : allInCart ? 'All in your cart' : 'Add to cart'}
        </Button>
      </div>

      {hint && (
        <p className="mt-3 flex items-start gap-2 text-sm text-ink-soft">
          <Icon name="info" className="mt-0.5 size-4 shrink-0" />
          {hint}
        </p>
      )}
      {/* role="status": announced politely by screen readers when it changes. */}
      <p role="status" className="mt-2 min-h-5 text-sm font-bold text-leaf">
        {status && (
          <span className="inline-flex items-center gap-1.5">
            <Icon name="check" className="size-4" />
            {status}
          </span>
        )}
      </p>
    </div>
  )
}
