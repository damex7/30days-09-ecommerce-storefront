# Ibi ọjà: an e-commerce storefront

**Day 9 of my 30-day development challenge.** A storefront designed for how Nigerian small businesses actually sell: prices in Naira,
delivery fees that depend on the state, a choice of paying online, by bank transfer or on delivery, and a button that sends the
finished order to the seller on WhatsApp.

_Ibi ọjà_ means “marketplace” in Yoruba.

Today's learning focus: **cart state with a reducer**, **handling money correctly**, and **a multi-step checkout with validation**.

## What it does

- **Browse:** home page with search, top-rated products, categories and “recently viewed”.
- **Shop (`/shop`):** filter by category, price range and rating, sort, and paginate. Everything lives in the URL, so refresh,
  Back and shared links all work.
- **Product page:** image gallery, price with the old price shown as “was ₦X”, stock status, reviews, a quantity picker limited
  by stock, wishlist, and related products.
- **Cart:** a slide-over drawer and a full cart page. Change quantities, remove with **Undo**, apply a promo code (`NAIJA10` for
  10% off, `WELCOME2000` for ₦2,000 off orders of ₦20,000 or more), and see a running total with progress towards free delivery.
- **Checkout (`/checkout`):** three steps with a progress indicator.
  1. Contact and delivery. The phone number is validated as Nigerian (`0803…` or `+234…`), and the delivery fee depends on the state.
  2. Payment: pay online (Paystack test mode, or a simulated payment), bank transfer (demo account and a reference), or pay on
     delivery (only in Lagos, Ogun and FCT).
  3. Review and place the order.
- **Confirmation:** order number, what happens next, and **Send order on WhatsApp**, which opens `wa.me` with the order neatly
  formatted for the seller.
- **My orders** and **Wishlist** pages, saved in the browser.
- Light and dark mode (remembers your choice), responsive down to 360px, keyboard accessible.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

Built with Vite, React (JavaScript), Tailwind CSS v4 (`@tailwindcss/vite`, tokens in `@theme` in `src/index.css`) and
react-router-dom. There are no other libraries: no state manager, form library, HTTP client or UI kit.

Deploying to Vercel works as is. `vercel.json` rewrites every path to `index.html`, so refreshing `/checkout` or `/product/12`
doesn't 404.

## Adding a Paystack test key (optional)

Without a key, “Pay online” uses a clearly labelled **simulated payment**, so the whole flow still works.

To use the real Paystack popup in **test mode**:

1. Create a free account at [paystack.com](https://paystack.com) and go to **Settings → API Keys & Webhooks**.
2. Copy the **Test Public Key** (it starts with `pk_test_`).
3. Copy `.env.example` to `.env.local` and paste it in:
   ```
   VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx
   ```
4. Restart `npm run dev`. Pay with one of Paystack's
   [test cards](https://paystack.com/docs/payments/test-payments/).

On Vercel, add the same variable under **Project → Settings → Environment Variables** and redeploy.

### Public key vs secret key

- The **public key** (`pk_…`) can only _open_ a payment popup for your account. It is designed to be seen by browsers, which is
  why it can go in a `VITE_` variable: everything prefixed `VITE_` is bundled into the JavaScript every visitor downloads.
- The **secret key** (`sk_…`) can read transactions, issue refunds and verify payments. **It must never be in this repo, in a
  `VITE_` variable, or anywhere in the browser.** It belongs on a server only.
- The app refuses anything except a `pk_test_` key, so it can't take real money even if a live key is pasted in by mistake.
- `.env.local` is in `.gitignore`. Only `.env.example` (with empty values) is committed.

### Why online orders say “unverified (demo)”

When the Paystack popup reports success, that's just the browser saying so, and anyone can fake a browser callback. A real shop
sends the payment reference to **its own server**, which calls Paystack's verify endpoint with the secret key and checks the
status, amount and currency **before** marking the order as paid (ideally also through a webhook). This project has no server
(that comes on Day 16), so online orders are saved as **“Paid · unverified (demo)”**.

## What's demo-only

| Part | Why it isn't real |
| --- | --- |
| **Prices** | DummyJSON prices are in US dollars. They're converted once at a **fixed demo rate of ₦1,600 = $1** and rounded to retail-looking prices (nearest ₦100, or ₦1,000 above ₦100,000). They are not real Naira prices. |
| **Products and stock** | From [DummyJSON](https://dummyjson.com). Placing an order doesn't reduce stock. |
| **Payments** | Paystack runs in test mode only, or is simulated. Nothing is verified on a server. |
| **Bank account** | “Demo Bank”, account `0123456789`. Not a real account. |
| **Seller WhatsApp number** | A placeholder (`2348000000000`). Set your own in `src/config.js` or with `VITE_SELLER_WHATSAPP`. |
| **Orders, cart, wishlist** | Saved in this browser's `localStorage` only. There are no accounts and no backend. |

## How money works

**Every amount is stored as a whole number of kobo** (₦1 = 100 kobo) and only turned into “₦16,000” when it's displayed.

JavaScript numbers are binary floating point, so most decimal fractions can't be stored exactly:

```js
0.1 + 0.2       // 0.30000000000000004
19.99 * 7       // 139.92999999999998   (seven items at 19.99)
1.15 * 100      // 114.99999999999999   (so Math.floor gives 114, not 115)
1999 * 7        // 13993, exact, because integers are safe
```

In a shop, those errors become totals that are off by a kobo, a “free delivery from ₦150,000” check that fails at exactly
₦150,000, or a payment provider rejecting the amount. So the app follows a few rules:

- Dollars become kobo **once**, in the product normaliser (`cents × rate` is already kobo, using integer maths only).
- Totals are **derived, never stored**: subtotal → promo discount → delivery (free if the discounted subtotal reaches the
  threshold) → total, all as pure functions over integers.
- Percentages are rounded **once**, in one function (`percentOf`), so the rounding rule is the same everywhere.
- Paystack's `amount` is also in kobo, so the total goes to the payment provider without any conversion.

## Where each concept lives

| Concept | File |
| --- | --- |
| Business rules (rate, promos, delivery fees, pay-on-delivery states, bank details, WhatsApp number) | `src/config.js` |
| Money as integer kobo, float pitfalls, formatting | `src/lib/money.js` |
| DummyJSON API and the product normaliser (USD → kobo, “was” price) | `src/lib/store.js` |
| Fetch helper: timeout, cache, retry, readable errors | `src/lib/request.js` |
| Shop filters, sort and page in the URL | `src/lib/shopParams.js`, `src/pages/Shop.jsx` |
| Cart, wishlist and recently viewed reducer: action types, action creators | `src/state/storeReducer.js` |
| Validating and repairing saved data | `src/state/validateStore.js`, `src/lib/orders.js` (`cleanOrder`) |
| Context with split state and dispatch, persisted reducer | `src/state/StoreContext.jsx`, `src/hooks/usePersistedReducer.js` |
| Derived totals: subtotal, promo, delivery, total | `src/lib/pricing.js` |
| Stock limits and their messages | `src/state/storeReducer.js` (`addableQuantity`), `src/components/product/AddToCart.jsx` |
| Remove with Undo | `src/state/storeReducer.js` (`lastRemoved`), `src/components/cart/UndoBar.jsx` |
| Cart drawer on a native `<dialog>` | `src/components/ui/Sheet.jsx`, `src/components/cart/CartDrawer.jsx` |
| Multi-step checkout, step in the URL, focus management | `src/pages/Checkout.jsx` |
| Validation rules and Nigerian phone numbers | `src/lib/validation.js` |
| Accessible form fields (labels, errors, `aria-describedby`) | `src/components/checkout/Field.jsx` |
| Checkout values kept across steps and refreshes | `src/hooks/useCheckoutDraft.js` |
| Paystack Inline (test mode) and the public/secret key rules | `src/lib/paystack.js` |
| Orders as receipts with frozen totals | `src/lib/orders.js`, `src/state/OrdersContext.jsx` |
| WhatsApp order message and `wa.me` link | `src/lib/whatsapp.js` |
| Design tokens, dark mode, adire pattern | `src/index.css` |
| Light/dark mode that remembers your choice | `src/hooks/useTheme.js`, inline script in `index.html` |
| SPA refresh on Vercel | `vercel.json` |

## Worth adding later

- Server-side checkout: re-price the cart, reserve stock and verify Paystack payments (plus a webhook) before confirming an order.
- Accounts, so orders and the wishlist follow you across devices.
- Real inventory that goes down when an order is placed.
- Syncing the cart between open tabs (the `storage` event).
- Respecting DummyJSON's `minimumOrderQuantity` (ignored today).
- Order status updates from the seller, and email receipts.
- Shareable wishlists, product comparison, and saved addresses.
