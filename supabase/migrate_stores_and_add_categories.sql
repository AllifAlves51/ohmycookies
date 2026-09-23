-- Consolidates the two stores found by the diagnostic query into the one
-- you actually log into (the "oh-my-cookies" signup), then adds the menu
-- categories missing from the seed. Irreversible (it deletes the old,
-- now-empty dev/test store row) — read it once before running.
--
-- IMPORTANT: after this runs, the public cardápio link becomes
--   /cardapio/oh-my-cookies
-- (the old /cardapio/cookies-teste link stops working, since that store
-- row is deleted).

do $$
declare
  v_old_store_id uuid := '42c8761b-4b73-49c8-9783-85647a1d1837'; -- cookies-teste (dev/test)
  v_new_store_id uuid := 'aa2a1fcd-2737-43e8-8525-3af3888b6713'; -- oh-my-cookies (real login)
  v_cat_classicos uuid;
  v_cat_recheados uuid;
  v_cat_especiais uuid;
begin
  -- Carry the business profile (WhatsApp, Instagram, address, hours, logo)
  -- from the old store into the new one, without touching the new store's
  -- own id/owner/slug/name.
  update stores new_s
  set whatsapp_number = old_s.whatsapp_number,
      logo_url = coalesce(new_s.logo_url, old_s.logo_url),
      address = coalesce(new_s.address, old_s.address),
      opening_hours = coalesce(new_s.opening_hours, old_s.opening_hours),
      instagram_url = old_s.instagram_url,
      facebook_url = old_s.facebook_url,
      website_url = old_s.website_url
  from stores old_s
  where new_s.id = v_new_store_id
    and old_s.id = v_old_store_id;

  -- Re-point every child row from the old store to the new one.
  update products set store_id = v_new_store_id where store_id = v_old_store_id;
  update categories set store_id = v_new_store_id where store_id = v_old_store_id;
  update customers set store_id = v_new_store_id where store_id = v_old_store_id;
  update delivery_zones set store_id = v_new_store_id where store_id = v_old_store_id;
  update orders set store_id = v_new_store_id where store_id = v_old_store_id;

  -- store_settings is 1:1 (unique store_id): drop the new store's
  -- auto-created default row, then re-point the old store's configured one.
  delete from store_settings where store_id = v_new_store_id;
  update store_settings set store_id = v_new_store_id where store_id = v_old_store_id;

  -- Carry the order-number sequence counter so future orders keep
  -- counting up from where the old store left off.
  delete from store_order_sequences where store_id = v_new_store_id;
  update store_order_sequences set store_id = v_new_store_id where store_id = v_old_store_id;

  -- The old dev/test store is now empty — remove it.
  delete from stores where id = v_old_store_id;

  -- Menu categories (missing from the earlier data seed).
  insert into categories (store_id, name, position)
  values (v_new_store_id, 'Clássicos', 1)
  returning id into v_cat_classicos;

  insert into categories (store_id, name, position)
  values (v_new_store_id, 'Recheados', 2)
  returning id into v_cat_recheados;

  insert into categories (store_id, name, position)
  values (v_new_store_id, 'Especiais', 3)
  returning id into v_cat_especiais;

  update products set category_id = v_cat_classicos
  where store_id = v_new_store_id
    and name in ('Oh My Clássico', 'Oh My Dark Chocolate');

  update products set category_id = v_cat_recheados
  where store_id = v_new_store_id
    and name in ('Oh My Nutella', 'Oh My Ninhotella', 'Oh My Red Velvet', 'Oh My Pistachio', 'Oh My Kinder Bueno');

  update products set category_id = v_cat_especiais
  where store_id = v_new_store_id
    and name = 'Oh My B-day';
end $$;
