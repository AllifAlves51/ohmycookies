-- Read-only diagnostic — does not change any data.
select
  s.id as store_id,
  s.name,
  s.slug,
  s.owner_id,
  (select count(*) from products p where p.store_id = s.id) as product_count,
  (select count(*) from orders o where o.store_id = s.id) as order_count
from stores s
order by s.created_at;
