# Deployment Guide

DailyNest is a Next.js app designed for Vercel, but it runs anywhere Node.js is supported.

## 1. Database (Supabase)

Your Supabase project **is** the database — deploy it first.

1. Create a Supabase project (see [SETUP.md](./SETUP.md) steps 3–6).
2. Run both migrations in the SQL Editor.
3. Run `supabase/seed.sql` (or import your own catalogue).
4. Create the public `product-images` Storage bucket.
5. Note the Project URL, Anon Key, and Service Role Key from Settings → API.

## 2. Deploy to Vercel

### Option A — Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts. Vercel detects Next.js automatically.

### Option B — Git integration

1. Push the repo to GitHub.
2. In [vercel.com](https://vercel.com), click **Add New → Project** and import the repo.
3. Vercel auto-detects the framework.

### Environment variables (Vercel Dashboard → Project → Settings → Environment Variables)

Add every variable from [ENVIRONMENT.md](./ENVIRONMENT.md):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
INITIAL_OWNER_EMAIL=...            # first-run only
INITIAL_OWNER_PASSWORD=...         # first-run only
```

Set them for **Production**, **Preview**, and **Development** as needed.

### First deploy

1. Deploy.
2. Visit `https://your-domain.vercel.app/store-control-7x9/setup` and create the owner.
3. Remove `INITIAL_OWNER_EMAIL` and `INITIAL_OWNER_PASSWORD` from Vercel (rotate if you prefer).
4. Sign in at `/store-control-7x9/login` and verify the dashboard.

## 3. Custom domain

1. Vercel Dashboard → Project → Settings → Domains → add your domain.
2. Update DNS as instructed (A record or CNAME).
3. Update `NEXT_PUBLIC_SITE_URL` to the final URL.
4. Redeploy so sitemap/robots pick up the new URL.

## 4. Other platforms

### Railway / Render / Fly.io

- Build command: `npm run build`
- Start command: `npm run start`
- Set all env vars in the platform's dashboard.
- Point `NEXT_PUBLIC_SITE_URL` at the public URL.

### Self-hosted (VPS)

```bash
npm ci
npm run build
npm run start   # listens on PORT (default 3000)
```

Use a process manager (pm2, systemd) and a reverse proxy (nginx, Caddy) for TLS.

```bash
# pm2 example
pm2 start npm --name dailynest -- start
```

## 5. Post-deploy checklist

- [ ] `/` loads and shows the store name and hero.
- [ ] `/shop` renders products.
- [ ] Owner login works at `/store-control-7x9/login`.
- [ ] A test customer order flows through the full lifecycle.
- [ ] `https://your-domain/sitemap.xml` returns valid XML.
- [ ] `https://your-domain/robots.txt` disallows `/store-control-7x9/`.
- [ ] Supabase → Database → RLS is enabled on every table (check the Policies tab).
- [ ] The service-role key is **not** present in any client bundle (search the built JS in DevTools).
- [ ] `INITIAL_OWNER_*` env vars are removed (or rotated) after owner creation.

## 6. Updating

```bash
git pull
npm ci
npm run build
# redeploy via your platform's mechanism (Vercel auto-deploys on push)
```

Database migrations: if you add new migration files, run them in the Supabase SQL Editor **before** deploying code that depends on them.
