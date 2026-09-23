-- The public checkout needs to "find or create" a customer by
-- (store_id, whatsapp) without ever granting the anonymous role a general
-- UPDATE on customers — that would let anyone overwrite another customer's
-- name/address just by knowing (or guessing) their WhatsApp number.
-- This security-definer function is the only sanctioned way to do that
-- upsert; RLS on customers otherwise stays insert-only for the public role.

create or replace function checkout_upsert_customer(
  p_store_id uuid,
  p_name text,
  p_whatsapp text,
  p_address jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
begin
  insert into customers (store_id, name, whatsapp, address)
  values (p_store_id, p_name, p_whatsapp, p_address)
  on conflict (store_id, whatsapp) do update
    set name = excluded.name,
        address = coalesce(excluded.address, customers.address)
  returning id into v_customer_id;

  return v_customer_id;
end;
$$;
