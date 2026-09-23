-- Lets the checkout confirmation screen show the store-assigned order
-- number without granting the public role a general SELECT on orders
-- (which stays private). Only ever answers an integer, so it can't leak
-- any other order data — same minimal-exposure pattern as order_exists().
create or replace function get_order_number(p_order_id uuid)
returns integer
language sql
security definer
stable
set search_path = public
as $$
  select order_number from orders where id = p_order_id;
$$;
