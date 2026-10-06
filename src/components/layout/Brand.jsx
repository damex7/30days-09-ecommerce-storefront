import { STORE_NAME } from '../../config.js'
import { cx } from '../../lib/cx.js'

/*
  The store name is Yoruba ("marketplace"). lang="yo" tells screen readers
  to switch pronunciation for these two words, while the rest of the page
  stays English (en-NG).
*/
export function Brand({ className }) {
  return (
    <span lang="yo" className={cx('font-display font-bold tracking-tight', className)}>
      {STORE_NAME}
    </span>
  )
}

/** The logo mark: a market basket on an adire tile. */
export function LogoMark({ className = 'size-9' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="14" fill="#f7f1e5" />
      <path d="M18 26h28l-3 20a4 4 0 0 1-4 3H25a4 4 0 0 1-4-3z" fill="#c8461b" />
      <path d="M25 26v-3a7 7 0 0 1 14 0v3" fill="none" stroke="#22306e" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="32" cy="37" r="3" fill="#f0b429" />
    </svg>
  )
}
