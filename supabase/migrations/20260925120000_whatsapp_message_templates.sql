-- Customizable WhatsApp messages (greeting, away, and one per order status).
-- Stored as { [key]: { enabled: boolean, text: string } }; keys missing from
-- the object fall back to the app's built-in defaults, so '{}' is valid.
alter table store_settings
  add column whatsapp_templates jsonb not null default '{}'::jsonb;
