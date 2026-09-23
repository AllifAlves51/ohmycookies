-- Enables Supabase Realtime (postgres_changes) on orders so the admin
-- Kanban board updates live as status changes and new orders come in.
alter publication supabase_realtime add table orders;
