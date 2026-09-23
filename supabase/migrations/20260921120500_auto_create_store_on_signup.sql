-- Every new auth.users row automatically gets exactly one store (enforced
-- by stores.owner_id being unique) plus its store_settings row. The store
-- name can be passed at signup as `data: { store_name: "..." }`; otherwise
-- it falls back to the part of the email before the @, and can be renamed
-- later from Configurações.

create or replace function generate_unique_store_slug(p_base text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base_slug text;
  v_candidate text;
  v_suffix integer := 0;
begin
  v_base_slug := lower(regexp_replace(coalesce(nullif(trim(p_base), ''), 'loja'), '[^a-zA-Z0-9]+', '-', 'g'));
  v_base_slug := trim(both '-' from v_base_slug);

  if v_base_slug = '' then
    v_base_slug := 'loja';
  end if;

  v_candidate := v_base_slug;

  while exists (select 1 from stores where slug = v_candidate) loop
    v_suffix := v_suffix + 1;
    v_candidate := v_base_slug || '-' || v_suffix;
  end loop;

  return v_candidate;
end;
$$;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid;
  v_base_name text;
  v_slug text;
begin
  v_base_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'store_name'), ''),
    split_part(new.email, '@', 1)
  );
  v_slug := generate_unique_store_slug(v_base_name);

  insert into stores (owner_id, name, slug)
  values (new.id, v_base_name, v_slug)
  returning id into v_store_id;

  insert into store_settings (store_id)
  values (v_store_id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
