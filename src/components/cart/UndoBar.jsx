import { useStore, useStoreDispatch } from '../../state/StoreContext.jsx'
import { dismissUndo, undoRemove } from '../../state/storeReducer.js'
import { Icon } from '../ui/Icon.jsx'

/*
  "Removed Gucci Bloom. Undo"
  It's drawn INSIDE the cart (drawer or page), not as a floating toast: an
  open modal <dialog> makes everything outside it inert, so a toast at
  the bottom of the page couldn't be clicked while the drawer is open.
  It doesn't vanish on a timer either; you dismiss it, or it's replaced
  by the next removal. Timers are hard for slower readers and screen-reader users.
*/
export function UndoBar() {
  const { lastRemoved } = useStore()
  const dispatch = useStoreDispatch()

  return (
    <div role="status" aria-live="polite">
      {lastRemoved && (
        <div className="mb-3 flex items-center gap-2 rounded-2xl bg-indigo px-4 py-2 text-sm text-on-indigo on-indigo">
          <p className="min-w-0 flex-1">
            Removed <span className="font-bold">{lastRemoved.line.product.title}</span>.
          </p>
          <button
            type="button"
            onClick={() => dispatch(undoRemove())}
            className="min-h-9 rounded-full bg-kola px-4 font-bold text-on-kola hover:brightness-95"
          >
            Undo
          </button>
          <button type="button" onClick={() => dispatch(dismissUndo())} className="grid size-9 place-items-center rounded-full hover:bg-white/10">
            <Icon name="x" className="size-4" />
            <span className="sr-only">Dismiss</span>
          </button>
        </div>
      )}
    </div>
  )
}
