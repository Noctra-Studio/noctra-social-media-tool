create table if not exists public.brand_pillars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade default auth.uid(),
  name text not null,
  description text,
  color text,
  post_count int default 0,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists public.platform_audiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade default auth.uid(),
  platform text not null,
  audience_description text,
  pain_points text[],
  desired_outcomes text[],
  language_level text default 'mixed',
  updated_at timestamptz default now()
);

alter table public.brand_pillars
  add column if not exists user_id uuid references public.profiles(id) on delete cascade default auth.uid(),
  add column if not exists name text,
  add column if not exists description text,
  add column if not exists color text,
  add column if not exists post_count int default 0,
  add column if not exists sort_order int default 0,
  add column if not exists created_at timestamptz default now();

alter table public.platform_audiences
  add column if not exists user_id uuid references public.profiles(id) on delete cascade default auth.uid(),
  add column if not exists platform text,
  add column if not exists audience_description text,
  add column if not exists pain_points text[],
  add column if not exists desired_outcomes text[],
  add column if not exists language_level text default 'mixed',
  add column if not exists updated_at timestamptz default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'platform_audiences_language_level_check'
      and conrelid = 'public.platform_audiences'::regclass
  ) then
    alter table public.platform_audiences
      add constraint platform_audiences_language_level_check
      check (language_level in ('technical', 'mixed', 'non-technical'));
  end if;
end $$;

alter table public.posts
  add column if not exists pillar_id uuid references public.brand_pillars(id) on delete set null;

create index if not exists idx_brand_pillars_user_id on public.brand_pillars(user_id);
create index if not exists idx_brand_pillars_sort_order on public.brand_pillars(user_id, sort_order);
create index if not exists idx_platform_audiences_user_id on public.platform_audiences(user_id);
create unique index if not exists platform_audiences_user_platform_unique
  on public.platform_audiences(user_id, platform)
  where user_id is not null;
create index if not exists idx_posts_pillar_id on public.posts(pillar_id);

alter table public.brand_pillars enable row level security;
alter table public.platform_audiences enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'brand_pillars'
      and policyname = 'Users can read own brand pillars'
  ) then
    create policy "Users can read own brand pillars"
      on public.brand_pillars
      for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'brand_pillars'
      and policyname = 'Users can insert own brand pillars'
  ) then
    create policy "Users can insert own brand pillars"
      on public.brand_pillars
      for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'brand_pillars'
      and policyname = 'Users can update own brand pillars'
  ) then
    create policy "Users can update own brand pillars"
      on public.brand_pillars
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
      and tablename = 'brand_pillars'
      and policyname = 'Users can delete own brand pillars'
  ) then
    create policy "Users can delete own brand pillars"
      on public.brand_pillars
      for delete
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'platform_audiences'
      and policyname = 'Users can read own platform audiences'
  ) then
    create policy "Users can read own platform audiences"
      on public.platform_audiences
      for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'platform_audiences'
      and policyname = 'Users can insert own platform audiences'
  ) then
    create policy "Users can insert own platform audiences"
      on public.platform_audiences
      for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'platform_audiences'
      and policyname = 'Users can update own platform audiences'
  ) then
    create policy "Users can update own platform audiences"
      on public.platform_audiences
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
      and tablename = 'platform_audiences'
      and policyname = 'Users can delete own platform audiences'
  ) then
    create policy "Users can delete own platform audiences"
      on public.platform_audiences
      for delete
      using (auth.uid() = user_id);
  end if;
end $$;
