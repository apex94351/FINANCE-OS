-- Optional company context: personal documents remain available before company setup.

alter table public.companies
  add column if not exists trade_name text,
  add column if not exists legal_form text,
  add column if not exists siren text,
  add column if not exists address_complement text;

alter table public.documents
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

update public.documents
set user_id = uploaded_by
where user_id is null;

alter table public.documents
  alter column company_id drop not null,
  alter column user_id set not null;

create index if not exists documents_user_created_idx on public.documents (user_id, created_at desc);
create index if not exists documents_user_company_idx on public.documents (user_id, company_id);

-- Replace the member-only document policy with strict user/tenant isolation.
drop policy if exists "members access documents" on public.documents;
create policy "users access own documents"
  on public.documents for all
  using (user_id = auth.uid() or (company_id is not null and public.is_company_member(company_id)))
  with check (user_id = auth.uid() and (company_id is null or public.is_company_member(company_id)));

-- Companies are created through the security-definer RPC, then editable by members.
drop policy if exists "members update companies" on public.companies;
create policy "members update companies"
  on public.companies for update
  using (public.is_company_member(id))
  with check (public.is_company_member(id));

-- Keep the bucket private and support both personal paths and legacy company paths.
drop policy if exists "members read documents storage" on storage.objects;
drop policy if exists "members upload documents storage" on storage.objects;
drop policy if exists "members delete documents storage" on storage.objects;

create policy "users read documents storage"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and ((storage.foldername(name))[1] = auth.uid()::text
      or public.is_company_member((storage.foldername(name))[1]::uuid))
  );

create policy "users upload documents storage"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and ((storage.foldername(name))[1] = auth.uid()::text
      or public.is_company_member((storage.foldername(name))[1]::uuid))
  );

create policy "users delete documents storage"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and ((storage.foldername(name))[1] = auth.uid()::text
      or public.is_company_member((storage.foldername(name))[1]::uuid))
  );
