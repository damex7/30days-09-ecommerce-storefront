import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useOrders } from '../state/OrdersContext.jsx'
import { formatDateTime, plural } from '../lib/format.js'
import { formatNaira } from '../lib/money.js'
import { StatusBadge } from '../components/order/OrderParts.jsx'
import { EmptyState } from '../components/ui/States.jsx'
import { buttonClass } from '../components/ui/Button.jsx'
import { Icon } from '../components/ui/Icon.jsx'

export default function Orders() {
  useDocumentTitle('My orders')
  const { orders } = useOrders()

  if (orders.length === 0) {
    return (
      <EmptyState
        icon="receipt"
        title="No orders yet"
        action={
          <Link to="/shop" className={buttonClass('primary')}>
            Start shopping
          </Link>
        }
      >
        Orders you place on this device will appear here, with their order numbers and payment status.
      </EmptyState>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-bold sm:text-3xl">My orders</h1>
      <p className="mt-1 text-sm text-ink-soft">Saved in this browser only. Clearing your browser data removes them.</p>

      <ul className="mt-6 space-y-3">
        {orders.map((order) => {
          const items = order.items.reduce((n, i) => n + i.qty, 0)
          return (
            <li key={order.number}>
              <article className="relative flex gap-3 rounded-2xl border border-line bg-panel p-4 shadow-card transition-shadow hover:shadow-pop">
                <div className="flex shrink-0 -space-x-4">
                  {order.items.slice(0, 3).map((item) => (
                    <img
                      key={item.id}
                      src={item.thumbnail}
                      alt=""
                      className="size-12 rounded-xl border-2 border-panel bg-[#f4efe6] object-contain p-0.5"
                    />
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-mono font-semibold">
                    <Link to={`/order/${order.number}`} className="after:absolute after:inset-0 after:rounded-2xl hover:underline">
                      {order.number}
                    </Link>
                  </h2>
                  <p className="text-sm text-ink-soft">
                    {formatDateTime(order.createdAt)} · {plural(items, 'item')} · to {order.delivery.state}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <StatusBadge status={order.payment.status} />
                    <span className="font-mono font-semibold tabular-nums">{formatNaira(order.totalKobo)}</span>
                  </div>
                </div>
                <Icon name="right" className="mt-1 size-5 shrink-0 self-center text-ink-faint" />
              </article>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
