import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Brand, LogoMark } from './Brand.jsx'
import { SearchBar } from './SearchBar.jsx'
import { ThemeToggle } from './ThemeToggle.jsx'
import { Icon } from '../ui/Icon.jsx'
import { cx } from '../../lib/cx.js'
import { STORE_NAME } from '../../config.js'
import { useStore, useStoreLoadStatus } from '../../state/StoreContext.jsx'
import { useUI } from '../../state/UIContext.jsx'
import { CartDrawer } from '../cart/CartDrawer.jsx'

const NAV = [
  { to: '/shop', label: 'Shop' },
  { to: '/orders', label: 'My orders' },
]

/*
  App shell: an adire-indigo header (logo, search, wishlist, cart), the
  page, and a footer. On phones the search drops to its own row so it gets
  the full width.
*/
export function Layout() {
  // A new page starts at the top. (Only on path changes: ticking a filter on
  // /shop changes the query string and shouldn't throw you back to the top.)
  // Braces matter here: newer browsers make scrollTo() return a Promise, and
  // anything an effect returns, React later calls as its cleanup function.
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-panel px-4 py-2 font-bold text-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      {/* Sticky from tablets up. On a 360px phone a sticky header would eat a quarter of the screen. */}
      <header className="adire on-indigo z-30 shadow-card md:sticky md:top-0">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 sm:gap-4">
          <Link to="/" className="flex shrink-0 items-center gap-2 rounded-lg">
            <LogoMark />
            <Brand className="text-lg sm:text-xl" />
            <span className="sr-only">home</span>
          </Link>

          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex gap-1">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cx(
                        'flex min-h-11 items-center rounded-full px-4 text-sm font-bold transition-colors',
                        isActive ? 'bg-on-indigo text-indigo-deep' : 'hover:bg-white/10',
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <SearchBar className="hidden flex-1 md:block" />

          <div className="ml-auto flex items-center gap-0.5 md:ml-0">
            <ThemeToggle />
            <WishlistLink />
            <CartButton />
          </div>
        </div>

        {/* Phones: full-width search and the two main links */}
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 pb-3 md:hidden">
          <SearchBar />
          <nav aria-label="Main (mobile)">
            <ul className="flex gap-1 text-sm font-bold">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cx('flex min-h-9 items-center rounded-full px-3', isActive ? 'bg-on-indigo text-indigo-deep' : 'hover:bg-white/10')
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-16 outline-none">
        <SavedDataNotice />
        <Outlet />
      </main>

      <Footer />
      <CartDrawer />
    </div>
  )
}

/* The counts are part of the accessible name ("Cart, 3 items"); the badge itself is hidden from screen readers. */
function CountBadge({ count }) {
  if (!count) return null
  return (
    <span
      aria-hidden="true"
      className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-kola px-1 font-mono text-[11px] font-semibold text-on-kola"
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

function WishlistLink() {
  const count = useStore().wishlist.length
  return (
    <NavLink
      to="/wishlist"
      className={({ isActive }) =>
        cx('relative grid size-11 place-items-center rounded-full transition-colors', isActive ? 'bg-white/15' : 'hover:bg-white/10')
      }
    >
      <Icon name="heart" className="size-6" />
      <CountBadge count={count} />
      <span className="sr-only">Wishlist{count ? `, ${count} saved` : ''}</span>
    </NavLink>
  )
}

/** A button, not a link: it opens the cart drawer. The full cart page is one click further. */
function CartButton() {
  const count = useStore().cart.reduce((n, line) => n + line.qty, 0)
  const { openCart } = useUI()
  return (
    <button
      type="button"
      onClick={() => openCart()}
      className="relative grid size-11 place-items-center rounded-full transition-colors hover:bg-white/10"
    >
      <Icon name="bag" className="size-6" />
      <CountBadge count={count} />
      <span className="sr-only">Cart, {count === 1 ? '1 item' : `${count} items`}</span>
    </button>
  )
}

/*
  If the saved cart couldn't be read (corrupted, or edited by hand), say so
  once instead of silently showing an empty cart. A copy of the unreadable
  data is kept under "<key>:corrupt-backup" (see lib/storage.js).
*/
function SavedDataNotice() {
  const status = useStoreLoadStatus()
  const [dismissed, setDismissed] = useState(false)
  if (status !== 'corrupt' || dismissed) return null
  return (
    <div role="status" className="mb-6 flex items-start gap-3 rounded-2xl bg-kola-soft px-4 py-3 text-sm text-kola-ink">
      <Icon name="info" className="mt-0.5 size-5 shrink-0" />
      <p className="flex-1 font-bold">We couldn’t read your saved cart and wishlist on this device, so we’ve started fresh.</p>
      <button type="button" onClick={() => setDismissed(true)} className="-my-1 grid size-9 shrink-0 place-items-center rounded-full hover:bg-panel/50">
        <Icon name="x" className="size-4" />
        <span className="sr-only">Dismiss</span>
      </button>
    </div>
  )
}

function Footer() {
  const link = 'underline decoration-line-strong underline-offset-2 hover:text-ink'
  return (
    <footer className="border-t border-line bg-panel/60">
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 text-sm text-ink-faint sm:grid-cols-2">
        <div>
          <p className="flex items-center gap-2 text-ink">
            <LogoMark className="size-7" />
            <Brand />
          </p>
          <p className="mt-2 max-w-sm">
            A demo storefront. Products come from{' '}
            <a className={link} href="https://dummyjson.com" target="_blank" rel="noreferrer">
              DummyJSON
            </a>{' '}
            and prices are converted to Naira at a fixed demo rate, so they are not real prices.
          </p>
        </div>
        <ul className="space-y-1 sm:justify-self-end sm:text-right">
          <li>No real payments are taken: Paystack runs in test mode only.</li>
          <li>Orders are saved in this browser only.</li>
          <li>
            <span lang="yo">{STORE_NAME}</span> means “marketplace” in Yoruba.
          </li>
        </ul>
      </div>
    </footer>
  )
}
