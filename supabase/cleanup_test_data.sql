-- Wipes test orders/customers before launch. Scoped to the real store by
-- slug so it can never touch another store. Keeps products, categories,
-- delivery zones, coupons and store settings — only test activity is
-- removed. Run once, right before going live.

do $$
declare
  v_store_id uuid;
begin
  select id into v_store_id from stores where slug = 'oh-my-cookies';

  if v_store_id is null then
    raise exception 'Loja oh-my-cookies não encontrada — nada foi apagado';
  end if;

  -- order_items cascade automatically when their order is deleted.
  delete from orders where store_id = v_store_id;
  delete from customers where store_id = v_store_id;

  -- Coupons stay configured, just reset their usage counter.
  update coupons set usage_count = 0 where store_id = v_store_id;
end $$;

-- Confirms the cleanup: both counts below should read 0.
select
  (select count(*) from orders o join stores s on s.id = o.store_id where s.slug = 'oh-my-cookies') as remaining_orders,
  (select count(*) from customers c join stores s on s.id = c.store_id where s.slug = 'oh-my-cookies') as remaining_customers;
