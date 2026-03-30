do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'Missing table public.profiles. Run 20260101000000_initial_schema.sql before this migration.';
  end if;

  if to_regclass('public.content_ideas') is null then
    raise exception 'Missing table public.content_ideas. Run 20260101000000_initial_schema.sql before this migration.';
  end if;
end $$;

create extension if not exists pgcrypto;

insert into public.profiles (id, email, full_name)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'name',
    ''
  )
from auth.users u
on conflict (id) do update
set
  email = excluded.email,
  full_name = case
    when public.profiles.full_name is null or public.profiles.full_name = '' then excluded.full_name
    else public.profiles.full_name
  end;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid references public.content_ideas(id) on delete set null,
  platform text not null,
  angle text,
  content jsonb not null default '{}'::jsonb,
  image_url text,
  scheduled_at timestamptz,
  published_at timestamptz,
  status text default 'draft',
  created_at timestamptz default now(),
  user_id uuid references public.profiles(id) on delete cascade
);

alter table public.posts
  add column if not exists idea_id uuid references public.content_ideas(id) on delete set null,
  add column if not exists platform text,
  add column if not exists angle text,
  add column if not exists content jsonb not null default '{}'::jsonb,
  add column if not exists image_url text,
  add column if not exists scheduled_at timestamptz,
  add column if not exists published_at timestamptz,
  add column if not exists status text default 'draft',
  add column if not exists created_at timestamptz default now(),
  add column if not exists user_id uuid references public.profiles(id) on delete cascade;

create index if not exists idx_posts_scheduled_at on public.posts(scheduled_at);
create index if not exists idx_posts_platform on public.posts(platform);
create index if not exists idx_posts_status on public.posts(status);
create index if not exists idx_posts_user_id on public.posts(user_id);

create table if not exists public.image_library (
  id uuid primary key default gen_random_uuid(),
  unsplash_id text,
  url text not null,
  thumb_url text not null,
  photographer text,
  on_brand_score double precision,
  tags text[],
  used_in_post uuid references public.posts(id) on delete set null,
  saved_at timestamptz default now(),
  user_id uuid references public.profiles(id) on delete cascade
);

alter table public.image_library
  add column if not exists unsplash_id text,
  add column if not exists url text,
  add column if not exists thumb_url text,
  add column if not exists photographer text,
  add column if not exists on_brand_score double precision,
  add column if not exists tags text[],
  add column if not exists used_in_post uuid references public.posts(id) on delete set null,
  add column if not exists saved_at timestamptz default now(),
  add column if not exists user_id uuid references public.profiles(id) on delete cascade;

create index if not exists idx_image_library_user_id on public.image_library(user_id);
create index if not exists idx_image_library_saved_at on public.image_library(saved_at);

create table if not exists public.post_feedback (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  rating int check (rating between 1 and 5),
  used_as_published boolean default false,
  edited_before_publish boolean default false,
  notes text,
  created_at timestamptz default now()
);

alter table public.post_feedback
  add column if not exists post_id uuid references public.posts(id) on delete cascade,
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists rating int,
  add column if not exists used_as_published boolean default false,
  add column if not exists edited_before_publish boolean default false,
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'post_feedback_rating_check'
      and conrelid = 'public.post_feedback'::regclass
  ) then
    alter table public.post_feedback
      add constraint post_feedback_rating_check
      check (rating between 1 and 5);
  end if;
end $$;

create index if not exists idx_post_feedback_user_id on public.post_feedback(user_id);
create index if not exists idx_post_feedback_post_id on public.post_feedback(post_id);

create table if not exists public.ai_learning_context (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  platform text not null,
  context_type text not null,
  content text not null,
  source_post_id uuid references public.posts(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.ai_learning_context
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists platform text,
  add column if not exists context_type text,
  add column if not exists content text,
  add column if not exists source_post_id uuid references public.posts(id) on delete set null,
  add column if not exists created_at timestamptz default now();

create index if not exists idx_ai_learning_context_user_id on public.ai_learning_context(user_id);
create index if not exists idx_ai_learning_context_platform on public.ai_learning_context(platform);

do $$
declare
  only_profile_id uuid;
begin
  if (select count(*) from public.profiles) = 1 then
    select id into only_profile_id from public.profiles limit 1;

    update public.posts
    set user_id = only_profile_id
    where user_id is null;

    update public.image_library
    set user_id = only_profile_id
    where user_id is null;

    update public.post_feedback
    set user_id = only_profile_id
    where user_id is null;

    update public.ai_learning_context
    set user_id = only_profile_id
    where user_id is null;
  end if;
end $$;

alter table public.posts enable row level security;
alter table public.image_library enable row level security;
alter table public.post_feedback enable row level security;
alter table public.ai_learning_context enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'posts'
      and policyname = 'Users can read own posts'
  ) then
    create policy "Users can read own posts"
      on public.posts
      for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'posts'
      and policyname = 'Users can insert own posts'
  ) then
    create policy "Users can insert own posts"
      on public.posts
      for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'posts'
      and policyname = 'Users can update own posts'
  ) then
    create policy "Users can update own posts"
      on public.posts
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'image_library'
      and policyname = 'Users can read own images'
  ) then
    create policy "Users can read own images"
      on public.image_library
      for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'image_library'
      and policyname = 'Users can insert own images'
  ) then
    create policy "Users can insert own images"
      on public.image_library
      for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'image_library'
      and policyname = 'Users can update own images'
  ) then
    create policy "Users can update own images"
      on public.image_library
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'post_feedback'
      and policyname = 'Users can read own feedback'
  ) then
    create policy "Users can read own feedback"
      on public.post_feedback
      for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'post_feedback'
      and policyname = 'Users can insert own feedback'
  ) then
    create policy "Users can insert own feedback"
      on public.post_feedback
      for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_learning_context'
      and policyname = 'Users can read own context'
  ) then
    create policy "Users can read own context"
      on public.ai_learning_context
      for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_learning_context'
      and policyname = 'Users can insert own context'
  ) then
    create policy "Users can insert own context"
      on public.ai_learning_context
      for insert
      with check (auth.uid() = user_id);
  end if;
end $$;
