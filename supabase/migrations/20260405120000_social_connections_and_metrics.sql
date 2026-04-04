create table if not exists public.social_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  platform text not null
    check (platform in ('instagram', 'linkedin', 'x', 'facebook')),
  account_name text,
  account_id text,
  account_avatar text,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[],
  is_active boolean not null default true,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, platform)
);

create table if not exists public.post_metrics (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  platform text not null
    check (platform in ('instagram', 'linkedin', 'x', 'facebook')),
  external_post_id text,
  impressions int,
  reach int,
  likes int,
  comments int,
  shares int,
  saves int,
  clicks int,
  video_views int,
  engagement_rate double precision,
  reactions int,
  top_metric text,
  performance_score double precision,
  synced_at timestamptz not null default now(),
  metric_date date not null default current_date
);

create unique index if not exists idx_post_metrics_post_date_unique
  on public.post_metrics(post_id, metric_date);

create index if not exists idx_post_metrics_workspace
  on public.post_metrics(workspace_id);

create index if not exists idx_post_metrics_post
  on public.post_metrics(post_id);

create index if not exists idx_post_metrics_platform
  on public.post_metrics(workspace_id, platform);

create index if not exists idx_social_connections_workspace
  on public.social_connections(workspace_id);

create index if not exists idx_social_connections_workspace_platform
  on public.social_connections(workspace_id, platform);

alter table public.social_connections enable row level security;
alter table public.post_metrics enable row level security;

drop policy if exists "Members can manage social connections" on public.social_connections;
create policy "Members can manage social connections"
  on public.social_connections for all
  using (public.is_active_workspace_member(workspace_id))
  with check (public.is_active_workspace_member(workspace_id));

drop policy if exists "Members can manage post metrics" on public.post_metrics;
create policy "Members can manage post metrics"
  on public.post_metrics for all
  using (public.is_active_workspace_member(workspace_id))
  with check (public.is_active_workspace_member(workspace_id));

drop trigger if exists set_social_connections_updated_at on public.social_connections;
create trigger set_social_connections_updated_at
  before update on public.social_connections
  for each row execute procedure public.set_updated_at();
