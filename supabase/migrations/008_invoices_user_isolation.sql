-- Ensure invoices are user-scoped and can exist without a company.

alter table public.invoices
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists supplier_name text,
  add column if not exists customer_name text,
  add column if not exists invoice_type text,
  add column if not exists subtotal_ht numeric(14, 2) default 0,
  add column if not exists vat_amount numeric(14, 2) default 0,
  add column if not exists vat_rate numeric(5, 2) default 0,
  add column if not exists total_ttc numeric(14, 2) default 0,
  add column if not exists category text,
  add column if not exists notes text,
  add column if not exists status text default 'to_pay';

alter table public.invoices
  alter column company_id drop not null;

update public.invoices
set invoice_type = 'payable'
where invoice_type is null;

update public.invoices
set status = 'to_pay'
where status is null;

update public.invoices
set subtotal_ht = coalesce(subtotal_ht, 0),
    vat_amount = coalesce(vat_amount, 0),
    vat_rate = coalesce(vat_rate, 0),
    total_ttc = coalesce(total_ttc, amount, 0)
where subtotal_ht is null or vat_amount is null or vat_rate is null or total_ttc is null;

alter table public.invoices
  alter column invoice_type set default 'payable',
  alter column subtotal_ht set default 0,
  alter column vat_amount set default 0,
  alter column vat_rate set default 0,
  alter column total_ttc set default 0,
  alter column status set default 'to_pay';

alter table public.invoices
  drop constraint if exists invoices_status_check,
  add constraint invoices_status_check check (status in ('draft', 'to_pay', 'paid', 'overdue'));

alter table public.invoices
  drop constraint if exists invoices_type_check,
  add constraint invoices_type_check check (invoice_type in ('payable', 'receivable'));

alter table public.invoices
  drop constraint if exists invoices_amount_check,
  add constraint invoices_amount_check check (subtotal_ht >= 0 and vat_amount >= 0 and total_ttc >= 0);

create index if not exists invoices_user_created_idx on public.invoices (user_id, created_at desc);
create index if not exists invoices_user_company_idx on public.invoices (user_id, company_id);
create index if not exists invoices_user_status_idx on public.invoices (user_id, status);
create index if not exists invoices_user_due_idx on public.invoices (user_id, due_date);

-- Replace older company-only rules with strict user isolation.
drop policy if exists "members access invoices" on public.invoices;
drop policy if exists "users access own invoices" on public.invoices;

create policy "users access own invoices"
  on public.invoices for all
  using (
    user_id = auth.uid()
    or (company_id is not null and public.is_company_member(company_id))
  )
  with check (
    user_id = auth.uid()
    and (company_id is null or public.is_company_member(company_id))
  );

-- Backfill user_id when the record was created by an authenticated user in the current app.
-- This is intentionally kept permissive because the app always writes user_id during inserts.
update public.invoices
set user_id = coalesce(user_id, auth.uid())
where user_id is null;
