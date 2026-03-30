alter table public.profiles
add column if not exists social_handles jsonb not null default '{}'::jsonb;
