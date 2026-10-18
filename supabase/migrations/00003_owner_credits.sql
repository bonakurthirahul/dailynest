-- ============================================================================
-- DailyNest — Owner Credits (admin access gate)
-- ============================================================================
-- Adds a credits balance to profiles. The store owner must hold at least
-- OWNER_MIN_CREDITS (see lib/auth/credits.ts, currently 1) to access the
-- owner dashboard and /api/owner/* endpoints.
--
-- Run this BEFORE deploying code that enforces the credits gate, otherwise
-- owners are locked out (the app fails open only when the column is missing
-- entirely, and fails closed once the column exists with insufficient value).
--
--   supabase db push
-- or
--   psql "$SUPABASE_DB_URL" -f supabase/migrations/00003_owner_credits.sql
-- ============================================================================

-- ---------------------------------------------------------------------------
-- CREDITS COLUMN
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists credits integer not null default 0;

do $$ begin
  alter table public.profiles
    add constraint profiles_credits_non_negative check (credits >= 0);
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- BACKFILL — existing owners get a starting balance so this migration never
-- locks out a store that was already running before credits existed.
-- ---------------------------------------------------------------------------
update public.profiles
set credits = 100
where role = 'owner';

-- ---------------------------------------------------------------------------
-- HARDENING — customers may update their own name/phone via RLS, but must
-- NEVER be able to edit their own (or anyone's) credits. Column-level grants
-- enforce this even though the RLS row policy allows the update. The service
-- role (server) is unaffected by these grants and remains the only writer of
-- credits.
-- ---------------------------------------------------------------------------
revoke update on table public.profiles from authenticated;
grant update (full_name, phone) on table public.profiles to authenticated;
