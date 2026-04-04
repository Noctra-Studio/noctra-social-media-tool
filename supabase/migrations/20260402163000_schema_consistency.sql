create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table if exists public.profiles
  add column if not exists updated_at timestamptz default now();

alter table if exists public.brand_voice
  add column if not exists created_at timestamptz default now();

alter table if exists public.brand_pillars
  add column if not exists updated_at timestamptz default now();

alter table if exists public.platform_audiences
  add column if not exists created_at timestamptz default now();

alter table if exists public.content_ideas
  add column if not exists updated_at timestamptz default now();

alter table if exists public.posts
  add column if not exists updated_at timestamptz default now();

alter table if exists public.image_library
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table if exists public.post_feedback
  add column if not exists updated_at timestamptz default now();

alter table if exists public.ai_learning_context
  add column if not exists updated_at timestamptz default now();

alter table if exists public.image_briefs
  add column if not exists updated_at timestamptz default now();

alter table if exists public.design_versions
  add column if not exists updated_at timestamptz default now();

update public.profiles
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

update public.brand_voice
set created_at = coalesce(created_at, updated_at, now())
where created_at is null;

update public.brand_pillars
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

update public.platform_audiences
set created_at = coalesce(created_at, updated_at, now())
where created_at is null;

update public.content_ideas
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

update public.posts
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

update public.image_library
set
  created_at = coalesce(created_at, saved_at, now()),
  updated_at = coalesce(updated_at, saved_at, created_at, now())
where created_at is null or updated_at is null;

update public.post_feedback
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

update public.ai_learning_context
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

update public.image_briefs
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

update public.design_versions
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_brand_voice_updated_at on public.brand_voice;
create trigger set_brand_voice_updated_at
  before update on public.brand_voice
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_brand_pillars_updated_at on public.brand_pillars;
create trigger set_brand_pillars_updated_at
  before update on public.brand_pillars
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_platform_audiences_updated_at on public.platform_audiences;
create trigger set_platform_audiences_updated_at
  before update on public.platform_audiences
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_content_ideas_updated_at on public.content_ideas;
create trigger set_content_ideas_updated_at
  before update on public.content_ideas
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_posts_updated_at on public.posts;
create trigger set_posts_updated_at
  before update on public.posts
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_image_library_updated_at on public.image_library;
create trigger set_image_library_updated_at
  before update on public.image_library
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_post_feedback_updated_at on public.post_feedback;
create trigger set_post_feedback_updated_at
  before update on public.post_feedback
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_ai_learning_context_updated_at on public.ai_learning_context;
create trigger set_ai_learning_context_updated_at
  before update on public.ai_learning_context
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_image_briefs_updated_at on public.image_briefs;
create trigger set_image_briefs_updated_at
  before update on public.image_briefs
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_design_versions_updated_at on public.design_versions;
create trigger set_design_versions_updated_at
  before update on public.design_versions
  for each row execute procedure public.set_updated_at();

create index if not exists idx_content_ideas_user_id_created_at
  on public.content_ideas(user_id, created_at desc);

create index if not exists idx_content_ideas_user_id_status_created_at
  on public.content_ideas(user_id, status, created_at desc);

create index if not exists idx_posts_user_id_created_at
  on public.posts(user_id, created_at desc);

create index if not exists idx_posts_user_id_scheduled_at
  on public.posts(user_id, scheduled_at);

create index if not exists idx_image_briefs_user_id
  on public.image_briefs(user_id);

create index if not exists idx_design_versions_post_id_created_at
  on public.design_versions(post_id, created_at desc);
