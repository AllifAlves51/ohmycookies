-- One-off data seed for the real "Oh My Cookies" menu — not a schema
-- migration, run this once in the SQL Editor. Safe to inspect before
-- running; it only touches the store found by slug 'cookies-teste'.
do $$
declare
  v_store_id uuid;
begin
  select id into v_store_id from stores where slug = 'cookies-teste';

  if v_store_id is null then
    raise exception 'Loja com slug cookies-teste não encontrada';
  end if;

  -- Store profile: brand name, WhatsApp and Instagram from the real menu.
  update stores
  set name = 'Oh My Cookies',
      whatsapp_number = '66992745783',
      instagram_url = 'https://instagram.com/ohmycookiesprimavera'
  where id = v_store_id;

  -- Retire the placeholder test product used during development.
  update products
  set active = false
  where store_id = v_store_id and name = 'Cookie Chocolate Belga';

  insert into products (store_id, name, description, price_cents, position, active)
  values
    (v_store_id, 'Oh My Clássico',
     'Massa amanteigada clássica, gotas de chocolate nobre ao leite e meio amargo.',
     1690, 1, true),
    (v_store_id, 'Oh My Dark Chocolate',
     'Massa amanteigada de cacau black, gotas de chocolate nobre ao leite.',
     1690, 2, true),
    (v_store_id, 'Oh My Nutella',
     'Massa amanteigada clássica, gotas de chocolate nobre ao leite e recheio de Nutella.',
     2190, 3, true),
    (v_store_id, 'Oh My Ninhotella',
     'Massa amanteigada clássica, gotas de chocolate nobre meio amargo e recheio creme de Ninho e Nutella.',
     2190, 4, true),
    (v_store_id, 'Oh My Red Velvet',
     'Massa amanteigada red velvet, gotas de chocolate nobre branco, recheio de brigadeiro de cream cheese e geleia de morango.',
     2390, 5, true),
    (v_store_id, 'Oh My Pistachio',
     'Massa amanteigada clássica, gotas de chocolate nobre branco, pedaços de pistaches e recheio creme de pistache.',
     2390, 6, true),
    (v_store_id, 'Oh My Kinder Bueno',
     'Massa amanteigada clássica, gotas de chocolate nobre branco e ao leite, recheio de creme Kinder e um pedaço de Kinder bueno.',
     2390, 7, true),
    (v_store_id, 'Oh My B-day',
     'Massa amanteigada clássica, gotas de chocolate nobre branco, recheio de brigadeiro de chocolate ao leite, decorado com confeitos coloridos, acompanha velinha, caixinha de presente e card com frase de aniversário.',
     2690, 8, true);
end $$;
