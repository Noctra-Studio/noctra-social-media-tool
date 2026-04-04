insert into public.workspaces (slug, name, owner_id, status, plan)
select
  public.generate_workspace_slug(
    coalesce(nullif(p.full_name, ''), nullif(split_part(p.email, '@', 1), ''), 'workspace'),
    p.id
  ),
  coalesce(nullif(p.full_name, ''), nullif(split_part(p.email, '@', 1), ''), 'Workspace'),
  p.id,
  'active',
  'free'
from public.profiles p
where not exists (
  select 1
  from public.workspace_members wm
  where wm.user_id = p.id
)
on conflict (slug) do nothing;

insert into public.workspace_members (workspace_id, user_id, role, invited_by)
select
  w.id,
  w.owner_id,
  'owner',
  w.owner_id
from public.workspaces w
where w.owner_id is not null
  and not exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = w.id
      and wm.user_id = w.owner_id
  );

update public.profiles p
set current_workspace_id = candidate.workspace_id
from (
  select distinct on (wm.user_id)
    wm.user_id,
    wm.workspace_id
  from public.workspace_members wm
  order by wm.user_id, case when wm.role = 'owner' then 0 else 1 end, wm.created_at
) as candidate
where p.id = candidate.user_id
  and (p.current_workspace_id is null or p.current_workspace_id <> candidate.workspace_id);

update public.profiles p
set avatar_url = coalesce(
  nullif(u.raw_user_meta_data ->> 'avatar_url', ''),
  nullif(u.raw_user_meta_data ->> 'picture', ''),
  p.avatar_url
)
from auth.users u
where u.id = p.id
  and (p.avatar_url is null or p.avatar_url = '');

insert into public.workspace_config (
  workspace_id,
  brand_name,
  tone_of_voice,
  brand_values,
  forbidden_words,
  reference_posts,
  assistance_level
)
select
  p.current_workspace_id,
  coalesce(nullif(p.full_name, ''), nullif(split_part(p.email, '@', 1), ''), 'Workspace'),
  coalesce(bv.tone, 'professional'),
  bv.values,
  bv.forbidden_words,
  bv.example_posts,
  case coalesce(p.assistance_level, 'balanced')
    when 'guided' then 'minimal'
    when 'expert' then 'full'
    else 'balanced'
  end
from public.profiles p
left join public.brand_voice bv on bv.user_id = p.id
where p.current_workspace_id is not null
  and not exists (
    select 1
    from public.workspace_config wc
    where wc.workspace_id = p.current_workspace_id
  );

alter table if exists public.brand_voice
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade default public.current_workspace_id();

alter table if exists public.brand_pillars
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade default public.current_workspace_id();

alter table if exists public.platform_audiences
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade default public.current_workspace_id();

alter table if exists public.content_ideas
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade default public.current_workspace_id();

alter table if exists public.posts
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade default public.current_workspace_id(),
  add column if not exists created_by uuid references auth.users(id) default auth.uid(),
  add column if not exists external_post_id text;

alter table if exists public.image_library
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade default public.current_workspace_id();

alter table if exists public.post_feedback
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade default public.current_workspace_id();

alter table if exists public.ai_learning_context
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade default public.current_workspace_id();

alter table if exists public.exports
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade default public.current_workspace_id();

alter table if exists public.image_briefs
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade default public.current_workspace_id();

alter table if exists public.design_versions
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade default public.current_workspace_id();

alter table if exists public.token_ledger
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade default public.current_workspace_id();

update public.brand_voice bv
set workspace_id = p.current_workspace_id
from public.profiles p
where bv.workspace_id is null
  and bv.user_id = p.id
  and p.current_workspace_id is not null;

update public.brand_pillars bp
set workspace_id = p.current_workspace_id
from public.profiles p
where bp.workspace_id is null
  and bp.user_id = p.id
  and p.current_workspace_id is not null;

update public.platform_audiences pa
set workspace_id = p.current_workspace_id
from public.profiles p
where pa.workspace_id is null
  and pa.user_id = p.id
  and p.current_workspace_id is not null;

update public.content_ideas ci
set workspace_id = p.current_workspace_id
from public.profiles p
where ci.workspace_id is null
  and ci.user_id = p.id
  and p.current_workspace_id is not null;

update public.posts post
set
  workspace_id = p.current_workspace_id,
  created_by = coalesce(post.created_by, post.user_id)
from public.profiles p
where post.user_id = p.id
  and (post.workspace_id is null or post.created_by is null)
  and p.current_workspace_id is not null;

update public.image_library il
set workspace_id = post.workspace_id
from public.posts post
where il.workspace_id is null
  and il.used_in_post = post.id
  and post.workspace_id is not null;

update public.image_library il
set workspace_id = p.current_workspace_id
from public.profiles p
where il.workspace_id is null
  and il.user_id = p.id
  and p.current_workspace_id is not null;

update public.post_feedback pf
set workspace_id = post.workspace_id
from public.posts post
where pf.workspace_id is null
  and pf.post_id = post.id
  and post.workspace_id is not null;

update public.post_feedback pf
set workspace_id = p.current_workspace_id
from public.profiles p
where pf.workspace_id is null
  and pf.user_id = p.id
  and p.current_workspace_id is not null;

update public.ai_learning_context alc
set workspace_id = post.workspace_id
from public.posts post
where alc.workspace_id is null
  and alc.source_post_id = post.id
  and post.workspace_id is not null;

update public.ai_learning_context alc
set workspace_id = p.current_workspace_id
from public.profiles p
where alc.workspace_id is null
  and alc.user_id = p.id
  and p.current_workspace_id is not null;

update public.exports e
set workspace_id = post.workspace_id
from public.posts post
where e.workspace_id is null
  and e.post_id = post.id
  and post.workspace_id is not null;

update public.exports e
set workspace_id = p.current_workspace_id
from public.profiles p
where e.workspace_id is null
  and e.user_id = p.id
  and p.current_workspace_id is not null;

update public.image_briefs ib
set workspace_id = post.workspace_id
from public.posts post
where ib.workspace_id is null
  and ib.post_id = post.id
  and post.workspace_id is not null;

update public.image_briefs ib
set workspace_id = p.current_workspace_id
from public.profiles p
where ib.workspace_id is null
  and ib.user_id = p.id
  and p.current_workspace_id is not null;

update public.design_versions dv
set workspace_id = post.workspace_id
from public.posts post
where dv.workspace_id is null
  and dv.post_id = post.id
  and post.workspace_id is not null;

update public.design_versions dv
set workspace_id = p.current_workspace_id
from public.profiles p
where dv.workspace_id is null
  and dv.user_id = p.id
  and p.current_workspace_id is not null;

update public.token_ledger tl
set workspace_id = p.current_workspace_id
from public.profiles p
where tl.workspace_id is null
  and tl.user_id = p.id
  and p.current_workspace_id is not null;

create unique index if not exists idx_brand_voice_workspace_id
  on public.brand_voice(workspace_id)
  where workspace_id is not null;

create index if not exists idx_brand_pillars_workspace_id
  on public.brand_pillars(workspace_id);

create index if not exists idx_platform_audiences_workspace_id
  on public.platform_audiences(workspace_id);

create index if not exists idx_content_ideas_workspace_id
  on public.content_ideas(workspace_id);

create index if not exists idx_posts_workspace_id
  on public.posts(workspace_id);

create index if not exists idx_posts_workspace_platform
  on public.posts(workspace_id, platform);

create index if not exists idx_posts_workspace_status
  on public.posts(workspace_id, status);

create index if not exists idx_posts_workspace_scheduled
  on public.posts(scheduled_at)
  where status = 'scheduled';

create index if not exists idx_image_library_workspace_id
  on public.image_library(workspace_id);

create index if not exists idx_post_feedback_workspace_id
  on public.post_feedback(workspace_id);

create index if not exists idx_ai_learning_context_workspace_id
  on public.ai_learning_context(workspace_id);

create index if not exists idx_exports_workspace_id
  on public.exports(workspace_id);

create index if not exists idx_image_briefs_workspace_id
  on public.image_briefs(workspace_id);

create index if not exists idx_design_versions_workspace_id
  on public.design_versions(workspace_id);

create index if not exists idx_token_ledger_workspace_id
  on public.token_ledger(workspace_id);
