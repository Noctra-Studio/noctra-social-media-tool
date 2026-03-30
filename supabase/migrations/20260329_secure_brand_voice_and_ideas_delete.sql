do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'Missing table public.profiles. Run 20260101000000_initial_schema.sql before this migration.';
  end if;

  if to_regclass('public.brand_voice') is null then
    raise exception 'Missing table public.brand_voice. Run 20260101000000_initial_schema.sql before this migration.';
  end if;

  if to_regclass('public.content_ideas') is null then
    raise exception 'Missing table public.content_ideas. Run 20260101000000_initial_schema.sql before this migration.';
  end if;
end $$;

alter table public.brand_voice
add column if not exists user_id uuid references public.profiles(id) on delete cascade;

alter table public.brand_voice
alter column user_id set default auth.uid();

do $$
begin
  if (select count(*) from public.profiles) = 1 then
    update public.brand_voice
    set user_id = (select id from public.profiles limit 1)
    where user_id is null;
  end if;
end $$;

alter table public.brand_voice enable row level security;

create index if not exists idx_brand_voice_user_id on public.brand_voice(user_id);
create unique index if not exists brand_voice_user_id_unique
on public.brand_voice(user_id)
where user_id is not null;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'brand_voice'
      and policyname = 'Users can read own brand voice'
  ) then
    create policy "Users can read own brand voice"
      on public.brand_voice
      for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'brand_voice'
      and policyname = 'Users can insert own brand voice'
  ) then
    create policy "Users can insert own brand voice"
      on public.brand_voice
      for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'brand_voice'
      and policyname = 'Users can update own brand voice'
  ) then
    create policy "Users can update own brand voice"
      on public.brand_voice
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'brand_voice'
      and policyname = 'Users can delete own brand voice'
  ) then
    create policy "Users can delete own brand voice"
      on public.brand_voice
      for delete
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'content_ideas'
      and policyname = 'Users can delete own ideas'
  ) then
    create policy "Users can delete own ideas"
      on public.content_ideas
      for delete
      using (auth.uid() = user_id);
  end if;
end $$;
