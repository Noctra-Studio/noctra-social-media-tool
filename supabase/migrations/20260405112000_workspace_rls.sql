create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
  )
$$;

create or replace function public.is_noctra_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and noctra_role = 'noctra_admin'
  )
$$;

create or replace function public.is_active_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select (
    public.is_noctra_admin()
    or (
      public.current_workspace_id() = ws_id
      and public.is_workspace_member(ws_id)
    )
  )
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.profiles enable row level security;
alter table public.workspace_config enable row level security;
alter table public.brand_pillars enable row level security;
alter table public.platform_audiences enable row level security;
alter table public.posts enable row level security;
alter table public.ai_insights enable row level security;
alter table public.brand_voice enable row level security;
alter table public.content_ideas enable row level security;
alter table public.image_library enable row level security;
alter table public.post_feedback enable row level security;
alter table public.ai_learning_context enable row level security;
alter table public.exports enable row level security;
alter table public.image_briefs enable row level security;
alter table public.design_versions enable row level security;
alter table public.token_ledger enable row level security;

drop policy if exists "Users can read own ideas" on public.content_ideas;
drop policy if exists "Users can insert own ideas" on public.content_ideas;
drop policy if exists "Users can update own ideas" on public.content_ideas;
drop policy if exists "Users can delete own ideas" on public.content_ideas;
drop policy if exists "Users can read own posts" on public.posts;
drop policy if exists "Users can insert own posts" on public.posts;
drop policy if exists "Users can update own posts" on public.posts;
drop policy if exists "Users can read own feedback" on public.post_feedback;
drop policy if exists "Users can insert own feedback" on public.post_feedback;
drop policy if exists "Users can read own context" on public.ai_learning_context;
drop policy if exists "Users can insert own context" on public.ai_learning_context;
drop policy if exists "Users can read own images" on public.image_library;
drop policy if exists "Users can insert own images" on public.image_library;
drop policy if exists "Users can update own images" on public.image_library;
drop policy if exists "Users can read own brand voice" on public.brand_voice;
drop policy if exists "Users can insert own brand voice" on public.brand_voice;
drop policy if exists "Users can update own brand voice" on public.brand_voice;
drop policy if exists "Users can delete own brand voice" on public.brand_voice;
drop policy if exists "Users can read own brand pillars" on public.brand_pillars;
drop policy if exists "Users can insert own brand pillars" on public.brand_pillars;
drop policy if exists "Users can update own brand pillars" on public.brand_pillars;
drop policy if exists "Users can delete own brand pillars" on public.brand_pillars;
drop policy if exists "Users can read own platform audiences" on public.platform_audiences;
drop policy if exists "Users can insert own platform audiences" on public.platform_audiences;
drop policy if exists "Users can update own platform audiences" on public.platform_audiences;
drop policy if exists "Users can delete own platform audiences" on public.platform_audiences;
drop policy if exists "Users can read own exports" on public.exports;
drop policy if exists "Users can insert own exports" on public.exports;

drop policy if exists "Members can read their workspaces" on public.workspaces;
create policy "Members can read their workspaces"
  on public.workspaces for select
  using (public.is_workspace_member(id) or public.is_noctra_admin());

drop policy if exists "Owners can update their workspace" on public.workspaces;
create policy "Owners can update their workspace"
  on public.workspaces for update
  using (owner_id = auth.uid() or public.is_noctra_admin())
  with check (owner_id = auth.uid() or public.is_noctra_admin());

drop policy if exists "Members can see who's in their workspaces" on public.workspace_members;
create policy "Members can see who's in their workspaces"
  on public.workspace_members for select
  using (public.is_workspace_member(workspace_id) or public.is_noctra_admin());

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  using (id = auth.uid() or public.is_noctra_admin());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "Members can read workspace config" on public.workspace_config;
create policy "Members can read workspace config"
  on public.workspace_config for select
  using (public.is_workspace_member(workspace_id) or public.is_noctra_admin());

drop policy if exists "Members can update workspace config" on public.workspace_config;
create policy "Members can update workspace config"
  on public.workspace_config for update
  using (public.is_workspace_member(workspace_id) or public.is_noctra_admin())
  with check (public.is_workspace_member(workspace_id) or public.is_noctra_admin());

drop policy if exists "Members can insert workspace config" on public.workspace_config;
create policy "Members can insert workspace config"
  on public.workspace_config for insert
  with check (public.is_workspace_member(workspace_id) or public.is_noctra_admin());

drop policy if exists "Members can CRUD their pillars" on public.brand_pillars;
create policy "Members can CRUD their pillars"
  on public.brand_pillars for all
  using (public.is_active_workspace_member(workspace_id))
  with check (public.is_active_workspace_member(workspace_id));

drop policy if exists "Members can CRUD their audiences" on public.platform_audiences;
create policy "Members can CRUD their audiences"
  on public.platform_audiences for all
  using (public.is_active_workspace_member(workspace_id))
  with check (public.is_active_workspace_member(workspace_id));

drop policy if exists "Members can CRUD their posts" on public.posts;
create policy "Members can CRUD their posts"
  on public.posts for all
  using (public.is_active_workspace_member(workspace_id))
  with check (public.is_active_workspace_member(workspace_id));

drop policy if exists "Members can read their insights" on public.ai_insights;
create policy "Members can read their insights"
  on public.ai_insights for select
  using (public.is_active_workspace_member(workspace_id));

create policy "Active workspace can manage brand voice"
  on public.brand_voice for all
  using (public.is_active_workspace_member(workspace_id))
  with check (public.is_active_workspace_member(workspace_id));

create policy "Active workspace can manage ideas"
  on public.content_ideas for all
  using (public.is_active_workspace_member(workspace_id))
  with check (public.is_active_workspace_member(workspace_id));

create policy "Active workspace can manage images"
  on public.image_library for all
  using (public.is_active_workspace_member(workspace_id))
  with check (public.is_active_workspace_member(workspace_id));

create policy "Active workspace can manage feedback"
  on public.post_feedback for all
  using (public.is_active_workspace_member(workspace_id))
  with check (public.is_active_workspace_member(workspace_id));

create policy "Active workspace can manage learning context"
  on public.ai_learning_context for all
  using (public.is_active_workspace_member(workspace_id))
  with check (public.is_active_workspace_member(workspace_id));

create policy "Active workspace can manage exports"
  on public.exports for all
  using (public.is_active_workspace_member(workspace_id))
  with check (public.is_active_workspace_member(workspace_id));

create policy "Active workspace can manage image briefs"
  on public.image_briefs for all
  using (public.is_active_workspace_member(workspace_id))
  with check (public.is_active_workspace_member(workspace_id));

create policy "Active workspace can manage design versions"
  on public.design_versions for all
  using (public.is_active_workspace_member(workspace_id))
  with check (public.is_active_workspace_member(workspace_id));

create policy "Active workspace can manage token ledger"
  on public.token_ledger for all
  using (public.is_active_workspace_member(workspace_id))
  with check (public.is_active_workspace_member(workspace_id));
