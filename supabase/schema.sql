-- ============================================================================
-- Rocco's QR Ordering System — Database Schema
-- Run this in Supabase SQL Editor (Project -> SQL Editor -> New query)
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- ROLES
-- ----------------------------------------------------------------------------
create type user_role as enum ('manager', 'chef');

-- ----------------------------------------------------------------------------
-- PROFILES  (extends Supabase auth.users with a role)
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role user_role not null default 'chef',
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- RESTAURANT SETTINGS (single row config: VAT rate, name, currency)
-- ----------------------------------------------------------------------------
create table public.restaurant_settings (
  id int primary key default 1 check (id = 1),
  restaurant_name text not null default 'Rocco''s Pizza',
  currency text not null default 'LKR',
  vat_rate numeric(5,2) not null default 8.00, -- percent
  service_charge_rate numeric(5,2) not null default 0.00,
  updated_at timestamptz not null default now()
);
insert into public.restaurant_settings (id, restaurant_name, currency, vat_rate)
values (1, 'Rocco''s Pizza', 'LKR', 8.00);

-- ----------------------------------------------------------------------------
-- TABLES  (physical restaurant tables, one QR each)
-- ----------------------------------------------------------------------------
create table public.tables (
  id serial primary key,
  label text not null,           -- e.g. "Table 1"
  seats int not null default 4,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- CATEGORIES
-- ----------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- MENU ITEMS
-- ----------------------------------------------------------------------------
create table public.menu_items (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  image_url text,
  prep_time_minutes int not null default 15,
  is_available boolean not null default true,
  is_spicy boolean not null default false,
  is_popular boolean not null default false,
  is_new boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_menu_items_category on public.menu_items(category_id);

-- ----------------------------------------------------------------------------
-- PROMOTIONS
-- ----------------------------------------------------------------------------
create table public.promotions (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  discount_percent numeric(5,2),
  menu_item_id uuid references public.menu_items(id) on delete cascade,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- ORDERS
-- ----------------------------------------------------------------------------
create type order_status as enum
  ('waiting', 'accepted', 'preparing', 'ready', 'served', 'cancelled');

create sequence public.order_number_seq start 1001;

create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  order_number int not null default nextval('public.order_number_seq'),
  table_id int not null references public.tables(id),
  status order_status not null default 'waiting',
  subtotal numeric(10,2) not null default 0,
  vat_amount numeric(10,2) not null default 0,
  service_charge numeric(10,2) not null default 0,
  grand_total numeric(10,2) not null default 0,
  estimated_ready_minutes int not null default 20,
  waiter_called boolean not null default false,
  bill_requested boolean not null default false,
  accepted_at timestamptz,
  ready_at timestamptz,
  served_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_orders_status on public.orders(status);
create index idx_orders_table on public.orders(table_id);
create index idx_orders_created on public.orders(created_at desc);

-- ----------------------------------------------------------------------------
-- ORDER ITEMS
-- ----------------------------------------------------------------------------
create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id),
  item_name text not null,      -- snapshot at time of order
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  notes text,
  line_total numeric(10,2) not null,
  created_at timestamptz not null default now()
);
create index idx_order_items_order on public.order_items(order_id);

-- ----------------------------------------------------------------------------
-- REVIEWS
-- ----------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete set null,
  table_id int references public.tables(id),
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- AUDIT LOGS  (manager/chef actions worth tracking)
-- ----------------------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references auth.users(id),
  action text not null,
  entity text not null,
  entity_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- HELPER: current user's role
-- ============================================================================
create or replace function public.current_role()
returns user_role
language sql stable
security definer
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.restaurant_settings enable row level security;
alter table public.tables enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.promotions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.audit_logs enable row level security;

-- PROFILES: a user can read their own profile; managers can read all
create policy "profiles_self_read" on public.profiles
  for select using (auth.uid() = id or public.current_role() = 'manager');
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);

-- PUBLIC READ (menu browsing needs no login): categories, menu_items, tables, settings, promotions
create policy "categories_public_read" on public.categories
  for select using (true);
create policy "menu_items_public_read" on public.menu_items
  for select using (true);
create policy "tables_public_read" on public.tables
  for select using (true);
create policy "settings_public_read" on public.restaurant_settings
  for select using (true);
create policy "promotions_public_read" on public.promotions
  for select using (true);

-- MANAGER-ONLY WRITE for catalog data
create policy "categories_manager_write" on public.categories
  for all using (public.current_role() = 'manager')
  with check (public.current_role() = 'manager');
create policy "menu_items_manager_write" on public.menu_items
  for all using (public.current_role() = 'manager')
  with check (public.current_role() = 'manager');
create policy "tables_manager_write" on public.tables
  for all using (public.current_role() = 'manager')
  with check (public.current_role() = 'manager');
create policy "settings_manager_write" on public.restaurant_settings
  for all using (public.current_role() = 'manager')
  with check (public.current_role() = 'manager');
create policy "promotions_manager_write" on public.promotions
  for all using (public.current_role() = 'manager')
  with check (public.current_role() = 'manager');

-- ORDERS: anyone (anonymous customers) can create an order and read orders
-- (kept open for read/insert because customers are never authenticated —
-- table_id + order_number act as the customer's private link).
-- Chefs and managers can read/update all orders. Only staff can change status.
create policy "orders_public_insert" on public.orders
  for insert with check (true);
create policy "orders_public_read" on public.orders
  for select using (true);
create policy "orders_staff_update" on public.orders
  for update using (public.current_role() in ('manager', 'chef'));
create policy "orders_manager_delete" on public.orders
  for delete using (public.current_role() = 'manager');

create policy "order_items_public_insert" on public.order_items
  for insert with check (true);
create policy "order_items_public_read" on public.order_items
  for select using (true);
create policy "order_items_staff_write" on public.order_items
  for update using (public.current_role() in ('manager', 'chef'));

-- REVIEWS: anyone can submit; only manager can read the full list from admin UI
-- (kept public-read too, since review carousel could be shown on menu)
create policy "reviews_public_insert" on public.reviews
  for insert with check (true);
create policy "reviews_public_read" on public.reviews
  for select using (true);

-- AUDIT LOGS: staff only
create policy "audit_staff_read" on public.audit_logs
  for select using (public.current_role() in ('manager', 'chef'));
create policy "audit_staff_insert" on public.audit_logs
  for insert with check (public.current_role() in ('manager', 'chef'));

-- ============================================================================
-- REALTIME: enable replication for tables the UI subscribes to
-- ============================================================================
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;

-- ============================================================================
-- TRIGGER: keep updated_at fresh on menu_items
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger trg_menu_items_updated
  before update on public.menu_items
  for each row execute function public.set_updated_at();

-- ============================================================================
-- SEED: 30 tables
-- ============================================================================
insert into public.tables (label, seats)
select 'Table ' || gs, (array[2,2,4,4,4,6])[1 + floor(random()*6)]
from generate_series(1, 30) as gs;
