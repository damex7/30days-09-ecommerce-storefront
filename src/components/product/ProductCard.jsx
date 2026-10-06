import { Link } from 'react-router-dom'
import { Price, DiscountSticker } from './Price.jsx'
import { Rating } from './Rating.jsx'
import { stockText } from './StockBadge.jsx'
import { cx } from '../../lib/cx.js'

/*
  The whole card is clickable, but there's only ONE link in it (the title).
  Its ::after stretches over the card, so screen-reader and keyboard users
  get a single, well-named link per product instead of three.
  The image sits under that link, so its alt is empty: the link text
  already says what the product is, and repeating it would be noise.
  `actions` (the wishlist heart) is lifted above the stretched link.
*/
export function ProductCard({ product, actions, headingLevel = 3 }) {
  const Heading = `h${headingLevel}`
  const out = product.availability === 'out'
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-line bg-panel p-2 shadow-card transition-shadow hover:shadow-pop sm:p-2.5">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#f4efe6]">
        <img
          src={product.thumbnail}
          alt=""
          loading="lazy"
          decoding="async"
          width="300"
          height="300"
          className={cx('size-full object-contain p-2 transition-transform duration-300 group-hover:scale-105', out && 'opacity-50 grayscale')}
        />
        <DiscountSticker pct={product.discountPct} className="absolute top-2 left-2" />
      </div>

      <div className="mt-2.5 flex flex-1 flex-col gap-1 px-1 pb-1">
        <p className="truncate text-xs font-bold tracking-wide text-ink-faint uppercase">{product.brand || product.categoryName}</p>
        <Heading className="line-clamp-2 text-sm leading-snug font-bold">
          <Link to={`/product/${product.id}`} className="rounded-sm after:absolute after:inset-0 after:rounded-2xl hover:underline">
            {product.title}
          </Link>
        </Heading>
        {product.rating != null && <Rating value={product.rating} />}
        <Price priceKobo={product.priceKobo} wasKobo={product.wasKobo} className="mt-auto pt-1" />
        {product.availability !== 'in' && (
          <p className={cx('text-xs font-bold', out ? 'text-danger' : 'text-kola-ink')}>{stockText(product)}</p>
        )}
      </div>

      {actions && <div className="absolute top-3.5 right-3.5 z-10">{actions}</div>}
    </article>
  )
}
