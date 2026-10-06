import { Icon } from '../ui/Icon.jsx'
import { cx } from '../../lib/cx.js'

export const fieldId = (name) => `checkout-${name}`

/*
  One labelled form field with its hint and error, wired for screen readers:
   - <label for> names the input,
   - aria-describedby points at the hint AND the error, so both are read
     when the field gets focus (which is exactly when we move focus to the
     first broken field),
   - aria-invalid marks it as wrong.
  The error is plain text next to the field, not only a red border, so it
  doesn't rely on colour alone.
*/
export function Field({ name, label, hint, error, optional = false, as = 'input', children, className, inputClassName, ...props }) {
  const id = fieldId(name)
  const hintId = hint ? `${id}-hint` : null
  const errorId = error ? `${id}-error` : null
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  const control = cx(
    'w-full rounded-xl border bg-panel px-3.5 text-base text-ink placeholder:text-ink-faint',
    error ? 'border-danger ring-1 ring-danger' : 'border-line-strong',
    as === 'textarea' ? 'min-h-24 py-3' : 'h-12',
    inputClassName,
  )
  const shared = { id, name, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy, className: control, ...props }

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold">
        {label}
        {optional && <span className="font-normal text-ink-faint"> (optional)</span>}
      </label>
      {as === 'select' ? <select {...shared}>{children}</select> : as === 'textarea' ? <textarea {...shared} /> : <input {...shared} />}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-ink-faint">
          {hint}
        </p>
      )}
      {/* Keep the hint's id in the DOM while the error shows, so aria-describedby never points at nothing. */}
      {hint && error && (
        <p id={hintId} className="sr-only">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-sm font-bold text-danger">
          <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
