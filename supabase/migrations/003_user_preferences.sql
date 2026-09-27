create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  language text not null default 'fr',
  theme text not null default 'system',
  density text not null default 'comfortable',
  sidebar_compact boolean not null default false,
  reduce_motion boolean not null default false,
  notifications jsonb not null default '{"deadlines":true,"overdue_invoices":true,"ai_analysis":true,"general":true}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint preferences_language_check check (language in ('fr', 'en', 'es', 'pt', 'it', 'de', 'zh')),
  constraint preferences_theme_check check (theme in ('light', 'dark', 'system')),
  constraint preferences_density_check check (density in ('comfortable', 'compact'))
);
alter table public.user_preferences enable row level security;
create policy "users manage own preferences" on public.user_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());