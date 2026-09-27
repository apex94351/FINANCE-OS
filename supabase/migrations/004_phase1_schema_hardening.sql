-- Phase 1: complete the shared contracts without rewriting applied migrations.

alter table public.profiles
  add column if not exists language text not null default 'fr',
  add column if not exists theme text not null default 'system',
  add column if not exists timezone text not null default 'Europe/Paris';

alter table public.profiles
  add constraint profiles_language_check check (language in ('fr', 'en', 'es', 'pt', 'it', 'de', 'zh')),
  add constraint profiles_theme_check check (theme in ('light', 'dark', 'system'));

alter table public.companies
  add column if not exists industry text;

alter table public.company_members
  add column if not exists id uuid default gen_random_uuid();

create unique index if not exists company_members_id_idx on public.company_members (id);

alter table public.documents
  drop constraint if exists documents_status_check,
  drop constraint if exists documents_type_check,
  add constraint documents_status_check check (status in ('uploaded', 'processing', 'analyzed', 'error')),
  add constraint documents_type_check check (document_type in ('invoice', 'contract', 'receipt', 'statement', 'tax_document', 'other'));

alter table public.invoices
  add column if not exists invoice_type text not null default 'payable',
  add column if not exists tax_rate numeric(5, 2),
  add column if not exists discount_amount numeric(14, 2),
  add column if not exists fees numeric(14, 2),
  add column if not exists notes text,
  add constraint invoices_type_check check (invoice_type in ('payable', 'receivable'));

alter table public.expenses
  add column if not exists updated_at timestamptz not null default now();

alter table public.deadlines
  add column if not exists status text not null default 'upcoming',
  add constraint deadlines_status_check check (status in ('upcoming', 'today', 'overdue', 'completed')),
  add constraint deadlines_type_check check (deadline_type in ('invoice', 'contract', 'subscription', 'tax', 'document', 'other'));

alter table public.notifications
  add column if not exists notification_type text not null default 'system',
  add constraint notifications_type_check check (notification_type in ('invoice_due', 'invoice_overdue', 'document_analyzed', 'system', 'financial_alert'));

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles for each row execute procedure public.touch_updated_at();
drop trigger if exists companies_touch_updated_at on public.companies;
create trigger companies_touch_updated_at before update on public.companies for each row execute procedure public.touch_updated_at();
drop trigger if exists documents_touch_updated_at on public.documents;
create trigger documents_touch_updated_at before update on public.documents for each row execute procedure public.touch_updated_at();
drop trigger if exists invoices_touch_updated_at on public.invoices;
create trigger invoices_touch_updated_at before update on public.invoices for each row execute procedure public.touch_updated_at();
drop trigger if exists expenses_touch_updated_at on public.expenses;
create trigger expenses_touch_updated_at before update on public.expenses for each row execute procedure public.touch_updated_at();
drop trigger if exists user_preferences_touch_updated_at on public.user_preferences;
create trigger user_preferences_touch_updated_at before update on public.user_preferences for each row execute procedure public.touch_updated_at();

revoke all on function public.is_company_member(uuid) from public;
grant execute on function public.is_company_member(uuid) to authenticated;
revoke all on function public.touch_updated_at() from public;

create index if not exists documents_company_created_idx on public.documents (company_id, created_at desc);
create index if not exists invoices_company_due_idx on public.invoices (company_id, due_date);
create index if not exists invoices_company_status_idx on public.invoices (company_id, status);
create index if not exists expenses_company_date_idx on public.expenses (company_id, expense_date desc);
create index if not exists deadlines_company_due_idx on public.deadlines (company_id, due_date);
create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);