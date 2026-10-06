import { cx } from '../../lib/cx.js'

const STYLES = {
  in: 'bg-leaf-soft text-leaf',
  low: 'bg-kola-soft text-kola-ink',
  out: 'bg-danger-soft text-danger',
}

export function stockText({ availability, stock }) {
  if (availability === 'out') return 'Out of stock'
  if (availability === 'low') return `Only ${stock} left`
  return 'In stock'
}

export function StockBadge({ product, className }) {
  return (
    <span className={cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold', STYLES[product.availability], className)}>
      {stockText(product)}
    </span>
  )
}
