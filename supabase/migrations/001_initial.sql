create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  country text,
  currency text not null default 'EUR',
  address text,
  phone text,
  email text,
  registration_number text,
  vat_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.company_role as enum ('owner', 'admin', 'member', 'viewer', 'accountant');

create table public.company_members (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.company_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

create or replace function public.is_company_member(target_company_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.company_members
    where company_id = target_company_id and user_id = auth.uid()
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'first_name', ''), coalesce(new.raw_user_meta_data ->> 'last_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id),
  storage_path text not null,
  name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  invoice_number text not null,
  counterparty_name text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  currency text not null default 'EUR',
  issue_date date,
  due_date date,
  status text not null default 'draft' check (status in ('draft', 'pending', 'paid', 'overdue', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (like public.companies including defaults, including constraints);
alter table public.customers add column company_id uuid references public.companies(id) on delete cascade;
alter table public.customers add column contact_email text;
alter table public.customers add column contact_phone text;

create table public.suppliers (like public.companies including defaults, including constraints);
alter table public.suppliers add column company_id uuid references public.companies(id) on delete cascade;
alter table public.suppliers add column contact_email text;
alter table public.suppliers add column contact_phone text;

create table public.expenses (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  description text not null, amount numeric(14, 2) not null check (amount >= 0), currency text not null default 'EUR', expense_date date, created_at timestamptz not null default now()
);
create table public.revenues (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  description text not null, amount numeric(14, 2) not null check (amount >= 0), currency text not null default 'EUR', revenue_date date, created_at timestamptz not null default now()
);
create table public.deadlines (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  title text not null, due_date date not null, completed boolean not null default false, created_at timestamptz not null default now()
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade, title text not null, body text not null, read_at timestamptz, created_at timestamptz not null default now()
);
create table public.ai_analyses (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null, provider text, status text not null default 'pending', result jsonb, created_at timestamptz not null default now()
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null, action text not null, entity_type text not null, entity_id uuid, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.documents enable row level security;
alter table public.invoices enable row level security;
alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.expenses enable row level security;
alter table public.revenues enable row level security;
alter table public.deadlines enable row level security;
alter table public.notifications enable row level security;
alter table public.ai_analyses enable row level security;
alter table public.audit_logs enable row level security;

create policy "users manage own profile" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "members read companies" on public.companies for select using (public.is_company_member(id));
create policy "users read memberships" on public.company_members for select using (user_id = auth.uid() or public.is_company_member(company_id));

do $$
declare table_name text;
begin
  foreach table_name in array array['documents','invoices','customers','suppliers','expenses','revenues','deadlines','notifications','ai_analyses','audit_logs'] loop
    execute format('create policy "members access %1$s" on public.%1$s for all using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));', table_name);
  end loop;
end $$;

insert into storage.buckets (id, name, public) values ('documents', 'documents', false) on conflict (id) do update set public = false;
create policy "members read documents storage" on storage.objects for select using (bucket_id = 'documents' and public.is_company_member((storage.foldername(name))[1]::uuid));
create policy "members upload documents storage" on storage.objects for insert with check (bucket_id = 'documents' and public.is_company_member((storage.foldername(name))[1]::uuid));
create policy "members delete documents storage" on storage.objects for delete using (bucket_id = 'documents' and public.is_company_member((storage.foldername(name))[1]::uuid));