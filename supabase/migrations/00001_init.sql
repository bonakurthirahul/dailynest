-- ============================================================================
-- DailyNest — Initial Schema
-- ============================================================================
-- Run this in the Supabase SQL editor, or via the Supabase CLI:
--   supabase db push
-- or
--   psql "$SUPABASE_DB_URL" -f supabase/migrations/00001_init.sql
-- ============================================================================

-- Extensions ----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('customer', 'owner');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum
    ('pending', 'accepted', 'preparing', 'ready', 'collected', 'rejected', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('unpaid', 'paid_at_store');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum ('cash', 'upi', 'pay_at_store');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_audience as enum ('owner', 'customer');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  role user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint role_is_customer_or_owner check (role in ('customer', 'owner'))
);

create index if not exists profiles_role_idx on public.profiles (role);

-- ---------------------------------------------------------------------------
-- CATEGORIES
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- PRODUCTS
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  unit_label text,                    -- e.g. '1 kg', '500 g', '6 pcs'
  price_in_paise integer not null check (price_in_paise >= 0),
  discount_price_in_paise integer check (discount_price_in_paise is null or discount_price_in_paise >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 10 check (low_stock_threshold >= 0),
  is_available boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discount_lt_price check (
    discount_price_in_paise is null or discount_price_in_paise < price_in_paise
  )
);

create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_available_idx on public.products (is_available);
create index if not exists products_featured_idx on public.products (is_featured) where is_featured;
create index if not exists products_search_idx on public.products
  using gin (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, '')));

-- ---------------------------------------------------------------------------
-- ORDERS
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  pickup_notes text,
  status order_status not null default 'pending',
  payment_method payment_method not null default 'pay_at_store',
  payment_status payment_status not null default 'unpaid',
  subtotal_in_paise integer not null default 0 check (subtotal_in_paise >= 0),
  discount_in_paise integer not null default 0 check (discount_in_paise >= 0),
  total_in_paise integer not null default 0 check (total_in_paise >= 0),
  item_count integer not null default 0 check (item_count >= 0),
  status_reason text,
  client_request_id text,             -- idempotency key from the client
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);
create index if not exists orders_created_idx on public.orders (created_at desc);
-- Prevents duplicate orders when a client retries a slow request.
create unique index if not exists orders_client_request_uidx
  on public.orders (user_id, client_request_id)
  where client_request_id is not null;

-- ---------------------------------------------------------------------------
-- ORDER ITEMS
-- ---------------------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,         -- snapshot at time of purchase
  product_slug text,
  unit_label text,
  quantity integer not null check (quantity > 0),
  unit_price_in_paise integer not null check (unit_price_in_paise >= 0),
  line_total_in_paise integer not null check (line_total_in_paise >= 0),
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  audience notification_audience not null,
  user_id uuid references auth.users (id) on delete cascade,  -- set for customer notifications
  order_id uuid references public.orders (id) on delete cascade,
  title text not null,
  body text not null,
  kind text not null default 'general',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_audience_idx
  on public.notifications (audience, is_read, created_at desc);
create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- STORE SETTINGS (single row)
-- ---------------------------------------------------------------------------
create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  store_name text not null default 'DailyNest',
  tagline text not null default 'Your Daily Needs, All in One Place.',
  address text not null default 'Add your store address in the owner dashboard.',
  contact_phone text not null default '',
  contact_email text,
  opening_hours text not null default 'Mon–Sun · 7:00 AM – 9:00 PM',
  pickup_instructions text not null default
    'Collect your order at the counter. Show your order number and pay by cash or UPI.',
  is_open boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = '00000000-0000-0000-0000-000000000000'::uuid)
);

-- Seed the single settings row if it does not exist.
insert into public.store_settings (id)
values ('00000000-0000-0000-0000-000000000000')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- ORDER NUMBER SEQUENCE
-- ---------------------------------------------------------------------------
create sequence if not exists public.order_number_seq start 1001;

-- Allocate the next human-friendly order number (DN-1001, DN-1002, ...).
-- SECURITY: security definer + locked sequence so concurrent calls never
-- collide. Callable only from the server (service role) in practice because
-- the orders table insert itself is service-role gated.
create or replace function public.next_order_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_val bigint;
begin
  -- Only the service role may call this.
  if not public.is_service_role() then
    raise exception 'next_order_number is server-only';
  end if;

  select nextval('public.order_number_seq') into next_val;
  return 'DN-' || next_val::text;
end;
$$;

-- ---------------------------------------------------------------------------
-- updated_at TRIGGER HELPER
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists set_store_settings_updated_at on public.store_settings;
create trigger set_store_settings_updated_at
  before update on public.store_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- AUTO-CREATE PROFILE ON SIGNUP
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    -- SECURITY: never trust client-supplied metadata for role. Default is
    -- always 'customer'. Ownership is granted only via the server-side
    -- bootstrap path (see SECURITY.md / setup route).
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- CUSTOM SECURITY HELPERS
-- ---------------------------------------------------------------------------
-- Returns true when the *calling* (authenticated) user has the owner role.
-- SECURITY: uses security definer so RLS policies can consult the role
-- without allowing users to forge it — the role column itself is protected
-- by its own RLS policy (customers cannot update their own role).
create or replace function public.is_owner()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner'
  );
$$;

-- Only the service role (server) may grant the owner role. This function is
-- security definer and deliberately does NOT reference auth.uid() privileges
-- that a customer could satisfy; it verifies the caller is the service role.
create or replace function public.is_service_role()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  ) = 'service_role';
$$;
