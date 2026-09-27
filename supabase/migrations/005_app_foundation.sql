-- Preferences for the shared application shell and settings foundation.
alter table public.user_preferences
  drop constraint if exists preferences_language_check,
  drop constraint if exists preferences_density_check,
  add column if not exists animation_mode text not null default 'enabled',
  add column if not exists dashboard_preferences jsonb not null default '{"visibleWidgets":[],"widgetOrder":[]}'::jsonb;

alter table public.user_preferences
  add constraint preferences_language_check check (language in ('fr', 'en', 'es', 'pt', 'it', 'de', 'zh', 'ja', 'ar')),
  add constraint preferences_density_check check (density in ('compact', 'standard', 'comfortable')),
  add constraint preferences_animation_check check (animation_mode in ('enabled', 'reduced', 'disabled'));

alter table public.companies
  add column if not exists city text,
  add column if not exists postal_code text,
  add column if not exists siret text;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "users manage own avatars" on storage.objects;
create policy "users manage own avatars" on storage.objects for all
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);