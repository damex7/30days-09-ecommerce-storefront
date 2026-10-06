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
