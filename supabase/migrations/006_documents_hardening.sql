-- Documents: private storage and tenant-safe access guarantees.

alter table public.documents
  add column if not exists file_name text,
  add column if not exists file_type text,
  add column if not exists file_size bigint,
  add column if not exists document_type text not null default 'other',
  add column if not exists status text not null default 'uploaded',
  add column if not exists updated_at timestamptz not null default now();

update public.documents
set file_name = coalesce(file_name, name),
    file_type = coalesce(file_type, mime_type),
    file_size = coalesce(file_size, size_bytes)
where file_name is null or file_type is null or file_size is null;

alter table public.documents
  alter column file_name set not null,
  alter column file_type set not null,
  alter column file_size set not null;

create index if not exists documents_company_created_idx on public.documents (company_id, created_at desc);
create index if not exists documents_company_name_idx on public.documents (company_id, lower(name));

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do update set public = false;

 drop policy if exists "members read documents storage" on storage.objects;
 drop policy if exists "members upload documents storage" on storage.objects;
 drop policy if exists "members delete documents storage" on storage.objects;

create policy "members read documents storage"
  on storage.objects for select
  using (bucket_id = 'documents' and public.is_company_member((storage.foldername(name))[1]::uuid));

create policy "members upload documents storage"
  on storage.objects for insert
  with check (bucket_id = 'documents' and public.is_company_member((storage.foldername(name))[1]::uuid));

create policy "members delete documents storage"
  on storage.objects for delete
  using (bucket_id = 'documents' and public.is_company_member((storage.foldername(name))[1]::uuid));
