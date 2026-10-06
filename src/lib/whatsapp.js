import { formatNaira } from './money.js'
import { formatDateTime } from './format.js'
import { formatPhoneLocal } from './validation.js'
import { PAYMENT_STATUS } from './orders.js'
import { SELLER_WHATSAPP, STORE_NAME } from '../config.js'

/*
  Many Nigerian shops take orders on WhatsApp. This turns an order into a
  tidy message for the seller. WhatsApp formatting: *bold*, and one fact
  per line so it reads well on a phone.
*/
const MAX_ITEM_LINES = 15 // keeps the wa.me link a sensible length

export function formatOrderMessage(order) {
  const items = order.items.slice(0, MAX_ITEM_LINES).map((i) => `• ${i.qty} × ${i.title}: ${formatNaira(i.lineTotalKobo)}`)
  const more = order.items.length - MAX_ITEM_LINES
  if (more > 0) items.push(`• …and ${more} more ${more === 1 ? 'item' : 'items'}`)

  const payment =
    order.payment.method === 'transfer'
      ? `Bank transfer, reference ${order.payment.reference}`
      : order.payment.method === 'pod'
        ? 'Pay on delivery'
        : `Paid online, reference ${order.payment.reference}`

  const lines = [
    `Hello ${STORE_NAME}! I’d like to confirm my order.`,
    '',
    `*Order ${order.number}*`,
    formatDateTime(order.createdAt),
    '',
    '*Items*',
    ...items,
    '',
    `Subtotal: ${formatNaira(order.subtotalKobo)}`,
    order.promo ? `Promo (${order.promo.code}): ${formatNaira(-order.discountKobo)}` : null,
    `Delivery (${order.delivery.state}): ${order.deliveryKobo === 0 ? 'Free' : formatNaira(order.deliveryKobo)}`,
    `*Total: ${formatNaira(order.totalKobo)}*`,
    '',
    `*Payment:* ${payment} (${PAYMENT_STATUS[order.payment.status].label.toLowerCase()})`,
    '',
    '*Deliver to*',
    order.customer.fullName,
    formatPhoneLocal(order.customer.phone),
    order.delivery.address,
    order.delivery.landmark ? `Near: ${order.delivery.landmark}` : null,
    `${order.delivery.city}, ${order.delivery.state}`,
    '',
    'Thank you!',
  ]
  // '' lines are deliberate blank lines; null marks an optional line that doesn't apply.
  return lines.filter((line) => line !== null).join('\n')
}

/** wa.me opens WhatsApp (app or web) with the message typed in, ready to send. */
export function whatsappLink(order, phone = SELLER_WHATSAPP) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(formatOrderMessage(order))}`
}
