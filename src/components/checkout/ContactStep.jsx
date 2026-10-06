import { Field } from './Field.jsx'
import { formatPhoneLocal, normalisePhone } from '../../lib/validation.js'
import { formatNaira } from '../../lib/money.js'
import { getDelivery } from '../../lib/pricing.js'
import { NG_STATES } from '../../config.js'

/*
  Step 1. autoComplete values let phones fill name, number, email and
  address in one tap; inputMode/type bring up the right keyboard.
*/
export function ContactStep({ values, errors, onChange, onBlur, afterDiscountKobo }) {
  const field = (name) => ({
    value: values[name],
    error: errors[name],
    onChange: (e) => onChange(name, e.target.value),
    onBlur: () => onBlur(name),
  })
  // Show the fee for the chosen state right away, before the next step.
  const delivery = values.state ? getDelivery(values.state, afterDiscountKobo) : null

  return (
    <div className="space-y-5">
      <fieldset className="space-y-4">
        <legend className="mb-3 font-display font-bold">Your details</legend>
        <Field label="Full name" autoComplete="name" autoCapitalize="words" {...field('fullName')} name="fullName" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Phone number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0803 123 4567"
            hint="For the rider. 0803… or +234… both work."
            {...field('phone')}
            // Tidy a valid number into the familiar 0803 123 4567 when you leave the box.
            onBlur={() => {
              const e164 = normalisePhone(values.phone)
              if (e164) onChange('phone', formatPhoneLocal(e164))
              onBlur('phone')
            }}
            name="phone"
          />
          <Field
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck="false"
            hint="Your receipt goes here."
            {...field('email')}
            name="email"
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-3 font-display font-bold">Delivery address</legend>
        <Field label="Street address" autoComplete="street-address" placeholder="e.g. 12 Allen Avenue, Flat 3" {...field('address')} name="address" />
        <Field
          label="Nearest landmark or bus stop"
          optional
          hint="Helps the rider find you, e.g. “Opposite Shoprite”."
          {...field('landmark')}
          name="landmark"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Town, city or area" autoComplete="address-level2" placeholder="e.g. Ikeja" {...field('city')} name="city" />
          <Field label="State" as="select" autoComplete="address-level1" {...field('state')} name="state">
            <option value="">Choose a state…</option>
            {NG_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Field>
        </div>
        {delivery && (
          <p className="rounded-xl bg-panel-2 px-3.5 py-2.5 text-sm" aria-live="polite">
            Delivery to <span className="font-bold">{delivery.state}</span>:{' '}
            <span className="font-bold">{delivery.free ? 'Free' : formatNaira(delivery.feeKobo)}</span>, usually {delivery.eta}.
          </p>
        )}
      </fieldset>
    </div>
  )
}
