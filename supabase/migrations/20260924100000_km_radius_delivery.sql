-- Distance-radius delivery: delivery_zones gain a radius_km tier
-- (alongside the existing name/fee/estimated_time_minutes, which stay as
-- the display label and per-tier fee/ETA). store_settings gain prep time,
-- a free-delivery threshold, and the address-confirmation-map toggle.
-- stores/customers.latitude/longitude (reserved since the initial schema)
-- are finally put to use as the geocoded origin/destination for distance
-- lookups.

alter table delivery_zones
  add column radius_km numeric(6, 2) check (radius_km is null or radius_km > 0);

alter table store_settings
  add column free_delivery_threshold_cents integer check (free_delivery_threshold_cents is null or free_delivery_threshold_cents >= 0),
  add column order_prep_minutes integer not null default 0 check (order_prep_minutes >= 0),
  add column address_map_confirmation_enabled boolean not null default false;

-- Snapshot of the zone's nominal fee at order time, kept separate from
-- delivery_fee_cents (the amount actually charged) so free-delivery
-- eligibility can be re-evaluated every time order_items change without
-- losing the original number to revert to.
alter table orders
  add column delivery_zone_fee_cents integer;

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
    new.delivery_zone_fee_cents := 0;
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
    new.delivery_zone_fee_cents := v_zone.fee_cents;
    new.delivery_estimated_minutes := v_zone.estimated_time_minutes;
  end if;

  new.subtotal_cents := 0;
  new.total_cents := new.delivery_fee_cents - new.discount_cents;

  return new;
end;
$$;

create or replace function recalc_order_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_subtotal integer;
  v_store_id uuid;
  v_zone_fee integer;
  v_free_threshold integer;
  v_effective_fee integer;
begin
  v_order_id := coalesce(new.order_id, old.order_id);

  select coalesce(sum(subtotal_cents), 0) into v_subtotal
  from order_items
  where order_id = v_order_id;

  select store_id, delivery_zone_fee_cents into v_store_id, v_zone_fee
  from orders
  where id = v_order_id;

  select free_delivery_threshold_cents into v_free_threshold
  from store_settings
  where store_id = v_store_id;

  v_effective_fee := coalesce(v_zone_fee, 0);
  if v_free_threshold is not null and v_subtotal >= v_free_threshold then
    v_effective_fee := 0;
  end if;

  update orders
  set subtotal_cents = v_subtotal,
      delivery_fee_cents = v_effective_fee,
      total_cents = v_subtotal + v_effective_fee - discount_cents
  where id = v_order_id;

  return null;
end;
$$;
