-- Per-item special instructions ("Alguma observação?" on the product
-- detail sheet) — separate from orders.notes, which is the owner's
-- internal note about the whole order.
alter table order_items
  add column notes text;
