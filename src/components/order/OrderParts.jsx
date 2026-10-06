import { useState } from 'react'
import { PAYMENT_STATUS } from '../../lib/orders.js'
import { formatNaira } from '../../lib/money.js'
import { formatPhoneLocal } from '../../lib/validation.js'
import { formatOrderMessage, whatsappLink } from '../../lib/whatsapp.js'
import { Icon } from '../ui/Icon.jsx'
import { Button, buttonClass } from '../ui/Button.jsx'
import { cx } from '../../lib/cx.js'

const TONES = {
  kola: 'bg-kola-soft text-kola-ink',
  indigo: 'bg-indigo-soft text-indigo-ink',
  leaf: 'bg-leaf-soft text-leaf',
}

export function StatusBadge({ status, className }) {
  const s = PAYMENT_STATUS[status]
  return <span className={cx('inline-flex rounded-full px-3 py-1 text-xs font-bold', TONES[s.tone], className)}>{s.label}</span>
}

/** Items and the frozen totals of a placed order (a receipt, so nothing is recalculated). */
export function OrderTotals({ order }) {
  return (
    <div>
      <ul className="divide-y divide-line">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-2.5 text-sm">
            {item.thumbnail ? (
              <img src={item.thumbnail} alt="" className="size-12 shrink-0 rounded-lg bg-[#f4efe6] object-contain p-0.5" />
            ) : (
              <span className="size-12 shrink-0 rounded-lg bg-panel-2" />
            )}
            <p className="min-w-0 flex-1">
              <span className="block font-bold">{item.title}</span>
              <span className="text-ink-faint">
                {item.qty} × {formatNaira(item.priceKobo)}
              </span>
            </p>
            <p className="font-mono tabular-nums">{formatNaira(item.lineTotalKobo)}</p>
          </li>
        ))}
      </ul>
      <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
        <Row label="Subtotal" value={formatNaira(order.subtotalKobo)} />
        {order.promo && <Row label={`Promo ${order.promo.code}`} value={formatNaira(-order.discountKobo)} />}
        <Row label={`Delivery to ${order.delivery.state}`} value={order.deliveryKobo === 0 ? 'Free' : formatNaira(order.deliveryKobo)} />
        <div className="flex items-baseline justify-between gap-3 pt-1">
          <dt className="font-display font-bold">Total</dt>
          <dd className="font-mono text-lg font-semibold tabular-nums">{formatNaira(order.totalKobo)}</dd>
        </div>
      </dl>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="font-mono tabular-nums">{value}</dd>
    </div>
  )
}

export function DeliveryAddress({ order }) {
  const { customer, delivery } = order
  return (
    <address className="text-sm leading-relaxed text-ink-soft not-italic">
      <span className="block font-bold text-ink">{customer.fullName}</span>
      {formatPhoneLocal(customer.phone)} · {customer.email}
      <br />
      {delivery.address}
      {delivery.landmark && <> (near {delivery.landmark})</>}
      <br />
      {delivery.city}, {delivery.state}
    </address>
  )
}

/*
  "Send order on WhatsApp": a plain link to wa.me with the message
  pre-filled. On a phone it opens the WhatsApp app; on a computer, WhatsApp
  Web or Desktop. "Copy message" is the fallback for anyone without WhatsApp.
*/
export function WhatsAppActions({ order, className }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(formatOrderMessage(order))
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      /* clipboard blocked: the WhatsApp link still works */
    }
  }
  return (
    <div className={cx('flex flex-wrap gap-2', className)}>
      <a
        href={whatsappLink(order)}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass('whatsapp', 'lg', 'flex-1')}
      >
        <Icon name="chat" />
        Send order on WhatsApp
        <span className="sr-only"> (opens WhatsApp)</span>
      </a>
      <Button variant="outline" size="lg" onClick={copy}>
        <Icon name={copied ? 'check' : 'copy'} className="size-5" />
        {copied ? 'Copied' : 'Copy message'}
      </Button>
      <p role="status" className="sr-only">
        {copied ? 'Order message copied' : ''}
      </p>
    </div>
  )
}
