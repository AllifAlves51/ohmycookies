-- stores
-- `owner_id` is unique: one store per user in V1. The constraint is the only
-- thing enforcing "single store per user" — dropping it is the intended path
-- to evolve into multi-store later without touching any other table.
create table stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null,
  slug text not null unique,
  whatsapp_number text,
  logo_url text,
  address jsonb,
  opening_hours jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- store_settings (1:1 with stores)
create table store_settings (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references stores (id) on delete cascade,
  min_order_cents integer not null default 0 check (min_order_cents >= 0),
  pickup_enabled boolean not null default true,
  delivery_enabled boolean not null default true,
  -- Reserved for a future maps/geocoding integration; unused by V1's
  -- manual-region delivery fee flow.
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  name text not null,
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- products
create table products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  category_id uuid references categories (id) on delete set null,
  name text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  promo_price_cents integer check (
    promo_price_cents is null or (promo_price_cents >= 0 and promo_price_cents < price_cents)
  ),
  image_url text,
  featured boolean not null default false,
  active boolean not null default true,
  stock_control_enabled boolean not null default false,
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- customers
create table customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  name text not null,
  whatsapp text not null,
  address jsonb,
  -- Reserved for a future maps/geocoding integration.
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, whatsapp)
);

-- delivery_zones
-- V1 delivery fee model: the customer manually picks a named region
-- (bairro) at checkout instead of a distance/map calculation.
create table delivery_zones (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  name text not null,
  fee_cents integer not null check (fee_cents >= 0),
  estimated_time_minutes integer not null check (estimated_time_minutes > 0),
  active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, name)
);

-- Per-store sequential order numbers (order_number in `orders` is never
-- globally unique, only unique within a store). Internal table only,
-- touched exclusively through next_order_number() — see
-- 20260921120200_functions_triggers.sql.
create table store_order_sequences (
  store_id uuid primary key references stores (id) on delete cascade,
  last_number integer not null default 0
);

-- orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  customer_id uuid not null references customers (id) on delete restrict,
  -- Always populated by trg_set_order_number before the row is written;
  -- never pass this explicitly on insert.
  order_number integer not null,
  status order_status not null default 'new',
  fulfillment_type fulfillment_type not null,
  delivery_zone_id uuid references delivery_zones (id) on delete set null,
  -- Snapshots: a zone can be renamed, deactivated, or deleted later without
  -- altering the historical record of what the customer was charged.
  delivery_zone_name text,
  delivery_address jsonb,
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  delivery_fee_cents integer not null default 0 check (delivery_fee_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, order_number),
  check (total_cents = subtotal_cents + delivery_fee_cents - discount_cents)
);

-- order_items
-- product_name and unit_price_cents are snapshots stamped at insert time by
-- a trigger (see stamp_order_item_snapshot in the next migration) so the
-- historical order is preserved even after the product changes or is
-- deleted (product_id -> null via ON DELETE SET NULL).
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  product_name text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  created_at timestamptz not null default now()
);

-- payments
-- Manual payment records only (cash/pix/card confirmed by the store owner
-- after the fact) — no online payment gateway in V1.
create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  method payment_method not null,
  status payment_status not null default 'pending',
  amount_cents integer not null check (amount_cents >= 0),
  created_at timestamptz not null default now()
);
