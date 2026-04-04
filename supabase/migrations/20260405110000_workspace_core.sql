create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  owner_id uuid references auth.users(id) on delete set null,
  status text not null default 'active'
    check (status in ('active', 'suspended', 'cancelled')),
  plan text not null default 'free'
    check (plan in ('free', 'starter', 'pro', 'agency')),
  plan_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member'
    check (role in ('owner', 'admin', 'member', 'viewer')),
  invited_by uuid references auth.users(id),
  joined_at timestamptz default now(),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index if not exists idx_workspace_members_workspace
  on public.workspace_members(workspace_id);

create index if not exists idx_workspace_members_user
  on public.workspace_members(user_id);

create index if not exists idx_workspaces_owner
  on public.workspaces(owner_id);

create index if not exists idx_workspaces_slug
  on public.workspaces(slug);

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists current_workspace_id uuid references public.workspaces(id),
  add column if not exists noctra_role text not null default 'user'
    check (noctra_role in ('user', 'noctra_admin'));

create table if not exists public.workspace_config (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  brand_name text,
  logo_url text,
  logo_storage_path text,
  primary_color text default '#101417',
  secondary_color text default '#212631',
  brand_description text,
  tone_of_voice text default 'professional',
  brand_values text[],
  forbidden_words text[],
  reference_posts text[],
  assistance_level text default 'balanced'
    check (assistance_level in ('minimal', 'balanced', 'full')),
  preferred_emojis boolean default true,
  use_hashtags boolean default true,
  hashtag_style text default 'curated'
    check (hashtag_style in ('none', 'minimal', 'curated', 'aggressive')),
  text_length_pref text default 'medium'
    check (text_length_pref in ('short', 'medium', 'long', 'varies')),
  always_include_cta boolean default true,
  cta_style text,
  industry text,
  target_audience text,
  main_goal text
    check (main_goal in ('brand_awareness', 'lead_generation', 'community', 'sales', 'thought_leadership', 'mixed')),
  posting_frequency jsonb default '{"instagram": 4, "linkedin": 2, "x": 5}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  platform text
    check (platform in ('instagram', 'linkedin', 'x', 'facebook', 'all')),
  insight_type text not null
    check (insight_type in ('topic', 'format', 'tone', 'timing', 'hashtag', 'cta', 'length', 'general')),
  summary text not null,
  confidence double precision default 0.5,
  data_points int default 0,
  is_active boolean default true,
  generated_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists idx_ai_insights_workspace
  on public.ai_insights(workspace_id);

create index if not exists idx_ai_insights_active
  on public.ai_insights(workspace_id, is_active);

create or replace function public.generate_workspace_slug(base_name text, seed uuid)
returns text
language plpgsql
immutable
as $$
declare
  normalized text;
begin
  normalized := lower(trim(coalesce(base_name, 'workspace')));
  normalized := regexp_replace(normalized, '[^a-z0-9]+', '-', 'g');
  normalized := trim(both '-' from normalized);

  if normalized = '' then
    normalized := 'workspace';
  end if;

  return normalized || '-' || left(seed::text, 8);
end;
$$;

create or replace function public.current_workspace_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select current_workspace_id
  from public.profiles
  where id = auth.uid()
$$;

do $$
begin
  if exists (
    select 1
    from pg_proc
    where proname = 'set_updated_at'
      and pronamespace = 'public'::regnamespace
  ) then
    drop trigger if exists set_workspaces_updated_at on public.workspaces;
    create trigger set_workspaces_updated_at
      before update on public.workspaces
      for each row execute procedure public.set_updated_at();

    drop trigger if exists set_workspace_config_updated_at on public.workspace_config;
    create trigger set_workspace_config_updated_at
      before update on public.workspace_config
      for each row execute procedure public.set_updated_at();
  end if;
end $$;
