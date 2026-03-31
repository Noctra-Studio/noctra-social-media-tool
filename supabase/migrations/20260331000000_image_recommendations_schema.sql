-- 20260331000000_image_recommendations_schema.sql
CREATE TABLE IF NOT EXISTS image_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  slide_index int DEFAULT -1,  -- -1 = single post
  brief_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, slide_index)
);

ALTER TABLE image_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "image_briefs: select own"
  ON image_briefs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "image_briefs: insert own"
  ON image_briefs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "image_briefs: update own"
  ON image_briefs FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- table: token_ledger
CREATE TABLE IF NOT EXISTS token_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  operation text NOT NULL, -- e.g. 'image_brief', 'image_score', 'image_evaluate'
  tokens_used int NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE token_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "token_ledger: select own"
  ON token_ledger FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "token_ledger: insert system"
  ON token_ledger FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexing for performance
CREATE INDEX idx_image_briefs_post_id ON image_briefs(post_id);
CREATE INDEX idx_token_ledger_user_id ON token_ledger(user_id);
CREATE INDEX idx_token_ledger_created_at ON token_ledger(created_at);
