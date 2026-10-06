import { PAYSTACK_PUBLIC_KEY } from '../config.js'

/*
  PAYSTACK, TEST MODE ONLY.

  Paystack gives every account two kinds of key:
   - a PUBLIC key (pk_test_… / pk_live_…). It only lets a browser OPEN a
     payment popup for your account. It's meant to be visible, which is why
     it can live in a VITE_ variable (anything VITE_ ends up in the
     JavaScript bundle that every visitor downloads).
   - a SECRET key (sk_test_… / sk_live_…). It can read transactions,
     refund money, and VERIFY payments. It must only ever live on a server.
     Never in this repo, never in a VITE_ variable, never in the browser.

  This app refuses anything except a pk_test_ key, so it can't take real
  money even if a live key is pasted in by mistake.
*/

export const isTestKey = (key) => /^pk_test_[A-Za-z0-9]+$/.test(key)

/** 'test' when a Paystack test key is configured, otherwise 'simulated'. */
export function paystackMode() {
  return isTestKey(PAYSTACK_PUBLIC_KEY) ? 'test' : 'simulated'
}

/** True when a key is set but isn't a test key (e.g. a live key pasted by mistake). */
export const hasRejectedKey = () => Boolean(PAYSTACK_PUBLIC_KEY) && !isTestKey(PAYSTACK_PUBLIC_KEY)

/* ---------- Paying ---------- */

const SCRIPT_URL = 'https://js.paystack.co/v2/inline.js'
let scriptPromise = null

/** Load Paystack's script only when someone actually pays, not on every page. */
function loadPaystack() {
  if (window.PaystackPop) return Promise.resolve()
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null // let the next attempt try again
      script.remove()
      reject(new Error('Couldn’t load Paystack. Check your connection and try again.'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

/*
  Opens the Paystack popup and resolves with { status: 'success', reference }
  or { status: 'cancelled' }.

  `amountKobo` goes straight through: Paystack's `amount` is in kobo too,
  which is one more reason the whole app stores kobo.

  IMPORTANT: "success" here only means the popup SAID the payment worked.
  Anyone can fake a browser callback. A real shop must send the reference
  to its own server, which calls Paystack's verify endpoint with the SECRET
  key and checks the status, amount and currency BEFORE treating the order
  as paid. We have no server today (that's Day 16), so these orders are
  saved as "paid, unverified (demo)".
*/
export async function payWithPaystack({ email, amountKobo, reference, metadata }) {
  if (!isTestKey(PAYSTACK_PUBLIC_KEY)) throw new Error('Paystack is only enabled with a pk_test_ key.')
  if (!Number.isSafeInteger(amountKobo) || amountKobo <= 0) throw new Error('Invalid amount.')
  await loadPaystack()

  return new Promise((resolve, reject) => {
    const popup = new window.PaystackPop()
    popup.newTransaction({
      key: PAYSTACK_PUBLIC_KEY,
      email,
      amount: amountKobo,
      currency: 'NGN',
      reference,
      metadata,
      onSuccess: (transaction) => resolve({ status: 'success', reference: transaction?.reference ?? reference }),
      onCancel: () => resolve({ status: 'cancelled' }),
      onError: (error) => reject(new Error(error?.message || 'Paystack couldn’t start the payment. Try again.')),
    })
  })
}
