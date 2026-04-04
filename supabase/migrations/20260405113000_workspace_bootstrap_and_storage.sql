insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'workspace-assets',
  'workspace-assets',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'workspace-assets: select active member'
  ) then
    create policy "workspace-assets: select active member"
      on storage.objects
      for select
      to authenticated
      using (
        bucket_id = 'workspace-assets'
        and public.is_workspace_member(split_part(name, '/', 1)::uuid)
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'workspace-assets: insert active member'
  ) then
    create policy "workspace-assets: insert active member"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'workspace-assets'
        and public.is_workspace_member(split_part(name, '/', 1)::uuid)
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'workspace-assets: delete active member'
  ) then
    create policy "workspace-assets: delete active member"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'workspace-assets'
        and public.is_workspace_member(split_part(name, '/', 1)::uuid)
      );
  end if;
end $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  workspace_name text;
  workspace_slug text;
  new_workspace_id uuid;
begin
  workspace_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'workspace_name', ''),
    nullif(new.raw_user_meta_data ->> 'company_name', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Workspace'
  );

  workspace_slug := public.generate_workspace_slug(workspace_name, new.id);

  insert into public.workspaces (slug, name, owner_id, status, plan)
  values (workspace_slug, workspace_name, new.id, 'active', 'free')
  returning id into new_workspace_id;

  insert into public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    current_workspace_id,
    noctra_role
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', null),
    new_workspace_id,
    'user'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    current_workspace_id = coalesce(public.profiles.current_workspace_id, excluded.current_workspace_id),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    full_name = case
      when coalesce(public.profiles.full_name, '') = '' then excluded.full_name
      else public.profiles.full_name
    end;

  insert into public.workspace_members (workspace_id, user_id, role, invited_by)
  values (new_workspace_id, new.id, 'owner', new.id)
  on conflict (workspace_id, user_id) do nothing;

  insert into public.workspace_config (workspace_id, brand_name)
  values (new_workspace_id, workspace_name)
  on conflict (workspace_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
