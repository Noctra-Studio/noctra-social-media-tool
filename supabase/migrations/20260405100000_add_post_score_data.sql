-- Add score_data column to the posts table if it doesn't already exist
ALTER TABLE posts ADD COLUMN IF NOT EXISTS score_data jsonb;

-- Update description for documentation (optional but helpful)
COMMENT ON COLUMN posts.score_data IS 'Detailed AI content scoring data including education, curiosity, and overall performance scores.';
