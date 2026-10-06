import { useEffect, useRef, useState } from 'react'
import { formatNaira } from '../../lib/money.js'
import { Button } from '../ui/Button.jsx'
import { Icon } from '../ui/Icon.jsx'

/*
  Stands in for the Paystack popup when no test key is configured, so the
  whole "Pay online" flow can be tried without an account. It's clearly
  labelled: nothing is charged and no card details are asked for.
  `request` is { amountKobo, email, resolve } while it's open.
*/
export function SimulatedPayment({ request }) {
  const ref = useRef(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const dialog = ref.current
    if (request && !dialog.open) dialog.showModal()
    if (!request && dialog.open) dialog.close()
    setProcessing(false)
  }, [request])

  function finish(result) {
    request?.resolve(result)
  }
  function approve() {
    setProcessing(true)
    // A short pause, like a real gateway, so the "processing" state is visible.
    setTimeout(() => finish({ status: 'success', reference: `SIM-${Date.now().toString(36).toUpperCase()}` }), 900)
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="sim-title"
      aria-describedby="sim-desc"
      // Esc = cancel, like closing the real popup.
      onCancel={(e) => {
        e.preventDefault()
        if (!processing) finish({ status: 'cancelled' })
      }}
      className="fixed inset-0 m-auto h-fit max-h-[calc(100dvh-2rem)] w-[min(26rem,calc(100vw-2rem))] max-w-none overflow-y-auto rounded-3xl border-0 bg-panel p-0 text-ink shadow-pop"
    >
      {request && (
        <div className="p-5 sm:p-6">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-kola-soft px-3 py-1 text-xs font-bold text-kola-ink">
            <Icon name="info" className="size-3.5" />
            Simulated payment · no money moves
          </p>
          <h2 id="sim-title" className="mt-3 font-display text-xl font-bold">
            Pay {formatNaira(request.amountKobo)}
          </h2>
          <p id="sim-desc" className="mt-2 text-sm text-ink-soft">
            No Paystack test key is set, so this stands in for the Paystack window. Choose what happens next. In a real shop, the server would
            verify the payment before confirming the order.
          </p>
          <p className="mt-3 truncate text-sm">
            Paying as <span className="font-bold">{request.email}</span>
          </p>
          <div className="mt-5 grid gap-2">
            <Button size="lg" onClick={approve} disabled={processing} autoFocus>
              {processing ? 'Processing…' : 'Approve payment'}
            </Button>
            <Button variant="outline" onClick={() => finish({ status: 'cancelled' })} disabled={processing}>
              Cancel payment
            </Button>
          </div>
        </div>
      )}
    </dialog>
  )
}
