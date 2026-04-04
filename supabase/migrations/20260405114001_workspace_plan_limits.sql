alter table public.workspaces
  drop constraint if exists workspaces_plan_check;

alter table public.workspaces
  add constraint workspaces_plan_check
  check (plan in ('free', 'starter', 'pro', 'agency', 'enterprise'));

alter table public.profiles
  add column if not exists workspace_limit_override integer
  check (workspace_limit_override is null or workspace_limit_override > 0);
