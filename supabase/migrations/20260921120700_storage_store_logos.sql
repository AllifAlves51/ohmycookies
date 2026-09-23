-- Public bucket for store logos. Objects are stored under
-- "<store_id>/<filename>" — that first path segment is what the policies
-- below check ownership against.
insert into storage.buckets (id, name, public)
values ('store-logos', 'store-logos', true)
on conflict (id) do nothing;

create policy "Public can view store logos"
  on storage.objects for select
  to public
  using (bucket_id = 'store-logos');

create policy "Owners can upload their own store logo"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'store-logos'
    and is_store_owner((storage.foldername(name))[1]::uuid)
  );

create policy "Owners can update their own store logo"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'store-logos'
    and is_store_owner((storage.foldername(name))[1]::uuid)
  )
  with check (
    bucket_id = 'store-logos'
    and is_store_owner((storage.foldername(name))[1]::uuid)
  );

create policy "Owners can delete their own store logo"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'store-logos'
    and is_store_owner((storage.foldername(name))[1]::uuid)
  );
