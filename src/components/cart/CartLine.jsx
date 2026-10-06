import { Link } from 'react-router-dom'
import { useStoreDispatch } from '../../state/StoreContext.jsx'
import { removeFromCart, setQuantity } from '../../state/storeReducer.js'
import { QuantityPicker } from '../product/QuantityPicker.jsx'
import { Icon } from '../ui/Icon.jsx'
import { formatNaira } from '../../lib/money.js'
import { cx } from '../../lib/cx.js'

/** One cart line: picture, name, unit price, quantity, line total, remove. */
export function CartLine({ line, highlight = false }) {
  const dispatch = useStoreDispatch()
  const { product, qty, lineTotalKobo } = line
  const atLimit = qty >= product.stock

  return (
    <li className={cx('flex gap-3 rounded-2xl p-2 transition-colors', highlight && 'bg-kola-soft')}>
      <Link to={`/product/${product.id}`} className="shrink-0 rounded-xl" tabIndex={-1} aria-hidden="true">
        <img src={product.thumbnail} alt="" width="80" height="80" className="size-20 rounded-xl bg-[#f4efe6] object-contain p-1" />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm leading-snug font-bold">
            <Link to={`/product/${product.id}`} className="hover:underline">
              {product.title}
            </Link>
          </h3>
          <button
            type="button"
            onClick={() => dispatch(removeFromCart(product.id))}
            className="-mt-1 -mr-1 grid size-9 shrink-0 place-items-center rounded-full text-ink-faint hover:bg-danger-soft hover:text-danger"
          >
            <Icon name="trash" className="size-4.5" />
            <span className="sr-only">Remove {product.title}</span>
          </button>
        </div>
        <p className="text-xs text-ink-faint">
          <span className="font-mono tabular-nums">{formatNaira(product.priceKobo)}</span> each
          {highlight && <span className="ml-2 font-bold text-kola-ink">· Just added</span>}
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <QuantityPicker
            value={qty}
            max={product.stock}
            onChange={(n) => dispatch(setQuantity(product.id, n))}
            size="sm"
            title={product.title}
          />
          <p className="font-mono font-semibold tabular-nums">{formatNaira(lineTotalKobo)}</p>
        </div>
        {atLimit && <p className="mt-1 text-xs font-bold text-kola-ink">That’s all {product.stock} we have in stock.</p>}
      </div>
    </li>
  )
}
