import { useId, useState } from 'react'
import { useStoreDispatch } from '../../state/StoreContext.jsx'
import { applyPromo, removePromo } from '../../state/storeReducer.js'
import { evaluatePromo } from '../../lib/pricing.js'
import { Icon } from '../ui/Icon.jsx'
import { Button } from '../ui/Button.jsx'

/*
  Enter a code → we check it against config (lib/pricing.js) BEFORE
  dispatching, so the error can be shown right under the box. Only valid
  codes reach the reducer, and the reducer stores the code, not an amount.
  `totals` comes from useCartTotals(), so the applied promo always shows
  its current value, and a warning if the cart no longer qualifies.
*/
export function PromoCode({ totals }) {
  const dispatch = useStoreDispatch()
  const id = useId()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const { promo } = totals

  function submit(e) {
    e.preventDefault()
    if (!code.trim()) {
      setError('Enter a promo code.')
      return
    }
    const result = evaluatePromo(code, totals.subtotalKobo)
    if (!result.valid) {
      setError(result.reason)
      return
    }
    dispatch(applyPromo(result.code))
    setCode('')
    setError('')
  }

  if (promo) {
    return (
      <div className={promo.valid ? 'rounded-2xl bg-leaf-soft p-3' : 'rounded-2xl bg-kola-soft p-3'}>
        <div className="flex items-center gap-2">
          <Icon name="tag" className={promo.valid ? 'size-5 text-leaf' : 'size-5 text-kola-ink'} />
          <p className="min-w-0 flex-1 text-sm">
            <span className="font-mono font-semibold">{promo.code}</span>
            <span className="text-ink-soft"> · {promo.promo.label}</span>
          </p>
          <button type="button" onClick={() => dispatch(removePromo())} className="min-h-9 rounded-full px-3 text-sm font-bold hover:bg-panel/60">
            Remove<span className="sr-only"> promo code {promo.code}</span>
          </button>
        </div>
        {!promo.valid && (
          <p role="alert" className="mt-1 pl-7 text-sm font-bold text-kola-ink">
            {promo.reason}
          </p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold">
        Promo code
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            if (error) setError('')
          }}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck="false"
          placeholder="e.g. NAIJA10"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-11 min-w-0 flex-1 rounded-full border border-line-strong bg-panel px-4 font-mono text-sm uppercase placeholder:font-sans placeholder:normal-case aria-invalid:border-danger"
        />
        <Button type="submit" variant="secondary">
          Apply
        </Button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 flex items-start gap-1.5 text-sm font-bold text-danger">
          <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
    </form>
  )
}
