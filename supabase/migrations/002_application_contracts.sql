alter table public.documents add column if not exists file_name text;
alter table public.documents add column if not exists file_type text;
alter table public.documents add column if not exists file_size bigint;
alter table public.documents add column if not exists document_type text not null default 'other';
alter table public.documents add column if not exists status text not null default 'uploaded';
alter table public.documents add column if not exists updated_at timestamptz not null default now();
update public.documents set file_name = name, file_type = mime_type, file_size = size_bytes where file_name is null;
alter table public.documents alter column file_name set not null;
alter table public.documents alter column file_type set not null;
alter table public.documents alter column file_size set not null;
alter table public.documents add constraint documents_status_check check (status in ('uploaded', 'processing', 'analyzed', 'error'));
alter table public.documents add constraint documents_type_check check (document_type in ('invoice', 'contract', 'receipt', 'statement', 'other'));

alter table public.invoices add column if not exists supplier_id uuid references public.suppliers(id) on delete set null;
alter table public.invoices add column if not exists customer_id uuid references public.customers(id) on delete set null;
alter table public.invoices add column if not exists subtotal numeric(14, 2);
alter table public.invoices add column if not exists tax_amount numeric(14, 2);
alter table public.invoices add column if not exists total_amount numeric(14, 2);
alter table public.invoices add column if not exists category text;
alter table public.invoices add column if not exists iban text;
alter table public.invoices add column if not exists payment_terms text;
alter table public.invoices add column if not exists ai_summary text;
update public.invoices set total_amount = amount where total_amount is null;

alter table public.expenses add column if not exists category text not null default 'Autres';
alter table public.expenses add column if not exists supplier_id uuid references public.suppliers(id) on delete set null;
alter table public.expenses add column if not exists document_id uuid references public.documents(id) on delete set null;
alter table public.deadlines add column if not exists amount numeric(14, 2);
alter table public.deadlines add column if not exists deadline_type text not null default 'other';
alter table public.deadlines add column if not exists source text;

create or replace function public.create_company(company_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare new_company_id uuid;
begin
  if auth.uid() is null or length(trim(company_name)) < 2 then
    raise exception 'invalid_company_name';
  end if;
  insert into public.companies (name) values (trim(company_name)) returning id into new_company_id;
  insert into public.company_members (company_id, user_id, role) values (new_company_id, auth.uid(), 'owner');
  return new_company_id;
end;
$$;
revoke all on function public.create_company(text) from public;
grant execute on function public.create_company(text) to authenticated;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;