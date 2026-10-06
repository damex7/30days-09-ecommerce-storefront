import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useAsync } from '../hooks/useAsync.js'
import { getCategories, getFeatured } from '../lib/store.js'
import { formatNaira } from '../lib/money.js'
import { SearchBar } from '../components/layout/SearchBar.jsx'
import { ProductRow } from '../components/product/ProductRow.jsx'
import { ErrorState, Skeleton } from '../components/ui/States.jsx'
import { Icon } from '../components/ui/Icon.jsx'
import { DELIVERY, POD_STATES } from '../config.js'
import { formatList } from '../lib/format.js'

const POPULAR = [
  { slug: 'smartphones', name: 'Phones' },
  { slug: 'fragrances', name: 'Perfume' },
  { slug: 'groceries', name: 'Groceries' },
  { slug: 'mens-shoes', name: 'Men’s shoes' },
]

export default function Home() {
  useDocumentTitle()
  const featured = useAsync((signal) => getFeatured(signal), [])
  const categories = useAsync((signal) => getCategories(signal), [])

  return (
    <>
      <Hero />

      <ProductRow
        title="Top rated this week"
        products={featured.data}
        status={featured.status}
        error={featured.error}
        onRetry={featured.retry}
        seeAllTo="/shop?sort=rating"
      />

      <section aria-labelledby="cats" className="mt-12">
        <h2 id="cats" className="mb-4 font-display text-xl font-bold sm:text-2xl">
          Shop by category
        </h2>
        {categories.status === 'error' ? (
          <ErrorState error={categories.error} onRetry={categories.retry} title="Couldn’t load categories" />
        ) : categories.status === 'success' ? (
          <ul className="flex flex-wrap gap-2">
            {categories.data.map((c) => (
              <li key={c.slug}>
                <Link
                  to={`/shop?category=${c.slug}`}
                  className="flex min-h-11 items-center rounded-full border border-line-strong/60 bg-panel px-4 text-sm font-bold transition-colors hover:border-indigo hover:bg-indigo-soft"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-wrap gap-2" aria-hidden="true">
            {Array.from({ length: 14 }, (_, i) => (
              <Skeleton key={i} className="h-11 rounded-full" style={{ width: `${80 + ((i * 37) % 70)}px` }} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}

function Hero() {
  const lagos = DELIVERY.feesByState.Lagos
  return (
    <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="rounded-3xl border border-line bg-panel p-5 shadow-card sm:p-8">
        <p className="font-mono text-xs font-semibold tracking-widest text-palm-ink uppercase">Prices in Naira · Delivery nationwide</p>
        <h1 className="mt-3 font-display text-3xl leading-tight font-bold text-balance sm:text-4xl lg:text-5xl">
          Shop the market. <span className="text-palm-ink">Pay your way.</span>
        </h1>
        <p className="mt-3 max-w-lg text-ink-soft sm:text-lg">
          Phones, perfume, groceries and more, delivered to all 36 states and the FCT. Pay online, by bank transfer, or cash when it
          arrives.
        </p>
        <SearchBar size="lg" className="mt-6 max-w-xl" />
        <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
          <span>Popular:</span>
          {POPULAR.map((c) => (
            <Link
              key={c.slug}
              to={`/shop?category=${c.slug}`}
              className="rounded-full bg-panel-2 px-3 py-1.5 font-bold text-ink hover:bg-indigo-soft"
            >
              {c.name}
            </Link>
          ))}
        </p>
      </div>

      <div className="adire on-indigo relative overflow-hidden rounded-3xl p-5 shadow-card sm:p-8">
        <h2 className="font-display text-lg font-bold">Three ways to pay</h2>
        <ul className="mt-4 space-y-3">
          <PayWay icon="card" title="Pay online" text="Card, bank or USSD with Paystack (test mode)." />
          <PayWay icon="bank" title="Bank transfer" text="Use your order number as the reference." />
          <PayWay icon="cash" title="Pay on delivery" text={`Cash or transfer to the rider, in ${formatList(POD_STATES)}.`} />
        </ul>
        <p className="mt-5 flex items-start gap-2 rounded-2xl bg-kola px-4 py-3 text-sm font-bold text-on-kola">
          <Icon name="truck" className="mt-0.5 size-5 shrink-0" />
          <span>
            Delivery {formatNaira(lagos)} in Lagos, {formatNaira(DELIVERY.defaultFeeKobo)} elsewhere. Free on orders over{' '}
            {formatNaira(DELIVERY.freeOverKobo)}.
          </span>
        </p>
      </div>
    </section>
  )
}

function PayWay({ icon, title, text }) {
  return (
    <li className="flex gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-on-indigo/12 text-kola">
        <Icon name={icon} />
      </span>
      <span>
        <span className="block font-bold">{title}</span>
        <span className="block text-sm opacity-85">{text}</span>
      </span>
    </li>
  )
}
