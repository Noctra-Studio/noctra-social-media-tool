-- Enable RLS on tables that were created outside of migrations.
-- Wrapped in DO blocks so the migration is a no-op on shadow/fresh databases
-- where these tables don't exist yet.

-- ─── crm_activity_events ────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'crm_activity_events'
  ) THEN
    ALTER TABLE public.crm_activity_events ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'crm_activity_events'
        AND policyname = 'crm_activity_events: select own'
    ) THEN
      CREATE POLICY "crm_activity_events: select own"
        ON public.crm_activity_events FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'crm_activity_events'
        AND policyname = 'crm_activity_events: insert own'
    ) THEN
      CREATE POLICY "crm_activity_events: insert own"
        ON public.crm_activity_events FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'crm_activity_events'
        AND policyname = 'crm_activity_events: delete own'
    ) THEN
      CREATE POLICY "crm_activity_events: delete own"
        ON public.crm_activity_events FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
  END IF;
END $$;

-- ─── dashboard_preferences ──────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'dashboard_preferences'
  ) THEN
    ALTER TABLE public.dashboard_preferences ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'dashboard_preferences'
        AND policyname = 'dashboard_preferences: select own'
    ) THEN
      CREATE POLICY "dashboard_preferences: select own"
        ON public.dashboard_preferences FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'dashboard_preferences'
        AND policyname = 'dashboard_preferences: insert own'
    ) THEN
      CREATE POLICY "dashboard_preferences: insert own"
        ON public.dashboard_preferences FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'dashboard_preferences'
        AND policyname = 'dashboard_preferences: update own'
    ) THEN
      CREATE POLICY "dashboard_preferences: update own"
        ON public.dashboard_preferences FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'dashboard_preferences'
        AND policyname = 'dashboard_preferences: delete own'
    ) THEN
      CREATE POLICY "dashboard_preferences: delete own"
        ON public.dashboard_preferences FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
  END IF;
END $$;

-- ─── workspace_config ───────────────────────────────────────────────────────
-- No user_id column; membership resolved via workspace_members.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'workspace_config'
  ) THEN
    ALTER TABLE public.workspace_config ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'workspace_config'
        AND policyname = 'workspace_config: select own'
    ) THEN
      CREATE POLICY "workspace_config: select own"
        ON public.workspace_config FOR SELECT
        USING (
          auth.uid() IN (
            SELECT user_id FROM public.workspace_members
            WHERE workspace_id = workspace_config.workspace_id
          )
        );
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'workspace_config'
        AND policyname = 'workspace_config: insert own'
    ) THEN
      CREATE POLICY "workspace_config: insert own"
        ON public.workspace_config FOR INSERT
        WITH CHECK (
          auth.uid() IN (
            SELECT user_id FROM public.workspace_members
            WHERE workspace_id = workspace_config.workspace_id
          )
        );
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'workspace_config'
        AND policyname = 'workspace_config: update own'
    ) THEN
      CREATE POLICY "workspace_config: update own"
        ON public.workspace_config FOR UPDATE
        USING (
          auth.uid() IN (
            SELECT user_id FROM public.workspace_members
            WHERE workspace_id = workspace_config.workspace_id
          )
        )
        WITH CHECK (
          auth.uid() IN (
            SELECT user_id FROM public.workspace_members
            WHERE workspace_id = workspace_config.workspace_id
          )
        );
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'workspace_config'
        AND policyname = 'workspace_config: delete own'
    ) THEN
      CREATE POLICY "workspace_config: delete own"
        ON public.workspace_config FOR DELETE
        USING (
          auth.uid() IN (
            SELECT user_id FROM public.workspace_members
            WHERE workspace_id = workspace_config.workspace_id
          )
        );
    END IF;
  END IF;
END $$;
