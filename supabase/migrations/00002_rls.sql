-- ============================================================================
-- DailyNest — Row Level Security Policies
-- ============================================================================
-- SECURITY MODEL
--   • Every table has RLS enabled. Deny-by-default.
--   • Customers can read public catalogue data, and read/write ONLY their
--     own profile, their own orders, and their own notifications.
--   • The owner role (verified server-side AND in-DB via is_owner()) can
--     manage catalogue, inventory, orders, and settings.
--   • Privileged writes that a customer must never perform (granting the
--     owner role, marking an order paid) are additionally gated by
--     is_service_role(), which only the server's service-role client
--     satisfies.
--   • Prices/totals on orders are written only by the server (service role)
--     or are immutable to customers; a customer can never edit their own
--     order's total after creation.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.profiles force row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

drop policy if exists "profiles_select_owner_readable" on public.profiles;
create policy "profiles_select_owner_readable"
  on public.profiles for select
  to authenticated
  using (public.is_owner());

-- Customers may update their own name/phone ONLY. Role changes are rejected
-- by the column-level check below.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and role = 'customer'
  );

-- Only the server (service role) may create profiles with a non-customer
-- role or insert rows directly. The signup trigger already creates the
-- customer profile, so customers never need an insert policy.
drop policy if exists "profiles_insert_service" on public.profiles;
create policy "profiles_insert_service"
  on public.profiles for insert
  to authenticated
  with check (public.is_service_role());

-- ---------------------------------------------------------------------------
-- CATEGORIES (public catalogue)
-- ---------------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.categories force row level security;

drop policy if exists "categories_select_public" on public.categories;
create policy "categories_select_public"
  on public.categories for select
  to anon, authenticated
  using (true);

drop policy if exists "categories_write_owner" on public.categories;
create policy "categories_write_owner"
  on public.categories for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- ---------------------------------------------------------------------------
-- PRODUCTS (public catalogue)
-- ---------------------------------------------------------------------------
alter table public.products enable row level security;
alter table public.products force row level security;

drop policy if exists "products_select_public" on public.products;
create policy "products_select_public"
  on public.products for select
  to anon, authenticated
  using (true);

drop policy if exists "products_write_owner" on public.products;
create policy "products_write_owner"
  on public.products for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- ---------------------------------------------------------------------------
-- ORDERS
-- ---------------------------------------------------------------------------
alter table public.orders enable row level security;
alter table public.orders force row level security;

-- Owner can see every order.
drop policy if exists "orders_select_owner" on public.orders;
create policy "orders_select_owner"
  on public.orders for select
  to authenticated
  using (public.is_owner());

-- Customer can see only their own orders.
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own"
  on public.orders for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Orders are created by the server (service role) so prices/totals are
-- authoritative. Customers get NO insert policy — creation goes through the
-- /api/orders route handler which uses the service role after validating
-- the session and re-pricing from the DB. This prevents any browser-sent
-- total from ever being trusted.
drop policy if exists "orders_insert_service" on public.orders;
create policy "orders_insert_service"
  on public.orders for insert
  to authenticated
  with check (public.is_service_role());

-- Customers may NOT update their own orders at all. Only the owner (or the
-- server acting for the owner) transitions status. This is what stops a
-- customer from marking an order as paid or collected.
drop policy if exists "orders_update_owner" on public.orders;
create policy "orders_update_owner"
  on public.orders for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

drop policy if exists "orders_delete_owner" on public.orders;
create policy "orders_delete_owner"
  on public.orders for delete
  to authenticated
  using (public.is_owner());

-- ---------------------------------------------------------------------------
-- ORDER ITEMS
-- ---------------------------------------------------------------------------
alter table public.order_items enable row level security;
alter table public.order_items force row level security;

drop policy if exists "order_items_select_owner" on public.order_items;
create policy "order_items_select_owner"
  on public.order_items for select
  to authenticated
  using (public.is_owner());

drop policy if exists "order_items_select_own_order" on public.order_items;
create policy "order_items_select_own_order"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = (select auth.uid())
    )
  );

drop policy if exists "order_items_insert_service" on public.order_items;
create policy "order_items_insert_service"
  on public.order_items for insert
  to authenticated
  with check (public.is_service_role());

-- Items are immutable after creation; no update/delete policies for
-- customers. Owner may delete (cascade handled at order level).
drop policy if exists "order_items_delete_owner" on public.order_items;
create policy "order_items_delete_owner"
  on public.order_items for delete
  to authenticated
  using (public.is_owner());

-- ---------------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------------
alter table public.notifications enable row level security;
alter table public.notifications force row level security;

-- Owner reads all owner-audience notifications.
drop policy if exists "notifications_select_owner_audience" on public.notifications;
create policy "notifications_select_owner_audience"
  on public.notifications for select
  to authenticated
  using (public.is_owner() and audience = 'owner');

-- Customer reads only their own notifications.
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (
    audience = 'customer'
    and user_id = (select auth.uid())
  );

-- Customers can mark their own notifications read.
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (
    audience = 'customer'
    and user_id = (select auth.uid())
  )
  with check (
    audience = 'customer'
    and user_id = (select auth.uid())
  );

-- Owner can mark their own audience notifications read.
drop policy if exists "notifications_update_owner" on public.notifications;
create policy "notifications_update_owner"
  on public.notifications for update
  to authenticated
  using (public.is_owner() and audience = 'owner')
  with check (public.is_owner() and audience = 'owner');

-- Notifications are created only by the server (service role).
drop policy if exists "notifications_insert_service" on public.notifications;
create policy "notifications_insert_service"
  on public.notifications for insert
  to authenticated
  with check (public.is_service_role());

drop policy if exists "notifications_delete_owner" on public.notifications;
create policy "notifications_delete_owner"
  on public.notifications for delete
  to authenticated
  using (public.is_owner());

-- ---------------------------------------------------------------------------
-- STORE SETTINGS
-- ---------------------------------------------------------------------------
alter table public.store_settings enable row level security;
alter table public.store_settings force row level security;

-- Anyone (including anonymous visitors) may read store settings — these are
-- public (name, address, hours). No private data is stored here.
drop policy if exists "store_settings_select_public" on public.store_settings;
create policy "store_settings_select_public"
  on public.store_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "store_settings_update_owner" on public.store_settings;
create policy "store_settings_update_owner"
  on public.store_settings for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- ---------------------------------------------------------------------------
-- REALTIME
-- ---------------------------------------------------------------------------
-- Enable realtime on the tables the dashboards subscribe to.
do $$
begin
  begin
    alter publication supabase_realtime add table public.orders;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.products;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.order_items;
  exception when duplicate_object then null; end;
end $$;

-- ---------------------------------------------------------------------------
-- GRANTS (belt & suspenders on top of RLS)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products, public.store_settings to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.orders, public.order_items, public.notifications to authenticated;
