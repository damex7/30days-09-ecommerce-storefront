import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Brand, LogoMark } from './Brand.jsx'
import { SearchBar } from './SearchBar.jsx'
import { ThemeToggle } from './ThemeToggle.jsx'
import { Icon } from '../ui/Icon.jsx'
import { cx } from '../../lib/cx.js'
import { STORE_NAME } from '../../config.js'

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
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-panel px-4 py-2 font-bold text-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <header className="adire on-indigo sticky top-0 z-30 shadow-card">
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
            <HeaderLink to="/wishlist" icon="heart" label="Wishlist" />
            <HeaderLink to="/cart" icon="bag" label="Cart" />
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
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}

function HeaderLink({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cx('relative grid size-11 place-items-center rounded-full transition-colors', isActive ? 'bg-white/15' : 'hover:bg-white/10')
      }
    >
      <Icon name={icon} className="size-6" />
      <span className="sr-only">{label}</span>
    </NavLink>
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
