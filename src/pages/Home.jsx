import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { Brand } from '../components/layout/Brand.jsx'

export default function Home() {
  useDocumentTitle()
  return (
    <h1 className="font-display text-3xl font-bold">
      <Brand />
    </h1>
  )
}
