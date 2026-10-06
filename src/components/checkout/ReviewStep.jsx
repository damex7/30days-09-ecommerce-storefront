import { Link } from 'react-router-dom'
import { formatNaira } from '../../lib/money.js'
import { formatPhoneLocal, normalisePhone } from '../../lib/validation.js'
import { Icon } from '../ui/Icon.jsx'

export const PAYMENT_LABELS = {
  online: 'Pay online (Paystack)',
  transfer: 'Bank transfer',
  pod: 'Pay on delivery',
}

/*
  Step 3: everything on one screen, each section with an Edit button that
  jumps back to its step (the values are kept, so nothing is retyped).
*/
export function ReviewStep({ values, totals, onEdit }) {
  const phone = normalisePhone(values.phone)
  return (
    <div className="space-y-4">
      <Section title="Contact and delivery" onEdit={() => onEdit(1)}>
        <p className="font-bold">{values.fullName}</p>
        <p>
          {phone ? formatPhoneLocal(phone) : values.phone} · {values.email}
        </p>
        <p className="mt-2">
          {values.address}
          {values.landmark && <span className="text-ink-faint"> (near {values.landmark})</span>}
        </p>
        <p>
          {values.city}, {values.state}
        </p>
        {totals.delivery && <p className="mt-2 text-ink-faint">Usually arrives in {totals.delivery.eta}.</p>}
      </Section>

      <Section title="Payment" onEdit={() => onEdit(2)}>
        <p className="font-bold">{PAYMENT_LABELS[values.paymentMethod]}</p>
        {values.paymentMethod === 'transfer' && (
          <p>
            Reference: <span className="font-mono font-semibold">{values.reference}</span>. You’ll see the account details again after placing the order.
          </p>
        )}
        {values.paymentMethod === 'online' && <p>The payment window opens when you place the order.</p>}
        {values.paymentMethod === 'pod' && <p>Have {formatNaira(totals.totalKobo)} ready for the rider.</p>}
      </Section>

      <Section title={`Items (${totals.itemCount})`} editTo="/cart" editLabel="Edit cart">
        <ul className="divide-y divide-line">
          {totals.lines.map((line) => (
            <li key={line.id} className="flex items-center gap-3 py-2">
              <img src={line.product.thumbnail} alt="" className="size-12 shrink-0 rounded-lg bg-[#f4efe6] object-contain p-0.5" />
              <p className="min-w-0 flex-1">
                <span className="block truncate font-bold">{line.product.title}</span>
                <span className="text-ink-faint">
                  {line.qty} × {formatNaira(line.product.priceKobo)}
                </span>
              </p>
              <p className="font-mono tabular-nums">{formatNaira(line.lineTotalKobo)}</p>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}

function Section({ title, onEdit, editTo, editLabel = 'Edit', children }) {
  const editClass = 'inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-sm font-bold text-palm-ink hover:bg-palm-soft'
  return (
    <section className="rounded-2xl border border-line p-4 text-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-display font-bold">{title}</h3>
        {onEdit ? (
          <button type="button" onClick={onEdit} className={editClass}>
            <Icon name="edit" className="size-4" />
            {editLabel}
            <span className="sr-only"> {title.toLowerCase()}</span>
          </button>
        ) : (
          <Link to={editTo} className={editClass}>
            <Icon name="edit" className="size-4" />
            {editLabel}
          </Link>
        )}
      </div>
      <div className="space-y-0.5 text-ink-soft">{children}</div>
    </section>
  )
}
