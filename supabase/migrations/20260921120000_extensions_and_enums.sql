-- Extensions
create extension if not exists pgcrypto;

-- Enums
create type order_status as enum (
  'new',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'completed',
  'cancelled'
);

create type fulfillment_type as enum (
  'delivery',
  'pickup'
);

create type payment_method as enum (
  'cash',
  'pix',
  'card'
);

create type payment_status as enum (
  'pending',
  'paid'
);
