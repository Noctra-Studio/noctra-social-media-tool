create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  company_name text not null,
  website_url text,
  platforms text[] not null,
  goal text not null,
  monthly_budget text,
  referral_source text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'waitlisted')),
  reviewed_by uuid references auth.users(id) on delete set null,
  review_notes text,
  workspace_id uuid references public.workspaces(id) on delete set null,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists idx_access_requests_status
  on public.access_requests(status);

create index if not exists idx_access_requests_email
  on public.access_requests(email);
