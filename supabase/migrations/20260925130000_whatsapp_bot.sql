-- WhatsApp bot (Evolution API): per-store connection + bot settings, and a
-- per-contact log used to decide when to (re)send the greeting.

alter table store_settings
  -- Evolution API instance linked to this store; set when the owner
  -- connects, used by the webhook to find which store a message belongs to.
  add column whatsapp_instance text unique,
  add column whatsapp_greeting_interval_minutes integer not null default 90
    check (whatsapp_greeting_interval_minutes >= 0),
  -- Owner's number that receives "novo pedido" alerts (digits only).
  add column whatsapp_alert_number text,
  add column whatsapp_alerts_enabled boolean not null default true;

create table whatsapp_contacts (
  store_id uuid not null references stores (id) on delete cascade,
  phone text not null,
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  last_greeting_at timestamptz,
  primary key (store_id, phone)
);

-- Written only by the server with the service role key (webhook and order
-- notifications); owners can read their own rows.
alter table whatsapp_contacts enable row level security;

create policy "Owners read their store's WhatsApp contacts"
  on whatsapp_contacts for select
  to authenticated
  using (is_store_owner(store_id));
