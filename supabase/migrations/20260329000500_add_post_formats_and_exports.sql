ALTER TABLE posts ADD COLUMN IF NOT EXISTS format text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS export_metadata jsonb;

CREATE TABLE IF NOT EXISTS exports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  platform text not null,
  format text not null,
  exported_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_posts_format ON posts(format);
CREATE INDEX IF NOT EXISTS idx_exports_post_id ON exports(post_id);
CREATE INDEX IF NOT EXISTS idx_exports_user_id ON exports(user_id);
CREATE INDEX IF NOT EXISTS idx_exports_exported_at ON exports(exported_at);

ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own exports" ON exports;
CREATE POLICY "Users can read own exports" on exports for select using (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own exports" ON exports;
CREATE POLICY "Users can insert own exports" on exports for insert with check (auth.uid() = user_id);
