import { useEffect } from 'react'
import { STORE_NAME, STORE_TAGLINE } from '../config.js'

/** Sets the tab title ("iPhone 13 Pro · Ibi ọjà"), so history and tabs are readable. */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${STORE_NAME}` : `${STORE_NAME} · ${STORE_TAGLINE}`
  }, [title])
}
