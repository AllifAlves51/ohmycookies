-- 1) Stock control that actually moves: products with stock_control_enabled
--    lose stock when an order takes them and get it back when the order is
--    cancelled, deleted or edited down. Enforced here (not in the app) so
--    the public checkout, manual orders and edits all obey it.
-- 2) Cleanup for orders left without items when the item insert fails.
-- 3) Atomic editing of an existing order by the store owner.

-- Stock helpers -------------------------------------------------------------

create or replace function take_product_stock(p_product_id uuid, p_quantity integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product products%rowtype;
begin
  select * into v_product from products where id = p_product_id for update;
  if not found or not v_product.stock_control_enabled then
    return;
  end if;

  if coalesce(v_product.stock_quantity, 0) < p_quantity then
    raise exception 'Estoque insuficiente para %: restam % unidade(s)',
      v_product.name, coalesce(v_product.stock_quantity, 0)
      using errcode = 'P0001', hint = 'stock';
  end if;

  update products
  set stock_quantity = stock_quantity - p_quantity
  where id = p_product_id;
end;
$$;

create or replace function give_back_product_stock(p_product_id uuid, p_quantity integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update products
  set stock_quantity = coalesce(stock_quantity, 0) + p_quantity
  where id = p_product_id and stock_control_enabled;
end;
$$;

-- order_items: take on insert, adjust on quantity change, give back on delete

create or replace function sync_stock_on_order_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status order_status;
begin
  select status into v_status
  from orders
  where id = coalesce(new.order_id, old.order_id);

  -- Parent gone (cascade from an order delete, handled by that trigger) or
  -- cancelled (stock already returned): nothing to do.
  if not found or v_status = 'cancelled' then
    return null;
  end if;

  if tg_op = 'INSERT' then
    perform take_product_stock(new.product_id, new.quantity);
  elsif tg_op = 'UPDATE' then
    if new.quantity > old.quantity then
      perform take_product_stock(new.product_id, new.quantity - old.quantity);
    elsif new.quantity < old.quantity then
      perform give_back_product_stock(new.product_id, old.quantity - new.quantity);
    end if;
  elsif tg_op = 'DELETE' then
    perform give_back_product_stock(old.product_id, old.quantity);
  end if;

  return null;
end;
$$;

create trigger trg_sync_stock_on_order_item
  after insert or update of quantity or delete on order_items
  for each row execute function sync_stock_on_order_item();

-- orders: cancelling returns stock, reopening takes it again (never blocks
-- a reopen — it just floors at zero), deleting a live order returns it.

create or replace function sync_stock_on_order_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
begin
  if tg_op = 'DELETE' then
    if old.status <> 'cancelled' then
      for v_item in select product_id, quantity from order_items where order_id = old.id loop
        perform give_back_product_stock(v_item.product_id, v_item.quantity);
      end loop;
    end if;
    return old;
  end if;

  if new.status = old.status then
    return new;
  end if;

  if new.status = 'cancelled' then
    for v_item in select product_id, quantity from order_items where order_id = new.id loop
      perform give_back_product_stock(v_item.product_id, v_item.quantity);
    end loop;
  elsif old.status = 'cancelled' then
    for v_item in select product_id, quantity from order_items where order_id = new.id loop
      update products
      set stock_quantity = greatest(coalesce(stock_quantity, 0) - v_item.quantity, 0)
      where id = v_item.product_id and stock_control_enabled;
    end loop;
  end if;

  return new;
end;
$$;

create trigger trg_sync_stock_on_order_status
  after update of status on orders
  for each row execute function sync_stock_on_order_status();

create trigger trg_sync_stock_on_order_delete
  before delete on orders
  for each row execute function sync_stock_on_order_status();

-- Empty-order cleanup --------------------------------------------------------
-- Checkout inserts the order, then its items. If the items fail (product
-- deleted/deactivated, out of stock) the order would linger with no items.
-- Anonymous callers may only remove a *fresh, itemless* order.

create or replace function discard_empty_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from orders o
  where o.id = p_order_id
    and o.created_at > now() - interval '15 minutes'
    and not exists (select 1 from order_items i where i.order_id = o.id);
end;
$$;

grant execute on function discard_empty_order(uuid) to anon, authenticated;

-- Owner edits an order in one transaction ------------------------------------
-- p_items: [{ "id": uuid|null, "product_id": uuid, "quantity": int }]
-- Existing items missing from p_items are removed; new products are priced
-- at today's price by the existing snapshot trigger; stock follows via the
-- triggers above (an out-of-stock increase aborts the whole edit).

create or replace function admin_update_order(
  p_order_id uuid,
  p_items jsonb,
  p_payment payment_method,
  p_address jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_item jsonb;
  v_keep uuid[] := '{}';
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found or not is_store_owner(v_order.store_id) then
    raise exception 'Pedido não encontrado';
  end if;

  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'O pedido precisa ter ao menos um item';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    if (v_item->>'id') is not null then
      v_keep := v_keep || (v_item->>'id')::uuid;
    end if;
  end loop;

  delete from order_items
  where order_id = p_order_id and not (id = any (v_keep));

  for v_item in select * from jsonb_array_elements(p_items) loop
    if (v_item->>'quantity')::int <= 0 then
      raise exception 'Quantidade inválida';
    end if;

    if (v_item->>'id') is not null then
      update order_items
      set quantity = (v_item->>'quantity')::int
      where id = (v_item->>'id')::uuid
        and order_id = p_order_id
        and quantity <> (v_item->>'quantity')::int;
    else
      insert into order_items (order_id, product_id, quantity)
      values (p_order_id, (v_item->>'product_id')::uuid, (v_item->>'quantity')::int);
    end if;
  end loop;

  update orders
  set payment_preference = p_payment,
      delivery_address = case
        when fulfillment_type = 'delivery' and p_address is not null then p_address
        else delivery_address
      end,
      -- A coupon can't discount more than the edited order is worth.
      discount_cents = least(discount_cents, subtotal_cents + delivery_fee_cents),
      total_cents = subtotal_cents + delivery_fee_cents
        - least(discount_cents, subtotal_cents + delivery_fee_cents)
  where id = p_order_id;

  update payments
  set method = p_payment
  where order_id = p_order_id and status = 'pending';
end;
$$;

grant execute on function admin_update_order(uuid, jsonb, payment_method, jsonb) to authenticated;
