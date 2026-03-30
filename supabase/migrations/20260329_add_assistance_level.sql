do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'Missing table public.profiles. Run 20260101000000_initial_schema.sql before this migration.';
  end if;
end $$;

alter table public.profiles
add column if not exists assistance_level text default 'balanced';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_assistance_level_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_assistance_level_check
      check (assistance_level in ('guided', 'balanced', 'expert'));
  end if;
end $$;
