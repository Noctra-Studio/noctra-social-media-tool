alter table public.workspace_config
  add column if not exists onboarding_completed boolean not null default false;
