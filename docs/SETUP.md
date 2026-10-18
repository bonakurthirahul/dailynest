# Setup Guide

Get DailyNest running locally in ~15 minutes.

## 1. Prerequisites

- Node.js 20+ (check with `node -v`)
- A free [Supabase](https://supabase.com) account

## 2. Install dependencies

```bash
npm install
```

## 3. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project.
2. Pick a name, region (closest to your store), and a strong database password.
3. Wait for the project to provision (~2 minutes).

## 4. Run the database migrations

In the Supabase dashboard open **SQL Editor** and run the two migration files **in order**:

1. `supabase/migrations/00001_init.sql` — tables, triggers, functions.
2. `supabase/migrations/00002_rls.sql` — row-level security policies and realtime.

> Both files use `create if not exists` / `drop policy if exists`, so they are safe to re-run.

## 5. Seed the catalogue

Run `supabase/seed.sql` in the SQL Editor to load the sample categories and products. Delete or edit rows freely — this is just demo data.

## 6. Create the Storage bucket

1. In Supabase go to **Storage** → **New bucket**.
2. Name it `product-images`.
3. Set it to **Public bucket** (product images are not sensitive).
4. No need to configure policies — the app uploads only through the server-side `/api/owner/upload` route using the service-role key.

## 7. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the values from your Supabase project (Settings → API). See [ENVIRONMENT.md](./ENVIRONMENT.md) for every variable.

For a quick local start, also set:

```
INITIAL_OWNER_EMAIL=owner@example.com
INITIAL_OWNER_PASSWORD=change-this-password
```

## 8. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 9. Create the owner account

Visit [http://localhost:3000/store-control-7x9/setup](http://localhost:3000/store-control-7x9/setup) and click **Create owner account**. The server uses `INITIAL_OWNER_EMAIL` / `INITIAL_OWNER_PASSWORD` to provision the account and the `owner` role on the profile.

After the owner exists you can (and should) remove the two env vars from `.env.local`.

## 10. Sign in to the owner dashboard

Go to [http://localhost:3000/store-control-7x9/login](http://localhost:3000/store-control-7x9/login) and sign in with the owner credentials. You should land on the dashboard with the seeded products visible under **Products**.

## 11. Place a test order

1. Register a **customer** account at `/register`.
2. Browse `/shop`, add items, go to `/checkout`, and place an order.
3. Switch to the owner dashboard → **Orders** — the new order appears in real time.
4. Accept → Prepare → Mark ready → Mark collected.
5. Check `/account/orders` as the customer — the timeline updates in real time.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| "relation does not exist" | Re-run the two migration files in order. |
| Upload fails with a bucket error | Create the `product-images` Storage bucket (step 6). |
| Owner login says "no account" | Run the setup step (step 9) or check the env vars. |
| Realtime not firing | Confirm you enabled realtime on the tables (step 4 includes it) and that the browser tab is not offline. |
