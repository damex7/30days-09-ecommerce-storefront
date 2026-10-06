import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useCheckoutDraft } from '../hooks/useCheckoutDraft.js'
import { useCartTotals, useStoreDispatch } from '../state/StoreContext.jsx'
import { useOrders } from '../state/OrdersContext.jsx'
import { clearCart, refreshStock } from '../state/storeReducer.js'
import { getStockLevels } from '../lib/store.js'
import { buildOrder } from '../lib/orders.js'
import { payWithPaystack, paystackMode } from '../lib/paystack.js'
import { SimulatedPayment } from '../components/checkout/SimulatedPayment.jsx'
import { STEPS, firstInvalidStep, isPodAvailable, podUnavailableMessage } from '../lib/validation.js'
import { formatNaira } from '../lib/money.js'
import { Stepper } from '../components/checkout/Stepper.jsx'
import { ContactStep } from '../components/checkout/ContactStep.jsx'
import { PaymentStep } from '../components/checkout/PaymentStep.jsx'
import { ReviewStep } from '../components/checkout/ReviewStep.jsx'
import { fieldId } from '../components/checkout/Field.jsx'
import { CartSummary } from '../components/cart/CartSummary.jsx'
import { EmptyState } from '../components/ui/States.jsx'
import { Button, buttonClass } from '../components/ui/Button.jsx'
import { Icon } from '../components/ui/Icon.jsx'

const FORM_ID = 'checkout-form'
const parseStep = (v) => (['1', '2', '3'].includes(v) ? Number(v) : 1)

/*
  /checkout?step=1|2|3

  - The step is in the URL, so the phone's Back button goes back a step.
  - The form values live HERE, above the three steps, so moving between
    steps never loses them (and useCheckoutDraft mirrors them to
    sessionStorage for refreshes).
  - You can't skip ahead: asking for step 3 while step 1 is invalid shows
    step 1 instead.
  - Continue validates only the current step. With errors, focus goes to
    the first broken field and a live region announces how many there
    are. Without, focus goes to the new step's heading, so screen-reader
    users hear where they've landed.
*/
export default function Checkout() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { values, setField, setValues, clear: clearDraft } = useCheckoutDraft()
  const totals = useCartTotals(values.state || null)
  const [errors, setErrors] = useState({})
  const [announcement, setAnnouncement] = useState('')
  const [focusTarget, setFocusTarget] = useState(null)
  const headingRef = useRef(null)
  const dispatch = useStoreDispatch()
  const { addOrder } = useOrders()
  const [placing, setPlacing] = useState(false)
  const [placeError, setPlaceError] = useState('')
  const [simRequest, setSimRequest] = useState(null)
  const attempt = useRef(0)
  // Set once an order is placed. From then on this page is on its way out: it must not
  // "correct" the URL back to step 1 (the draft was just cleared) or flash the empty-cart message.
  const placedRef = useRef(false)

  const requested = parseStep(params.get('step'))
  const blocking = firstInvalidStep(values)
  const step = blocking && blocking < requested ? blocking : requested
  const current = STEPS[step - 1]
  useDocumentTitle(`Checkout: ${current.label}`)

  // Asked for a step you can't be on yet: correct the URL to match what's shown.
  useEffect(() => {
    if (!placedRef.current && step !== requested) navigate(`/checkout?step=${step}`, { replace: true })
  }, [step, requested, navigate])

  // Move focus after the render that shows the new step or the errors.
  useEffect(() => {
    if (!focusTarget) return
    if (focusTarget.field) document.getElementById(fieldId(focusTarget.field))?.focus()
    else headingRef.current?.focus()
  }, [focusTarget])

  function announce(message) {
    // A trailing non-breaking space makes a repeated message count as "new", so it's read again.
    setAnnouncement((prev) => (prev === message ? `${message} ` : message))
  }

  function goTo(n, nextErrors = {}) {
    setErrors(nextErrors)
    setAnnouncement('') // the old "2 fields need attention" no longer applies
    navigate(`/checkout?step=${n}`)
    setFocusTarget({ heading: true })
  }

  /** Re-check one field that is already showing an error, as the person fixes it. */
  function recheck(name, nextValues) {
    const message = current.validate(nextValues)[name]
    setErrors((prev) => {
      const next = { ...prev }
      if (message) next[name] = message
      else delete next[name]
      return next
    })
  }

  function handleChange(name, value) {
    setField(name, value)
    if (errors[name]) recheck(name, { ...values, [name]: value })
  }
  function handleBlur(name) {
    if (errors[name]) recheck(name, values)
  }

  function handleContinue(e) {
    e.preventDefault()
    const stepErrors = current.validate(values)
    const broken = current.fields.filter((f) => stepErrors[f])
    setErrors(stepErrors)
    if (broken.length) {
      announce(broken.length === 1 ? 'One field needs your attention.' : `${broken.length} fields need your attention.`)
      setFocusTarget({ field: broken[0] })
      return
    }
    if (step === 3) {
      placeOrder()
      return
    }

    // Changed the state to one without pay-on-delivery? Clear that choice and say why on the next step.
    if (step === 1 && values.paymentMethod === 'pod' && !isPodAvailable(values.state)) {
      setValues((v) => ({ ...v, paymentMethod: '' }))
      goTo(2, { paymentMethod: podUnavailableMessage(values.state) })
      return
    }
    goTo(step + 1)
  }

  /** Opens the stand-in payment dialog and waits for Approve or Cancel. */
  function simulatePayment({ amountKobo, email }) {
    return new Promise((resolve) =>
      setSimRequest({
        amountKobo,
        email,
        resolve: (result) => {
          setSimRequest(null)
          resolve(result)
        },
      }),
    )
  }

  /*
    Placing an order, in order:
    1. Re-check every step (another tab could have changed the draft).
    2. Re-check stock with fresh numbers from the API.
    3. Take payment (online only); a cancelled payment places nothing.
    4. Save the receipt, then empty the cart and go to the confirmation.
  */
  async function placeOrder() {
    if (placing) return
    setPlaceError('')
    const bad = firstInvalidStep(values)
    if (bad) {
      goTo(bad, STEPS[bad - 1].validate(values))
      return
    }

    setPlacing(true)
    try {
      const stock = await getStockLevels(totals.lines.map((l) => l.id))
      const short = totals.lines.filter((l) => l.qty > stock[l.id])
      if (short.length) {
        dispatch(refreshStock(stock))
        const what = short.map((l) => (stock[l.id] === 0 ? `${l.product.title} has sold out` : `only ${stock[l.id]} of ${l.product.title} left`))
        setPlaceError(`Stock changed while you were shopping: ${what.join('; ')}. We’ve updated your cart. Check the total, then place your order again.`)
        return
      }

      let payment
      if (values.paymentMethod === 'online') {
        // A new reference for every attempt: Paystack rejects a reused one after a cancelled try.
        attempt.current += 1
        const args = {
          email: values.email.trim(),
          amountKobo: totals.totalKobo,
          reference: `${values.reference}-${attempt.current}`,
          metadata: { order_number: values.reference },
        }
        const mode = paystackMode()
        const result = mode === 'test' ? await payWithPaystack(args) : await simulatePayment(args)
        if (result.status !== 'success') {
          setPlaceError('Payment cancelled, so your order hasn’t been placed. Try again, or go back and choose another way to pay.')
          return
        }
        // Not "paid": nothing has verified this on a server. See lib/paystack.js.
        payment = { method: 'online', status: 'paid_unverified', provider: mode === 'test' ? 'paystack-test' : 'simulated', reference: result.reference }
      } else if (values.paymentMethod === 'transfer') {
        payment = { method: 'transfer', status: 'awaiting_transfer', provider: null, reference: values.reference }
      } else {
        payment = { method: 'pod', status: 'pay_on_delivery', provider: null, reference: '' }
      }

      const order = buildOrder({ values, totals, payment })
      placedRef.current = true
      addOrder(order)
      navigate(`/order/${order.number}`, { replace: true, state: { justPlaced: true } })
      dispatch(clearCart())
      clearDraft()
    } catch (err) {
      setPlaceError(`${err.message || 'Something went wrong.'} Your order hasn’t been placed.`)
    } finally {
      setPlacing(false)
    }
  }

  if (placedRef.current) return null
  if (totals.itemCount === 0) {
    return (
      <EmptyState
        icon="bag"
        title="Your cart is empty"
        action={
          <Link to="/shop" className={buttonClass('primary')}>
            Browse the shop
          </Link>
        }
      >
        Add something to your cart before checking out.
      </EmptyState>
    )
  }

  const onReview = step === 3
  const primaryLabel = placing
    ? 'Placing order…'
    : step === 1
      ? 'Continue to payment'
      : step === 2
        ? 'Review order'
        : values.paymentMethod === 'online'
          ? `Pay ${formatNaira(totals.totalKobo)}`
          : 'Place order'

  return (
    <>
      <h1 className="sr-only">Checkout</h1>
      <p aria-live="assertive" className="sr-only">
        {announcement}
      </p>

      <div className="mx-auto max-w-5xl">
        <Stepper current={step} onGoTo={(n) => goTo(n)} />

        <details className="mt-4 rounded-2xl border border-line bg-panel lg:hidden">
          <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 px-4 text-sm font-bold">
            <span>Order summary ({totals.itemCount})</span>
            <span className="font-mono tabular-nums">{formatNaira(totals.totalKobo)}</span>
          </summary>
          <div className="border-t border-line p-4">
            <CartSummary totals={totals} compact />
          </div>
        </details>

        {/* grid-cols-1 = minmax(0, 1fr): lets the column shrink below long, non-wrapping content. */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
          <form id={FORM_ID} onSubmit={handleContinue} noValidate className="rounded-3xl border border-line bg-panel p-4 sm:p-6">
            <p className="font-mono text-xs font-semibold tracking-widest text-palm-ink uppercase">
              Step {step} of {STEPS.length}
            </p>
            <h2 ref={headingRef} tabIndex={-1} className="mt-1 mb-5 font-display text-xl font-bold outline-none sm:text-2xl">
              {current.title}
            </h2>

            {step === 1 && (
              <ContactStep
                values={values}
                errors={errors}
                onChange={handleChange}
                onBlur={handleBlur}
                afterDiscountKobo={totals.subtotalKobo - totals.discountKobo}
              />
            )}
            {step === 2 && <PaymentStep values={values} error={errors.paymentMethod} onChange={handleChange} totalKobo={totals.totalKobo} />}
            {step === 3 && <ReviewStep values={values} totals={totals} onEdit={(n) => goTo(n)} />}

            <div className="mt-6 flex items-center justify-between gap-3">
              {step > 1 ? (
                <Button variant="ghost" onClick={() => goTo(step - 1)}>
                  <Icon name="back" className="size-4" />
                  Back
                </Button>
              ) : (
                <Link to="/cart" className={buttonClass('ghost')}>
                  <Icon name="back" className="size-4" />
                  Cart
                </Link>
              )}
              {/* On phones this button lives in the sticky bar below instead. (A wrapper, because the
                  button's own inline-flex would override "hidden".) */}
              <div className="hidden lg:block">
                <Button type="submit" size="lg" disabled={placing}>
                  {onReview && <Icon name="lock" className="size-5" />}
                  {primaryLabel}
                  {!onReview && <Icon name="arrow" className="size-5" />}
                </Button>
              </div>
            </div>
            {placeError && (
              <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-danger-soft px-3.5 py-3 text-sm font-bold text-danger">
                <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
                {placeError}
              </p>
            )}
            {onReview && (
              <p className="mt-3 flex items-start gap-1.5 text-xs text-ink-faint lg:justify-end">
                <Icon name="lock" className="mt-0.5 size-3.5 shrink-0" />
                Demo shop: no real money is taken.
              </p>
            )}
          </form>

          <aside aria-label="Order summary" className="hidden rounded-3xl border border-line bg-panel p-5 lg:sticky lg:top-24 lg:block">
            <h2 className="mb-4 font-display text-lg font-bold">Order summary</h2>
            <CartSummary totals={totals} />
            <Link to="/cart" className="mt-4 inline-block text-sm font-bold text-palm-ink underline-offset-4 hover:underline">
              Edit cart
            </Link>
          </aside>
        </div>
      </div>

      {/* Phones: the total and the main action stay within thumb reach. form= links it to the form above. */}
      <div data-sticky-bar className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-panel/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <p className="min-w-0 flex-1 text-sm leading-tight">
            <span className="block text-ink-soft">{totals.delivery ? 'Total' : 'Total before delivery'}</span>
            <span className="font-mono text-lg font-semibold tabular-nums">{formatNaira(totals.totalKobo)}</span>
          </p>
          <Button type="submit" form={FORM_ID} size="lg" disabled={placing}>
            {primaryLabel}
          </Button>
        </div>
      </div>

      <SimulatedPayment request={simRequest} />
    </>
  )
}
