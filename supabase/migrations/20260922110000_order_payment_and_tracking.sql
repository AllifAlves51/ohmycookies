-- Customer's stated payment preference at checkout (informational only —
-- there is no online payment gateway in V1; the `payments` table remains
-- the owner-confirmed record of what was actually received).
alter table orders
  add column payment_preference payment_method;

-- Snapshot of the delivery zone's estimated time at order placement, same
-- rationale as delivery_zone_name/delivery_fee_cents: a zone can change
-- later without altering the historical record shown to the customer on
-- the tracking page.
alter table orders
  add column delivery_estimated_minutes integer;

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
    new.delivery_estimated_minutes := null;
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
    new.delivery_estimated_minutes := v_zone.estimated_time_minutes;
  end if;

  new.subtotal_cents := 0;
  new.total_cents := new.delivery_fee_cents - new.discount_cents;

  return new;
end;
$$;

-- Order tracking -----------------------------------------------------------
-- The tracking link (/cardapio/[slug]/pedido/[id]) is shared only with the
-- customer who just placed the order, keyed by the order's random uuid —
-- same minimal-exposure pattern as get_order_number()/order_exists(): the
-- public role gets no general SELECT on orders, only these narrow
-- security-definer answers.

create type order_tracking as (
  order_number integer,
  status order_status,
  fulfillment_type fulfillment_type,
  delivery_zone_name text,
  delivery_estimated_minutes integer,
  total_cents integer,
  created_at timestamptz
);

create or replace function get_order_tracking(p_order_id uuid)
returns order_tracking
language sql
security definer
stable
set search_path = public
as $$
  select
    order_number,
    status,
    fulfillment_type,
    delivery_zone_name,
    delivery_estimated_minutes,
    total_cents,
    created_at
  from orders
  where id = p_order_id;
$$;

create or replace function get_order_tracking_items(p_order_id uuid)
returns table (
  product_name text,
  quantity integer,
  unit_price_cents integer,
  subtotal_cents integer
)
language sql
security definer
stable
set search_path = public
as $$
  select product_name, quantity, unit_price_cents, subtotal_cents
  from order_items
  where order_id = p_order_id
  order by created_at;
$$;
