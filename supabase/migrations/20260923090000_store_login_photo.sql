-- Photo shown on the shared public login/cadastro screens (not the
-- per-store cardápio). There is no platform-admin role in V1, so any
-- store owner can set it from their own Configurações page; the
-- unauthenticated login page reads it back via the existing public
-- "stores" read policy, picking the oldest store that has one set.
alter table stores
  add column login_photo_url text;
