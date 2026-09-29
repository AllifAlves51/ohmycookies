-- Customers could place orders while the store was closed: the menu only
-- *showed* "Fechado". Anonymous checkout inserts straight into orders
-- (RLS allows it), so the rule lives here too. The store owner is exempt,
-- so manual orders can still be entered at any time.

create or replace function store_is_open_now(p_store_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_hours jsonb;
  v_local timestamp;
  v_day jsonb;
  v_now integer;
  v_from integer;
  v_to integer;
begin
  select opening_hours into v_hours from stores where id = p_store_id;
  -- Same rule as the app: no hours configured = closed.
  if v_hours is null then
    return false;
  end if;

  -- Every current store is in Mato Grosso (the app uses the same zone).
  v_local := now() at time zone 'America/Cuiaba';
  v_day := v_hours -> (array['sun','mon','tue','wed','thu','fri','sat'])[extract(dow from v_local)::int + 1];

  if v_day is null or not coalesce((v_day ->> 'open')::boolean, false) then
    return false;
  end if;

  v_now := extract(hour from v_local)::int * 60 + extract(minute from v_local)::int;
  v_from := split_part(v_day ->> 'from', ':', 1)::int * 60 + split_part(v_day ->> 'from', ':', 2)::int;
  v_to := split_part(v_day ->> 'to', ':', 1)::int * 60 + split_part(v_day ->> 'to', ':', 2)::int;

  return v_now >= v_from and v_now < v_to;
end;
$$;

create or replace function block_orders_when_closed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_store_owner(new.store_id) and not store_is_open_now(new.store_id) then
    raise exception 'Loja fechada: pedidos só são aceitos no horário de funcionamento'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger trg_block_orders_when_closed
  before insert on orders
  for each row execute function block_orders_when_closed();
