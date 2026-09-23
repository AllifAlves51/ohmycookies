-- Postgres does not automatically index foreign key columns; add the ones
-- this app's query patterns actually rely on. `if not exists` makes this
-- file safe to re-run.

create index if not exists idx_store_settings_store_id on store_settings (store_id);

create index if not exists idx_categories_store_id on categories (store_id);

create index if not exists idx_products_store_id on products (store_id);
create index if not exists idx_products_category_id on products (category_id);
create index if not exists idx_products_store_active on products (store_id, active);

create index if not exists idx_customers_store_id on customers (store_id);

create index if not exists idx_delivery_zones_store_id on delivery_zones (store_id);
create index if not exists idx_delivery_zones_store_active on delivery_zones (store_id, active);

create index if not exists idx_orders_store_id on orders (store_id);
create index if not exists idx_orders_customer_id on orders (customer_id);
create index if not exists idx_orders_delivery_zone_id on orders (delivery_zone_id);
-- Kanban board: filter by store + status.
create index if not exists idx_orders_store_status on orders (store_id, status);
-- Dashboard/relatórios: recent orders, revenue over time.
create index if not exists idx_orders_store_created_at on orders (store_id, created_at desc);

create index if not exists idx_order_items_order_id on order_items (order_id);
create index if not exists idx_order_items_product_id on order_items (product_id);

create index if not exists idx_payments_order_id on payments (order_id);
