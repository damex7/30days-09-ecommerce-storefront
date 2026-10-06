import { useEffect, useRef } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useOrders } from '../state/OrdersContext.jsx'
import { formatDateTime } from '../lib/format.js'
import { formatNaira } from '../lib/money.js'
import { formatPhoneLocal } from '../lib/validation.js'
import { StatusBadge, OrderTotals, DeliveryAddress, WhatsAppActions } from '../components/order/OrderParts.jsx'
import { BankDetails } from '../components/checkout/PaymentStep.jsx'
import { EmptyState } from '../components/ui/States.jsx'
import { buttonClass } from '../components/ui/Button.jsx'
import { Icon } from '../components/ui/Icon.jsx'
import { SELLER_WHATSAPP } from '../config.js'

export default function OrderConfirmation() {
  const { number } = useParams()
  const { orders } = useOrders()
  const { state } = useLocation()
  const justPlaced = state?.justPlaced === true
  const order = orders.find((o) => o.number === number)
  const headingRef = useRef(null)
  useDocumentTitle(order ? `Order ${order.number}` : 'Order not found')

  // Arriving from checkout: move focus to the heading so screen readers announce the result.
  useEffect(() => {
    if (justPlaced) headingRef.current?.focus()
  }, [justPlaced])

  if (!order) {
    return (
      <EmptyState
        icon="receipt"
        title="We couldn’t find that order"
        action={
          <Link to="/orders" className={buttonClass('primary')}>
            See my orders
          </Link>
        }
      >
        Orders are saved in the browser they were placed in. If you placed it on another phone or computer, look there.
      </EmptyState>
    )
  }

  const firstName = order.customer.fullName.split(/\s+/)[0]
  const { method, provider } = order.payment

  return (
    <div className="mx-auto max-w-3xl">
      <section className="adire on-indigo overflow-hidden rounded-3xl p-5 text-center shadow-card sm:p-8">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-kola text-on-kola">
          <Icon name="check" className="size-7" />
        </div>
        <h1 ref={headingRef} tabIndex={-1} className="mt-4 font-display text-2xl font-bold outline-none sm:text-3xl">
          {justPlaced ? `Thank you, ${firstName}!` : 'Your order'}
        </h1>
        <p className="mt-2 opacity-90">{justPlaced ? 'Your order has been placed.' : `Placed ${formatDateTime(order.createdAt)}`}</p>
        <p className="mt-4 text-sm opacity-80">Order number</p>
        <p className="font-mono text-2xl font-semibold tracking-wider sm:text-3xl">{order.number}</p>
        <StatusBadge status={order.payment.status} className="mt-4" />
      </section>

      {/* What happens next depends on how they chose to pay. */}
      <section aria-labelledby="next" className="mt-6 rounded-3xl border border-line bg-panel p-5 sm:p-6">
        <h2 id="next" className="font-display text-lg font-bold">
          What happens next
        </h2>
        {method === 'transfer' && (
          <>
            <p className="mt-2 text-sm text-ink-soft">
              Transfer <span className="font-mono font-bold text-ink">{formatNaira(order.totalKobo)}</span> using your order number as the reference.
              We’ll confirm your order when the money arrives, then send it out.
            </p>
            <BankDetails reference={order.number} totalKobo={order.totalKobo} className="mt-4" />
          </>
        )}
        {method === 'pod' && (
          <p className="mt-2 text-sm text-ink-soft">
            We’ll call <span className="font-bold text-ink">{formatPhoneLocal(order.customer.phone)}</span> before delivery. Have{' '}
            <span className="font-mono font-bold text-ink">{formatNaira(order.totalKobo)}</span> ready in cash, or transfer it to the rider when
            your order arrives ({order.delivery.eta}).
          </p>
        )}
        {method === 'online' && (
          <div className="mt-2 space-y-2 text-sm text-ink-soft">
            <p>
              {provider === 'simulated' ? 'Your simulated payment' : 'Your Paystack test payment'} of{' '}
              <span className="font-mono font-bold text-ink">{formatNaira(order.totalKobo)}</span> went through (reference{' '}
              <span className="font-mono">{order.payment.reference}</span>). Expect delivery in {order.delivery.eta}.
            </p>
            <p className="flex items-start gap-2 rounded-xl bg-kola-soft px-3.5 py-2.5 font-bold text-kola-ink">
              <Icon name="info" className="mt-0.5 size-4 shrink-0" />
              Unverified (demo): a real shop’s server would confirm this payment with Paystack before treating the order as paid.
            </p>
          </div>
        )}

        <h3 className="mt-6 font-bold">Send your order to the seller</h3>
        <p className="mt-1 text-sm text-ink-soft">
          Many shops confirm orders on WhatsApp. This opens a chat with the seller (+{SELLER_WHATSAPP}) with your order typed in, ready to send.
        </p>
        <WhatsAppActions order={order} className="mt-3" />
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="summary" className="rounded-3xl border border-line bg-panel p-5">
          <h2 id="summary" className="mb-2 font-display text-lg font-bold">
            Order summary
          </h2>
          <OrderTotals order={order} />
        </section>
        <section aria-labelledby="deliver" className="rounded-3xl border border-line bg-panel p-5">
          <h2 id="deliver" className="mb-2 font-display text-lg font-bold">
            Delivering to
          </h2>
          <DeliveryAddress order={order} />
          <p className="mt-3 text-sm text-ink-faint">Usually {order.delivery.eta}.</p>
        </section>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link to="/orders" className={buttonClass('outline')}>
          My orders
        </Link>
        <Link to="/shop" className={buttonClass('secondary')}>
          Keep shopping
        </Link>
      </div>
    </div>
  )
}
