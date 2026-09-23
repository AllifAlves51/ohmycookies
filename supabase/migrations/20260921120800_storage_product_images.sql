-- Public bucket for product photos. Objects are stored under
-- "<store_id>/<product_id>/<filename>" — the first path segment is what
-- the policies below check ownership against (same convention as
-- store-logos).
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Public can view product images"
  on storage.objects for select
  to public
  using (bucket_id = 'product-images');

create policy "Owners can upload their own product images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and is_store_owner((storage.foldername(name))[1]::uuid)
  );

create policy "Owners can update their own product images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and is_store_owner((storage.foldername(name))[1]::uuid)
  )
  with check (
    bucket_id = 'product-images'
    and is_store_owner((storage.foldername(name))[1]::uuid)
  );

create policy "Owners can delete their own product images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and is_store_owner((storage.foldername(name))[1]::uuid)
  );
