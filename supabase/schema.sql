-- Canonical snapshot for app-owned Supabase objects.
-- Source of truth: apply the files in supabase/migrations in chronological order.

create extension if not exists pgcrypto;

create type post_type as enum (
  'single_post',
  'carousel',
  'thread',
  'article',
  'slides'
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text default 'owner',
  assistance_level text default 'balanced' check (assistance_level in ('guided', 'balanced', 'expert')),
  social_handles jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table brand_voice (
  id uuid primary key default gen_random_uuid(),
  tone text,
  values text[],
  forbidden_words text[],
  example_posts text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  user_id uuid references profiles(id) on delete cascade default auth.uid()
);

create table brand_pillars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade default auth.uid(),
  name text not null,
  description text,
  color text,
  post_count int default 0,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table platform_audiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade default auth.uid(),
  platform text not null,
  audience_description text,
  pain_points text,
  desired_outcomes text,
  language_level text default 'mixed' check (language_level in ('technical', 'mixed', 'non-technical')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table content_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  raw_idea text not null,
  platform text,
  status text default 'raw',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid references content_ideas(id) on delete set null,
  pillar_id uuid references brand_pillars(id) on delete set null,
  user_id uuid references profiles(id) on delete cascade,
  platform text not null,
  format text,
  post_type post_type default 'single_post',
  angle text,
  content jsonb not null default '{}'::jsonb,
  export_metadata jsonb,
  image_url text,
  thread_items jsonb,
  article_data jsonb,
  carousel_slides jsonb,
  slides_data jsonb,
  score_data jsonb,
  scheduled_at timestamptz,
  published_at timestamptz,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table image_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  unsplash_id text,
  url text not null,
  thumb_url text not null,
  photographer text,
  on_brand_score double precision,
  tags text[],
  used_in_post uuid references posts(id) on delete set null,
  created_at timestamptz default now(),
  saved_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table post_feedback (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  rating int check (rating between 1 and 5),
  used_as_published boolean default false,
  edited_before_publish boolean default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table ai_learning_context (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  platform text not null,
  context_type text not null,
  content text not null,
  source_post_id uuid references posts(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table exports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  platform text not null,
  format text not null,
  exported_at timestamptz default now()
);

create table image_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  slide_index int default -1,
  brief_data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (post_id, slide_index)
);

create table token_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  operation text not null,
  tokens_used int not null,
  metadata jsonb,
  created_at timestamptz default now()
);

create table design_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  post_id uuid references posts(id) on delete set null,
  name text not null,
  description text,
  thumbnail text,
  slide_count integer not null,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      ''
    ),
    coalesce(new.raw_user_meta_data ->> 'role', 'owner')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = case
      when coalesce(public.profiles.full_name, '') = '' then excluded.full_name
      else public.profiles.full_name
    end,
    role = coalesce(public.profiles.role, excluded.role);

  return new;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger set_brand_voice_updated_at
  before update on public.brand_voice
  for each row execute procedure public.set_updated_at();

create trigger set_brand_pillars_updated_at
  before update on public.brand_pillars
  for each row execute procedure public.set_updated_at();

create trigger set_platform_audiences_updated_at
  before update on public.platform_audiences
  for each row execute procedure public.set_updated_at();

create trigger set_content_ideas_updated_at
  before update on public.content_ideas
  for each row execute procedure public.set_updated_at();

create trigger set_posts_updated_at
  before update on public.posts
  for each row execute procedure public.set_updated_at();

create trigger set_image_library_updated_at
  before update on public.image_library
  for each row execute procedure public.set_updated_at();

create trigger set_post_feedback_updated_at
  before update on public.post_feedback
  for each row execute procedure public.set_updated_at();

create trigger set_ai_learning_context_updated_at
  before update on public.ai_learning_context
  for each row execute procedure public.set_updated_at();

create trigger set_image_briefs_updated_at
  before update on public.image_briefs
  for each row execute procedure public.set_updated_at();

create trigger set_design_versions_updated_at
  before update on public.design_versions
  for each row execute procedure public.set_updated_at();

create index idx_brand_voice_user_id on brand_voice(user_id);
create unique index brand_voice_user_id_unique on brand_voice(user_id) where user_id is not null;
create index idx_brand_pillars_user_id on brand_pillars(user_id);
create index idx_brand_pillars_sort_order on brand_pillars(user_id, sort_order);
create index idx_platform_audiences_user_id on platform_audiences(user_id);
create unique index platform_audiences_user_platform_unique on platform_audiences(user_id, platform) where user_id is not null;
create index idx_content_ideas_user_id_created_at on content_ideas(user_id, created_at desc);
create index idx_content_ideas_user_id_status_created_at on content_ideas(user_id, status, created_at desc);
create index idx_posts_scheduled_at on posts(scheduled_at);
create index idx_posts_platform on posts(platform);
create index idx_posts_status on posts(status);
create index idx_posts_post_type on posts(post_type);
create index idx_posts_user_id on posts(user_id);
create index idx_posts_user_id_created_at on posts(user_id, created_at desc);
create index idx_posts_user_id_scheduled_at on posts(user_id, scheduled_at);
create index idx_posts_format on posts(format);
create index idx_posts_pillar_id on posts(pillar_id);
create index idx_image_library_user_id on image_library(user_id);
create index idx_image_library_saved_at on image_library(saved_at);
create index idx_post_feedback_user_id on post_feedback(user_id);
create index idx_post_feedback_post_id on post_feedback(post_id);
create index idx_ai_learning_context_user_id on ai_learning_context(user_id);
create index idx_ai_learning_context_platform on ai_learning_context(platform);
create index idx_exports_post_id on exports(post_id);
create index idx_exports_user_id on exports(user_id);
create index idx_exports_exported_at on exports(exported_at);
create index idx_image_briefs_post_id on image_briefs(post_id);
create index idx_image_briefs_user_id on image_briefs(user_id);
create index idx_token_ledger_user_id on token_ledger(user_id);
create index idx_token_ledger_created_at on token_ledger(created_at);
create index idx_design_versions_user_id on design_versions(user_id);
create index idx_design_versions_post_id on design_versions(post_id);
create index idx_design_versions_post_id_created_at on design_versions(post_id, created_at desc);

alter table profiles enable row level security;
alter table brand_voice enable row level security;
alter table brand_pillars enable row level security;
alter table platform_audiences enable row level security;
alter table content_ideas enable row level security;
alter table posts enable row level security;
alter table image_library enable row level security;
alter table post_feedback enable row level security;
alter table ai_learning_context enable row level security;
alter table exports enable row level security;
alter table image_briefs enable row level security;
alter table token_ledger enable row level security;
alter table design_versions enable row level security;

create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Users can read own brand voice" on brand_voice for select using (auth.uid() = user_id);
create policy "Users can insert own brand voice" on brand_voice for insert with check (auth.uid() = user_id);
create policy "Users can update own brand voice" on brand_voice for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own brand voice" on brand_voice for delete using (auth.uid() = user_id);

create policy "Users can read own brand pillars" on brand_pillars for select using (auth.uid() = user_id);
create policy "Users can insert own brand pillars" on brand_pillars for insert with check (auth.uid() = user_id);
create policy "Users can update own brand pillars" on brand_pillars for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own brand pillars" on brand_pillars for delete using (auth.uid() = user_id);

create policy "Users can read own platform audiences" on platform_audiences for select using (auth.uid() = user_id);
create policy "Users can insert own platform audiences" on platform_audiences for insert with check (auth.uid() = user_id);
create policy "Users can update own platform audiences" on platform_audiences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own platform audiences" on platform_audiences for delete using (auth.uid() = user_id);

create policy "Users can read own ideas" on content_ideas for select using (auth.uid() = user_id);
create policy "Users can insert own ideas" on content_ideas for insert with check (auth.uid() = user_id);
create policy "Users can update own ideas" on content_ideas for update using (auth.uid() = user_id);
create policy "Users can delete own ideas" on content_ideas for delete using (auth.uid() = user_id);

create policy "Users can read own posts" on posts for select using (auth.uid() = user_id);
create policy "Users can insert own posts" on posts for insert with check (auth.uid() = user_id);
create policy "Users can update own posts" on posts for update using (auth.uid() = user_id);

create policy "Users can read own images" on image_library for select using (auth.uid() = user_id);
create policy "Users can insert own images" on image_library for insert with check (auth.uid() = user_id);
create policy "Users can update own images" on image_library for update using (auth.uid() = user_id);

create policy "Users can read own feedback" on post_feedback for select using (auth.uid() = user_id);
create policy "Users can insert own feedback" on post_feedback for insert with check (auth.uid() = user_id);

create policy "Users can read own context" on ai_learning_context for select using (auth.uid() = user_id);
create policy "Users can insert own context" on ai_learning_context for insert with check (auth.uid() = user_id);

create policy "Users can read own exports" on exports for select using (auth.uid() = user_id);
create policy "Users can insert own exports" on exports for insert with check (auth.uid() = user_id);

create policy "image_briefs: select own" on image_briefs for select using (auth.uid() = user_id);
create policy "image_briefs: insert own" on image_briefs for insert with check (auth.uid() = user_id);
create policy "image_briefs: update own" on image_briefs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "token_ledger: select own" on token_ledger for select using (auth.uid() = user_id);
create policy "token_ledger: insert own" on token_ledger for insert with check (auth.uid() = user_id);

create policy "Users can manage their own design versions"
  on design_versions
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/avif', 'image/jpeg', 'image/png', 'image/webp']
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  10485760,
  array['image/avif', 'image/jpeg', 'image/png', 'image/webp']
);

create policy "avatars: upload own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars: update own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars: delete own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "post-images: upload own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "post-images: update own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "post-images: delete own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
