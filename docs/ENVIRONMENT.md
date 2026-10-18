# Environment Variables

Create a `.env.local` file in the project root (never commit it) and fill in the values below. `.env.example` is a tracked template you can copy.

```bash
cp .env.example .env.local
```

## Required — Supabase

| Variable | Where to find it | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API | Project URL, e.g. `https://xyzcompany.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page | Safe to expose in the browser. RLS protects data. |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page | **Server-only.** Bypasses RLS. Never expose to the client. |

## Required — App

| Variable | Example | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://dailynest.vercel.app` | Used for sitemap, robots, and auth redirects. Local dev: `http://localhost:3000` |

## Optional — Owner bootstrap (first-run only)

Set these **once** to create the store owner account on first visit to `/store-control-7x9/setup`. Remove them after the owner is created (or leave them; the bootstrap is idempotent and will never overwrite an existing owner).

| Variable | Notes |
| --- | --- |
| `INITIAL_OWNER_EMAIL` | Email for the owner login. |
| `INITIAL_OWNER_PASSWORD` | Minimum 12 characters. |

## Optional — Email (password resets)

| Variable | Notes |
| --- | --- |
| `RESEND_API_KEY` | If set, password-reset emails are sent via Resend. If unset, the reset link is logged to the server console instead (fine for local dev). |

## Optional — Web push

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web-push VAPID public key. |
| `VAPID_PRIVATE_KEY` | Web-push VAPID private key. Server-only. |

## Security reminders

- `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, and `RESEND_API_KEY` must **never** appear in any `NEXT_PUBLIC_*` variable or client-side code.
- The owner bootstrap env vars are read only in a `server-only` module.
- Rotate the service-role key if it is ever committed or logged.
