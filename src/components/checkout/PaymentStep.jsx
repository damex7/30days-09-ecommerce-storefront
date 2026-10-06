import { useState } from 'react'
import { fieldId } from './Field.jsx'
import { Icon } from '../ui/Icon.jsx'
import { formatNaira } from '../../lib/money.js'
import { isPodAvailable, podUnavailableMessage } from '../../lib/validation.js'
import { paystackMode } from '../../lib/paystack.js'
import { BANK_DETAILS } from '../../config.js'
import { cx } from '../../lib/cx.js'

/*
  Step 2: a radio group styled as cards. Real <input type="radio">s inside
  <label>s, so arrow keys move between options and screen readers announce
  "Pay online, radio button, 1 of 3". The cards are just styling.
*/
export function PaymentStep({ values, error, onChange, totalKobo }) {
  const podOk = isPodAvailable(values.state)
  const mode = paystackMode()
  const errorId = error ? `${fieldId('paymentMethod')}-error` : undefined

  const options = [
    {
      value: 'online',
      icon: 'card',
      title: 'Pay online',
      text: 'Card, bank account or USSD, through Paystack.',
      badge: mode === 'test' ? 'Paystack test mode' : 'Simulated payment',
    },
    {
      value: 'transfer',
      icon: 'bank',
      title: 'Bank transfer',
      text: 'Transfer the total to our account using your order number as the reference.',
    },
    {
      value: 'pod',
      icon: 'cash',
      title: 'Pay on delivery',
      text: podOk ? 'Pay the rider in cash or by transfer when your order arrives.' : podUnavailableMessage(values.state),
      disabled: !podOk,
    },
  ]

  return (
    <fieldset aria-describedby={errorId}>
      <legend className="sr-only">Payment method</legend>
      {error && (
        <p id={errorId} className="mb-3 flex items-start gap-1.5 rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm font-bold text-danger">
          <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
      <div className="space-y-3">
        {options.map((o, i) => {
          const checked = values.paymentMethod === o.value
          return (
            <div key={o.value}>
              <label
                className={cx(
                  'flex gap-3 rounded-2xl border-2 p-4 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus',
                  o.disabled ? 'cursor-not-allowed border-line bg-panel-2/60' : 'cursor-pointer',
                  checked ? 'border-palm bg-palm-soft/50' : !o.disabled && 'border-line hover:border-line-strong',
                )}
              >
                <input
                  // The first radio carries the id, so "focus the first error" lands inside this group.
                  id={i === 0 ? fieldId('paymentMethod') : undefined}
                  type="radio"
                  name="paymentMethod"
                  value={o.value}
                  checked={checked}
                  disabled={o.disabled}
                  onChange={() => onChange('paymentMethod', o.value)}
                  aria-invalid={error ? true : undefined}
                  className="mt-1 size-5 shrink-0 accent-palm focus-visible:outline-none"
                />
                <span className={cx('grid size-10 shrink-0 place-items-center rounded-xl', o.disabled ? 'bg-panel text-ink-faint' : 'bg-indigo-soft text-indigo-ink')}>
                  <Icon name={o.icon} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cx('flex flex-wrap items-center gap-2 font-bold', o.disabled && 'text-ink-faint')}>
                    {o.title}
                    {o.badge && <span className="rounded-full bg-kola-soft px-2 py-0.5 text-xs text-kola-ink">{o.badge}</span>}
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-soft">{o.text}</span>
                </span>
              </label>
              {checked && o.value === 'transfer' && <BankDetails reference={values.reference} totalKobo={totalKobo} />}
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}

export function BankDetails({ reference, totalKobo, className }) {
  const rows = [
    { label: 'Bank', value: BANK_DETAILS.bankName },
    { label: 'Account name', value: BANK_DETAILS.accountName },
    { label: 'Account number', value: BANK_DETAILS.accountNumber, copy: true, mono: true },
    { label: 'Amount', value: formatNaira(totalKobo), mono: true },
    { label: 'Reference', value: reference, copy: true, mono: true },
  ]
  return (
    <div className={cx('mt-2 rounded-2xl border border-dashed border-line-strong bg-panel p-4', className)}>
      <p className="flex items-start gap-2 text-sm font-bold text-kola-ink">
        <Icon name="info" className="mt-0.5 size-4 shrink-0" />
        Demo details: this is not a real account. Don’t send money.
      </p>
      <dl className="mt-3 space-y-2 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <dt className="text-ink-soft">{r.label}</dt>
            <dd className="flex items-center gap-1">
              <span className={cx('font-bold', r.mono && 'font-mono tabular-nums')}>{r.value}</span>
              {r.copy && <CopyButton text={r.value} label={r.label} />}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-ink-faint">Use the reference exactly, so the seller can match your transfer to this order.</p>
    </div>
  )
}

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked (old browser, no permission): the text is still selectable.
    }
  }
  return (
    <button type="button" onClick={copy} className="grid size-9 place-items-center rounded-full text-ink-soft hover:bg-panel-2">
      <Icon name={copied ? 'check' : 'copy'} className={cx('size-4', copied && 'text-leaf')} />
      <span className="sr-only">{copied ? `${label} copied` : `Copy ${label.toLowerCase()}`}</span>
    </button>
  )
}
