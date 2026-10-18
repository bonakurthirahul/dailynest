# DailyNest

**Your Daily Needs, All in One Place.**

A production-ready grocery ordering website for an Indian kirana store. Customers browse and order online for **store pickup** and pay at the counter (cash or UPI). The store owner manages orders, products, inventory, and settings from a separate secured dashboard — all in real time.

Built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, and Supabase (auth, Postgres, realtime, storage).

---

## Features

### Customer
- Browse products by category, search, and sort
- Product pages with images, unit labels, prices, discounts, and stock levels
- Cart with localStorage persistence
- Checkout with pickup notes and phone
- Order history and real-time order status timeline
- Guest order tracking by order number + phone
- Email/password auth with password reset

### Store owner
- Hidden, secured dashboard at `/store-control-7x9/`
- Real-time order queue with one-click status transitions
- Accept / prepare / ready / collect / reject / cancel workflow
- Mark orders paid at store (cash or UPI)
- Product CRUD with image upload to Supabase Storage
- Category CRUD
- Quick inventory stock adjustments with low-stock alerts
- Real-time notification bell with optional sound
- Store settings (name, tagline, hours, pickup instructions, open/closed toggle)

### Security
- Supabase Row Level Security on every table
- Server-side authorization on every API route (owner routes require the `owner` role)
- Authoritative server-side pricing — browser totals are never trusted
- Atomic stock decrements with automatic restore on failure
- Order idempotency via client request IDs
- Service-role key is server-only and never exposed to the browser
- Owner area excluded from sitemap and robots

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4 |
| Language | TypeScript (strict) |
| Backend | Supabase (Auth, Postgres, Realtime, Storage) |
| Fonts | Manrope (headings), Inter (body) via `next/font` |
| Hosting | Vercel-ready (also Railway, Render, Fly.io, VPS) |

---

## Quick start

```bash
# 1. Install
npm install

# 2. Set up Supabase (see docs/SETUP.md for the full walkthrough)
#    - Create a project
#    - Run supabase/migrations/00001_init.sql
#    - Run supabase/migrations/00002_rls.sql
#    - Run supabase/seed.sql
#    - Create a public "product-images" Storage bucket

# 3. Configure environment
cp .env.example .env.local
# Fill in your Supabase URL, keys, and owner bootstrap credentials

# 4. Run
npm run dev
```

Then visit:

- Storefront: [http://localhost:3000](http://localhost:3000)
- Owner setup (first run): [http://localhost:3000/store-control-7x9/setup](http://localhost:3000/store-control-7x9/setup)
- Owner login: [http://localhost:3000/store-control-7x9/login](http://localhost:3000/store-control-7x9/login)

Full setup instructions: **[docs/SETUP.md](docs/SETUP.md)**

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create an optimized production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checks |

---

## Project structure

```
├── app/
│   ├── (public)/            # Customer pages (shop, cart, checkout, auth, account)
│   ├── store-control-7x9/   # Owner area (login, setup, dashboard)
│   ├── api/                 # Route handlers (orders, owner CRUD, upload)
│   ├── layout.tsx           # Root layout with fonts
│   ├── robots.ts            # Robots.txt (disallows owner area)
│   └── sitemap.ts           # Sitemap (public routes only)
├── components/
│   ├── brand/               # Logo and wordmark
│   ├── cart/                # Cart context and header button
│   ├── checkout/            # Success panel
│   ├── layout/              # Header, footer, announcement bar
│   ├── owner/               # Owner shell, dashboard widgets, notification bell
│   ├── product/             # Product card, purchase panel
│   ├── shop/                # Shop client (filters, search, sort)
│   └── store/               # Store info components
├── lib/
│   ├── auth/                # Session helpers, owner API guard, bootstrap, paths
│   ├── supabase/            # Client, server, and admin (service-role) clients
│   ├── data.ts              # Cached server-side data reads
│   ├── format.ts            # Currency, date, status labels
│   ├── images.ts            # Product/category image URLs
│   ├── notify.ts            # Notification helpers
│   ├── constants.ts         # Shared constants
│   └── types.ts             # Shared TypeScript types
├── middleware.ts            # Session refresh + owner route guard
├── supabase/
│   ├── migrations/          # 00001_init.sql, 00002_rls.sql
│   └── seed.sql             # Sample categories and products
└── docs/                    # Environment, setup, testing, deployment
```

---

## Documentation

| Guide | What it covers |
| --- | --- |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | Every environment variable and where to find it |
| [docs/SETUP.md](docs/SETUP.md) | Full local setup walkthrough |
| [docs/TESTING.md](docs/TESTING.md) | Manual and security test checklist |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deploying to Vercel and other platforms |

---

## License

Private — all rights reserved.
