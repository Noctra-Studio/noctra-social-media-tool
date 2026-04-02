-- Migration: Add design_versions table for carousel editor snapshots
-- Created At: 2026-04-01

CREATE TABLE IF NOT EXISTS public.design_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  thumbnail text, -- base64 PNG of first slide
  slide_count integer NOT NULL,
  data jsonb NOT NULL, -- full DesignVersion object (slides, metadata, etc.)
  created_at timestamp WITH time zone DEFAULT now()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_design_versions_user_id ON public.design_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_design_versions_post_id ON public.design_versions(post_id);

-- Enable RLS
ALTER TABLE public.design_versions ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'design_versions' 
      AND policyname = 'Users can manage their own design versions'
  ) THEN
    CREATE POLICY "Users can manage their own design versions" 
      ON public.design_versions 
      USING (auth.uid() = user_id) 
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
