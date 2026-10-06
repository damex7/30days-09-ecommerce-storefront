import { Rating } from './Rating.jsx'
import { formatDate, plural } from '../../lib/format.js'

export function Reviews({ product }) {
  const { reviews } = product
  return (
    <section aria-labelledby="reviews-title" id="reviews" className="mt-12 scroll-mt-40 lg:scroll-mt-24">
      <h2 id="reviews-title" className="font-display text-xl font-bold sm:text-2xl">
        Reviews
      </h2>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Rating value={product.rating} size="md" />
        <span className="text-sm text-ink-soft">Overall rating · {plural(reviews.length, 'written review')}</span>
      </div>

      {reviews.length === 0 ? (
        <p className="mt-4 text-ink-soft">No written reviews yet.</p>
      ) : (
        <ul className="mt-5 grid gap-3 md:grid-cols-3">
          {reviews.map((r, i) => (
            <li key={i} className="rounded-2xl border border-line bg-panel p-4">
              <Rating value={r.rating} />
              <p className="mt-2 font-bold">“{r.comment}”</p>
              <p className="mt-3 text-xs text-ink-faint">
                {r.name}
                {r.date && <> · {formatDate(r.date)}</>}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
