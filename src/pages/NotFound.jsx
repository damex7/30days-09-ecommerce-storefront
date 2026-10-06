import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui/States.jsx'
import { buttonClass } from '../components/ui/Button.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function NotFound() {
  useDocumentTitle('Page not found')
  return (
    <EmptyState
      icon="search"
      title="This stall is empty"
      action={
        <>
          <Link to="/" className={buttonClass('outline')}>
            Go home
          </Link>
          <Link to="/shop" className={buttonClass('primary')}>
            Browse the shop
          </Link>
        </>
      }
    >
      We couldn’t find that page. It may have moved, or the link may be mistyped.
    </EmptyState>
  )
}
