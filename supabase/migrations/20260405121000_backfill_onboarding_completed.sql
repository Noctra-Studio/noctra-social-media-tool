-- Workspaces that already have a brand_name set were configured before
-- the onboarding_completed column existed. Mark them as onboarded so that
-- returning users are not incorrectly redirected to /onboarding.
update public.workspace_config
set onboarding_completed = true
where onboarding_completed = false
  and brand_name is not null
  and trim(brand_name) != '';
