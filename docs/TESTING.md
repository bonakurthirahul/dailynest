# Testing Guide

DailyNest does not ship with a unit-test suite — the security model lives in Postgres RLS and server-side API checks, so the most valuable tests are end-to-end against a real Supabase project. This guide walks through the critical paths to verify manually (or with a tool like Playwright) before going live.

## 0. Automated checks

```bash
npm run typecheck   # TypeScript — must pass with zero errors
npm run lint        # ESLint — must pass with zero errors
npm run build       # Production build — must complete
```

Run all three before every deploy.

## 1. Customer flows

### Registration & login
1. Go to `/register`, create an account with a real email + strong password.
2. Confirm you land on `/account`.
3. Log out, then log back in at `/login`.
4. Try a wrong password — you should see a friendly error, not a stack trace.

### Browsing & search
1. Visit `/shop`. Verify all seeded products render with images.
2. Use the search box — results filter as you type.
3. Click a category chip — only that category's products show.
4. Change the sort dropdown — order updates.
5. Open a product page (`/product/[slug]`) — description, price, discount, and stock are correct.

### Cart
1. Add 3 different products with different quantities.
2. Badge in the header updates.
3. Reload the page — cart persists (localStorage).
4. Change quantity on `/cart` — totals update.
5. Remove an item — it disappears and totals update.

### Checkout & order placement
1. Log in (required) and go to `/checkout`.
2. Fill name, phone, pickup notes. Leave the email optional field blank.
3. Submit — you should land on the success page with an order number (`DN-0001`).
4. Go to `/account/orders` — the order appears.
5. Open the order — items, totals, and the timeline are correct.

### Order tracking (guest)
1. Copy the order number.
2. Log out. Go to `/track-order`.
3. Enter the order number + phone — the order shows without PII leakage (no email, no full address).

## 2. Owner flows

### Setup & login
1. Visit `/store-control-7x9/setup` — click create. If the owner already exists, expect a clear "already exists" message.
2. Visit `/store-control-7x9/login` — sign in. You land on the dashboard.

### Dashboard overview
1. Verify today's sales, total orders, and low-stock count render.
2. Place a new customer order in another tab — the overview updates without a manual refresh (realtime).

### Orders management
1. Go to **Orders**. The new order appears at the top.
2. Expand it — customer name, phone, items, and pickup notes are visible.
3. Click **Accept** — status changes to "Accepted".
4. Click **Start preparing** — status changes to "Preparing".
5. Click **Mark ready** — status changes to "Ready for Pickup".
6. Click **Mark collected** — status changes to "Collected".
7. Verify the customer's `/account/orders/[id]` timeline updated in real time at each step.

### Order rejection
1. Place another order. In the owner dashboard, expand it.
2. Click **Reject**. Enter a reason. Confirm.
3. Verify the customer's order page shows "Rejected" and the reason.
4. Verify the status buttons are gone (terminal state).

### Payment marking
1. On a pending order, click **Mark as paid at store** — the badge changes to "Paid at Store".
2. Click **Mark as unpaid** — reverts.

### Products CRUD
1. Go to **Products**. Click **+ Add product**.
2. Fill name, price, unit label, select a category. Upload an image (or paste a URL).
3. Save — the product appears in the list.
4. Visit `/shop` as a customer — the product is visible.
5. Click **Edit** on the product, change the price, save. Verify `/shop` shows the new price.
6. Click **Disable** — the product disappears from `/shop` for customers.
7. Click **Enable** — it reappears.
8. Set stock to 0 via the edit form — the product shows "Out of stock" and cannot be added to cart.
9. Click **Delete** — confirm. The product is gone.

### Categories CRUD
1. Go to **Categories**. Add a category. Verify it appears on `/categories`.
2. Edit its name. Verify the change propagates.
3. Delete it — products in that category become uncategorised (verify on `/shop`).

### Inventory
1. Go to **Inventory**. Low-stock items are grouped at the top.
2. Use the +/- buttons to adjust stock. Verify the number changes and persists after reload.
3. Type a number and press Enter or Save — stock updates.
4. Set a product to 0 — it moves to "Out of stock" and customers cannot order it.

### Notifications
1. Place a customer order — the bell in the owner shell shows a badge and plays a chime (after you've interacted with the page).
2. Open the bell dropdown — the notification is listed.
3. Go to **Notifications** — click a notification to mark it read. Click **Mark all read**.
4. Click **Clear all** — list empties.

### Settings
1. Go to **Settings**. Change the store name, tagline, and pickup instructions.
2. Save. Visit `/` and `/store-info` as a customer — the changes appear.
3. Toggle **Store is open for orders** off. Check that the customer checkout disables ordering (or a notice appears).

## 3. Security checks

### RLS — customer isolation
1. Log in as **Customer A**. Place an order.
2. In a second browser (or incognito), log in as **Customer B**.
3. Visit `/account/orders` as B — only B's orders appear.
4. Try to open A's order URL directly as B — you should get a not-found, not A's data.

### Owner route protection
1. Log out. Visit `/store-control-7x9/dashboard` — redirected to the owner login.
2. Log in as a **customer**. Visit `/store-control-7x9/dashboard` — redirected away (to `/`).
3. Log in as the owner. Visit `/store-control-7x9/dashboard` — access granted.

### API protection
1. As a logged-out user, `POST /api/orders` with a valid body — expect 401.
2. As a customer, `GET /api/owner/orders` — expect 403.
3. As a customer, `PATCH /api/owner/products` — expect 403.
4. As the owner, `GET /api/owner/orders` — expect 200.

### Price tampering
1. Place an order via the UI. Open DevTools → Network, find the `POST /api/orders` request.
2. Tamper with `totalInPaise` in the request body (set it to 1).
3. Submit — the server ignores the browser total and uses database prices. Verify the stored order has the correct total.

### Idempotency
1. Open DevTools → Network. Place an order.
2. Replay the exact same `POST /api/orders` request (same `clientRequestId`).
3. Expect the same order returned — no duplicate is created.

## 4. Cross-browser & responsive

- Test Chrome, Firefox, Safari, and Edge (latest).
- Test at 360px (small phone), 768px (tablet), and 1440px (desktop).
- Verify the owner dashboard sidebar collapses to a hamburger on mobile.
- Verify the customer header collapses to a mobile menu.

## 5. Accessibility spot-checks

- Tab through the checkout form — focus is visible on every control.
- Screen-reader test: the cart badge announces item count; error messages use `role="alert"`.
- Color contrast: body text on the ivory background meets WCAG AA.
