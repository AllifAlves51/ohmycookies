-- Every table is store-scoped. Two access patterns throughout this file:
--   1. "owner" policies: the authenticated store owner has full CRUD over
--      their own store's rows, via is_store_owner(store_id).
--   2. "public" policies: the anonymous cardápio (storefront) only gets the
--      narrow read/insert access it needs to browse the menu and check out
--      — never a general SELECT on customer or order data.

alter table stores enable row level security;
alter table store_settings enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table customers enable row level security;
alter table delivery_zones enable row level security;
alter table store_order_sequences enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;

-- stores -------------------------------------------------------------------

create policy "Owners manage their own store"
  on stores for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Public can read store storefront info"
  on stores for select
  to public
  using (true);

-- store_settings -------------------------------------------------------------------

create policy "Owners manage their own store settings"
  on store_settings for all
  to authenticated
  using (is_store_owner(store_id))
  with check (is_store_owner(store_id));

create policy "Public can read store settings"
  on store_settings for select
  to public
  using (true);

-- categories -------------------------------------------------------------------

create policy "Owners manage their own categories"
  on categories for all
  to authenticated
  using (is_store_owner(store_id))
  with check (is_store_owner(store_id));

create policy "Public can read active categories"
  on categories for select
  to public
  using (active = true);

-- products -------------------------------------------------------------------

create policy "Owners manage their own products"
  on products for all
  to authenticated
  using (is_store_owner(store_id))
  with check (is_store_owner(store_id));

create policy "Public can read active products"
  on products for select
  to public
  using (active = true);

-- customers -------------------------------------------------------------------
-- No public SELECT: the storefront never needs to read back customer data,
-- and doing so would leak one customer's info to another anonymous visitor.

create policy "Owners manage their own customers"
  on customers for all
  to authenticated
  using (is_store_owner(store_id))
  with check (is_store_owner(store_id));

create policy "Public can register themselves as a customer"
  on customers for insert
  to public
  with check (true);

-- delivery_zones -------------------------------------------------------------------

create policy "Owners manage their own delivery zones"
  on delivery_zones for all
  to authenticated
  using (is_store_owner(store_id))
  with check (is_store_owner(store_id));

create policy "Public can read active delivery zones"
  on delivery_zones for select
  to public
  using (active = true);

-- store_order_sequences -------------------------------------------------------------------
-- Internal counter, touched only by the security-definer
-- next_order_number() function. No direct policies for anyone.

-- orders -------------------------------------------------------------------
-- No public SELECT: an anonymous checkout never needs to read an order back
-- from the database — the client already has the data it just submitted.

create policy "Owners manage their own orders"
  on orders for all
  to authenticated
  using (is_store_owner(store_id))
  with check (is_store_owner(store_id));

-- discount_cents = 0: there's no coupon/discount mechanism in V1, so the
-- only legitimate source of a discount is the store owner editing the
-- order afterwards — never the public checkout itself.
create policy "Public can place an order"
  on orders for insert
  to public
  with check (discount_cents = 0);

-- order_items -------------------------------------------------------------------

create policy "Owners manage their own order items"
  on order_items for all
  to authenticated
  using (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id and is_store_owner(o.store_id)
    )
  )
  with check (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id and is_store_owner(o.store_id)
    )
  );

create policy "Public can add items to an order"
  on order_items for insert
  to public
  with check (order_exists(order_id));

-- payments -------------------------------------------------------------------
-- Payments are recorded manually by the store owner after the fact; there
-- is no online payment gateway in V1, so the public role has no access.

create policy "Owners manage their own payments"
  on payments for all
  to authenticated
  using (
    exists (
      select 1 from orders o
      where o.id = payments.order_id and is_store_owner(o.store_id)
    )
  )
  with check (
    exists (
      select 1 from orders o
      where o.id = payments.order_id and is_store_owner(o.store_id)
    )
  );
