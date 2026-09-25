-- Discount coupons: store owners create codes (percentage or fixed
-- amount, optional expiry/usage limit/minimum order), customers type
-- them in at checkout. Coupons are never exposed to `public` directly —
-- both lookup and redemption go through SECURITY DEFINER functions so a
-- customer can only ever learn "this code is worth R$X off", never list
-- or enumerate a store's codes.

create table coupons (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  code text not null,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value integer not null check (
    discount_value > 0
    and (discount_type = 'fixed' or discount_value <= 100)
  ),
  min_order_cents integer not null default 0 check (min_order_cents >= 0),
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  usage_count integer not null default 0 check (usage_count >= 0),
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index coupons_store_code_key on coupons (store_id, upper(code));

alter table orders
  add column coupon_id uuid references coupons (id) on delete set null;

alter table coupons enable row level security;

create policy "Owners manage their own coupons"
  on coupons for all
  to authenticated
  using (is_store_owner(store_id))
  with check (is_store_owner(store_id));

-- Read-only lookup used by the checkout form to show the discount before
-- the order is actually submitted. Never touches usage_count.
create or replace function preview_coupon(
  p_store_id uuid,
  p_code text,
  p_subtotal_cents integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coupon coupons%rowtype;
  v_discount integer;
begin
  if p_code is null or trim(p_code) = '' then
    return 0;
  end if;

  select * into v_coupon
  from coupons
  where store_id = p_store_id
    and upper(code) = upper(trim(p_code))
    and active = true
    and (expires_at is null or expires_at > now())
    and (usage_limit is null or usage_count < usage_limit)
    and p_subtotal_cents >= min_order_cents;

  if not found then
    return 0;
  end if;

  if v_coupon.discount_type = 'percentage' then
    v_discount := (p_subtotal_cents * v_coupon.discount_value) / 100;
  else
    v_discount := v_coupon.discount_value;
  end if;

  return least(v_discount, p_subtotal_cents);
end;
$$;

-- Authoritative redemption, called once right after order_items are
-- inserted (so subtotal_cents on the order is finally the real,
-- server-priced total). Locks the coupon row to avoid two concurrent
-- checkouts both squeezing past a usage_limit of 1. Never raises — an
-- expired/exhausted code between preview and submit just silently
-- applies no discount rather than losing the order that was already
-- placed.
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

  select * into v_order from orders where id = p_order_id;
  if not found then
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
