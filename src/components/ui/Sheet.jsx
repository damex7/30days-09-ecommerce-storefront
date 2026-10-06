import { useEffect, useId, useRef } from 'react'
import { Icon } from './Icon.jsx'
import { cx } from '../../lib/cx.js'

const SIDES = {
  right: 'mr-0 ml-auto h-dvh max-h-dvh w-full max-w-md animate-slide-up sm:rounded-l-3xl',
  left: 'mr-auto ml-0 h-dvh max-h-dvh w-full max-w-sm animate-slide-up sm:rounded-r-3xl',
}

/*
  A slide-over panel built on the native <dialog> element. showModal()
  gives us, for free:
   - a focus trap (Tab stays inside the panel),
   - Esc to close,
   - the rest of the page made inert for screen readers,
   - focus returned to the button that opened it when it closes.
  React only decides WHEN it's open; the browser does the hard parts.
*/
export function Sheet({ open, onClose, title, side = 'right', children, footer }) {
  const ref = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // "close" fires for Esc and for dialog.close(); keep React's state in step.
      onClose={onClose}
      // A click on the dimmed backdrop lands on the <dialog> itself, not its content.
      onClick={(e) => e.target === ref.current && onClose()}
      className={cx('m-0 border-0 bg-panel p-0 text-ink shadow-pop', SIDES[side])}
    >
      {open && (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
            <h2 id={titleId} className="font-display text-lg font-bold">
              {title}
            </h2>
            <button type="button" onClick={onClose} className="grid size-11 place-items-center rounded-full hover:bg-panel-2">
              <Icon name="x" />
              <span className="sr-only">Close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">{children}</div>
          {footer && <div className="border-t border-line px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}
