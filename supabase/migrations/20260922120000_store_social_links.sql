-- Optional social links shown as icons on the public cardápio header.
alter table stores
  add column instagram_url text,
  add column facebook_url text,
  add column website_url text;
