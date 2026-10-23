-- Security review after the first month in production, plus the column
-- behind the seasonal storefront themes.
--
-- 1) store_settings was readable by anyone (anon key + "Public can read
--    store settings"), which exposed the owner's private alert number, the
--    Evolution instance name and the WhatsApp templates. The storefront now
--    reads a view with only the columns it needs.
-- 2) The anonymous checkout could insert an order with any status /
--    created_at / order_number / coupon, inflating reports.
-- 3) order_items accepted public inserts into *any* existing order forever
--    — anyone holding a tracking link could add items to an old order.
-- 4) apply_coupon_to_order could be replayed on the same order (burning the
--    coupon's usage_limit) or applied to someone else's order later.
-- 5) recalc_order_totals could compute a negative total when items were
--    removed from a discounted order, aborting the owner's edit.
-- 6) Storage buckets accepted any file type (e.g. HTML/SVG with scripts).

-- 0) Seasonal theme ------------------------------------------------------------

alter table store_settings
  add column if not exists seasonal_theme text not null default 'none'
    check (seasonal_theme in ('none', 'auto', 'halloween', 'christmas', 'easter', 'valentines', 'june', 'mothers_day'));

-- 1) Public view of store_settings ---------------------------------------------

drop policy if exists "Public can read store settings" on store_settings;

create or replace view public_store_settings
with (security_barrier = true) as
  select
    store_id,
    min_order_cents,
    pickup_enabled,
    delivery_enabled,
    latitude,
    longitude,
    free_delivery_threshold_cents,
    order_prep_minutes,
    address_map_confirmation_enabled,
    seasonal_theme
  from store_settings;

grant select on public_store_settings to anon, authenticated;

-- 2) Sanitize anonymous orders -------------------------------------------------
-- Fires before the other insert triggers (alphabetical order), so the
-- snapshot/number triggers always see a clean row.

create or replace function sanitize_public_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_store_owner(new.store_id) then
    return new;
  end if;

  new.status := 'new';
  new.created_at := now();
  new.updated_at := now();
  new.order_number := null;
  new.coupon_id := null;
  new.discount_cents := 0;
  new.notes := null;
  return new;
end;
$$;

drop trigger if exists trg_a_sanitize_public_order on orders;
create trigger trg_a_sanitize_public_order
  before insert on orders
  for each row execute function sanitize_public_order();

-- 3) Public items only into a fresh order --------------------------------------

create or replace function order_accepts_public_items(p_order_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from orders
    where id = p_order_id
      and status = 'new'
      and coupon_id is null
      and created_at > now() - interval '10 minutes'
  );
$$;

drop policy if exists "Public can add items to an order" on order_items;
create policy "Public can add items to an order"
  on order_items for insert
  to public
  with check (order_accepts_public_items(order_id));

-- 4) Coupons: once per order, only right after checkout ------------------------

create or replace function apply_coupon_to_order(
  p_order_id uuid,
  p_code text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_coupon coupons%rowtype;
  v_discount integer;
begin
  if p_code is null or trim(p_code) = '' then
    return 0;
  end if;

  select * into v_order from orders where id = p_order_id for update;
  if not found
    or v_order.coupon_id is not null
    or v_order.discount_cents > 0
    or v_order.status <> 'new'
    or v_order.created_at < now() - interval '10 minutes' then
    return 0;
  end if;

  select * into v_coupon
  from coupons
  where store_id = v_order.store_id
    and upper(code) = upper(trim(p_code))
    and active = true
    and (expires_at is null or expires_at > now())
    and (usage_limit is null or usage_count < usage_limit)
    and v_order.subtotal_cents >= min_order_cents
  for update;

  if not found then
    return 0;
  end if;

  if v_coupon.discount_type = 'percentage' then
    v_discount := (v_order.subtotal_cents * v_coupon.discount_value) / 100;
  else
    v_discount := v_coupon.discount_value;
  end if;
  v_discount := least(v_discount, v_order.subtotal_cents);

  update coupons set usage_count = usage_count + 1 where id = v_coupon.id;

  update orders
  set coupon_id = v_coupon.id,
      discount_cents = v_discount,
      total_cents = subtotal_cents + delivery_fee_cents - v_discount
  where id = p_order_id;

  return v_discount;
end;
$$;

-- 5) Totals never go negative ----------------------------------------------------

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
      discount_cents = least(discount_cents, v_subtotal + v_effective_fee),
      total_cents = v_subtotal + v_effective_fee
        - least(discount_cents, v_subtotal + v_effective_fee)
  where id = v_order_id;

  return null;
end;
$$;

-- 6) Images only in the public buckets ---------------------------------------------

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
    file_size_limit = 5242880
where id in ('store-logos', 'product-images');
