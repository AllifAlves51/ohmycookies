-- updated_at maintenance -----------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_stores_updated_at before update on stores
  for each row execute function set_updated_at();
create trigger trg_store_settings_updated_at before update on store_settings
  for each row execute function set_updated_at();
create trigger trg_categories_updated_at before update on categories
  for each row execute function set_updated_at();
create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();
create trigger trg_customers_updated_at before update on customers
  for each row execute function set_updated_at();
create trigger trg_delivery_zones_updated_at before update on delivery_zones
  for each row execute function set_updated_at();
create trigger trg_orders_updated_at before update on orders
  for each row execute function set_updated_at();

-- Store ownership helper, used throughout RLS policies -------------------
-- security definer + fixed search_path avoids RLS recursion/hijacking
-- issues when this is called from inside another table's policy.

create or replace function is_store_owner(p_store_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from stores
    where id = p_store_id and owner_id = auth.uid()
  );
$$;

-- Lets the anonymous checkout's order_items insert policy confirm an order
-- id exists without granting the public role a general SELECT on orders
-- (which stays private — see RLS policies migration). Only ever answers a
-- boolean, so it can't leak order data.

create or replace function order_exists(p_order_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from orders
    where id = p_order_id
  );
$$;

-- Per-store sequential order numbers --------------------------------------

create or replace function next_order_number(p_store_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_number integer;
begin
  insert into store_order_sequences (store_id, last_number)
  values (p_store_id, 1)
  on conflict (store_id) do update
    set last_number = store_order_sequences.last_number + 1
  returning last_number into v_number;

  return v_number;
end;
$$;

create or replace function set_order_number()
returns trigger
language plpgsql
as $$
begin
  if new.order_number is null then
    new.order_number := next_order_number(new.store_id);
  end if;
  return new;
end;
$$;

create trigger trg_set_order_number
  before insert on orders
  for each row execute function set_order_number();

-- Order snapshot + total integrity ----------------------------------------
-- Runs as security definer because it needs to read delivery_zones and
-- customers on behalf of the anonymous checkout flow, which otherwise has
-- no SELECT access to those tables (see RLS policies migration).

create or replace function set_order_snapshot_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_zone delivery_zones%rowtype;
  v_customer_store_id uuid;
begin
  select store_id into v_customer_store_id
  from customers
  where id = new.customer_id;

  if v_customer_store_id is null or v_customer_store_id <> new.store_id then
    raise exception 'Cliente inválido para esta loja';
  end if;

  if new.fulfillment_type = 'pickup' then
    new.delivery_zone_id := null;
    new.delivery_zone_name := null;
    new.delivery_fee_cents := 0;
  else
    if new.delivery_zone_id is null then
      raise exception 'Região de entrega é obrigatória para pedidos com entrega';
    end if;

    select * into v_zone
    from delivery_zones
    where id = new.delivery_zone_id and store_id = new.store_id and active = true;

    if not found then
      raise exception 'Região de entrega inválida ou inativa';
    end if;

    new.delivery_zone_name := v_zone.name;
    new.delivery_fee_cents := v_zone.fee_cents;
  end if;

  -- subtotal_cents is derived from order_items once they're inserted (see
  -- recalc_order_totals below); the order always starts at zero items.
  new.subtotal_cents := 0;
  new.total_cents := new.delivery_fee_cents - new.discount_cents;

  return new;
end;
$$;

create trigger trg_set_order_snapshot_fields
  before insert on orders
  for each row execute function set_order_snapshot_fields();

-- order_items snapshot stamping -------------------------------------------
-- Ignores whatever product_name/unit_price_cents the client sends and
-- re-derives them from the current product row, scoped to the order's own
-- store. This is what makes the historical snapshot trustworthy even
-- though anonymous checkout can insert rows directly.

create or replace function stamp_order_item_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product products%rowtype;
  v_order_store_id uuid;
begin
  if new.product_id is null then
    raise exception 'product_id é obrigatório ao criar um item de pedido';
  end if;

  select store_id into v_order_store_id
  from orders
  where id = new.order_id;

  if v_order_store_id is null then
    raise exception 'Pedido inválido';
  end if;

  select * into v_product
  from products
  where id = new.product_id and store_id = v_order_store_id and active = true;

  if not found then
    raise exception 'Produto inválido, indisponível ou de outra loja';
  end if;

  new.product_name := v_product.name;
  new.unit_price_cents := coalesce(v_product.promo_price_cents, v_product.price_cents);
  new.subtotal_cents := new.unit_price_cents * new.quantity;

  return new;
end;
$$;

create trigger trg_stamp_order_item_snapshot
  before insert on order_items
  for each row execute function stamp_order_item_snapshot();

-- Recomputing subtotal_cents on manual quantity edits (admin correction)
-- reuses the existing unit_price_cents snapshot rather than re-pricing
-- against the live product.

create or replace function recompute_order_item_subtotal()
returns trigger
language plpgsql
as $$
begin
  new.subtotal_cents := new.unit_price_cents * new.quantity;
  return new;
end;
$$;

create trigger trg_recompute_order_item_subtotal
  before update on order_items
  for each row execute function recompute_order_item_subtotal();

-- Keep orders.subtotal_cents/total_cents in sync with their items ---------

create or replace function recalc_order_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_subtotal integer;
begin
  v_order_id := coalesce(new.order_id, old.order_id);

  select coalesce(sum(subtotal_cents), 0) into v_subtotal
  from order_items
  where order_id = v_order_id;

  update orders
  set subtotal_cents = v_subtotal,
      total_cents = v_subtotal + delivery_fee_cents - discount_cents
  where id = v_order_id;

  return null;
end;
$$;

create trigger trg_recalc_order_totals
  after insert or update or delete on order_items
  for each row execute function recalc_order_totals();
