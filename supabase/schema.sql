-- table: brand_voice
create table brand_voice (
  id uuid primary key default gen_random_uuid(),
  tone text,
  values text[],
  forbidden_words text[],
  example_posts text[],
  updated_at timestamptz default now(),
  user_id uuid
);

-- table: content_ideas
create table content_ideas (
  id uuid primary key default gen_random_uuid(),
  raw_idea text not null,
  platform text,
  status text default 'raw',
  created_at timestamptz default now()
);

-- table: posts
create table posts (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid references content_ideas(id),
  platform text not null,
  angle text,
  content jsonb not null default '{}'::jsonb,
  image_url text,
  scheduled_at timestamptz,
  published_at timestamptz,
  status text default 'draft',
  created_at timestamptz default now()
);

CREATE INDEX idx_posts_scheduled_at ON posts(scheduled_at);
CREATE INDEX idx_posts_platform ON posts(platform);
CREATE INDEX idx_posts_status ON posts(status);

-- table: image_library
create table image_library (
  id uuid primary key default gen_random_uuid(),
  unsplash_id text,
  url text not null,
  thumb_url text not null,
  photographer text,
  on_brand_score double precision,
  tags text[],
  used_in_post uuid references posts(id),
  saved_at timestamptz default now()
);

-- table: profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text default 'owner',
  assistance_level text default 'balanced' check (assistance_level in ('guided', 'balanced', 'expert')),
  social_handles jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

-- table: post_feedback
create table post_feedback (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id),
  rating int check (rating between 1 and 5),
  used_as_published boolean default false,
  edited_before_publish boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- table: ai_learning_context
create table ai_learning_context (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  platform text not null,
  context_type text not null,
  content text not null,
  source_post_id uuid references posts(id),
  created_at timestamptz default now()
);

-- alter existing tables
ALTER TABLE content_ideas ADD COLUMN user_id uuid references profiles(id);
ALTER TABLE posts ADD COLUMN user_id uuid references profiles(id);
ALTER TABLE image_library ADD COLUMN user_id uuid references profiles(id);
ALTER TABLE brand_voice ADD CONSTRAINT brand_voice_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE brand_voice ALTER COLUMN user_id SET DEFAULT auth.uid();

CREATE INDEX idx_brand_voice_user_id ON brand_voice(user_id);
CREATE UNIQUE INDEX brand_voice_user_id_unique ON brand_voice(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_image_library_user_id ON image_library(user_id);
CREATE INDEX idx_image_library_saved_at ON image_library(saved_at);
CREATE INDEX idx_post_feedback_user_id ON post_feedback(user_id);
CREATE INDEX idx_post_feedback_post_id ON post_feedback(post_id);
CREATE INDEX idx_ai_learning_context_user_id ON ai_learning_context(user_id);
CREATE INDEX idx_ai_learning_context_platform ON ai_learning_context(platform);

-- enable RLS
alter table brand_voice enable row level security;
alter table profiles enable row level security;
alter table posts enable row level security;
alter table content_ideas enable row level security;
alter table post_feedback enable row level security;
alter table ai_learning_context enable row level security;
alter table image_library enable row level security;

-- policies
create policy "Users can read own brand voice" on brand_voice for select using (auth.uid() = user_id);
create policy "Users can insert own brand voice" on brand_voice for insert with check (auth.uid() = user_id);
create policy "Users can update own brand voice" on brand_voice for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own brand voice" on brand_voice for delete using (auth.uid() = user_id);

create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Users can read own ideas" on content_ideas for select using (auth.uid() = user_id);
create policy "Users can insert own ideas" on content_ideas for insert with check (auth.uid() = user_id);
create policy "Users can update own ideas" on content_ideas for update using (auth.uid() = user_id);
create policy "Users can delete own ideas" on content_ideas for delete using (auth.uid() = user_id);

create policy "Users can read own posts" on posts for select using (auth.uid() = user_id);
create policy "Users can insert own posts" on posts for insert with check (auth.uid() = user_id);
create policy "Users can update own posts" on posts for update using (auth.uid() = user_id);

create policy "Users can read own feedback" on post_feedback for select using (auth.uid() = user_id);
create policy "Users can insert own feedback" on post_feedback for insert with check (auth.uid() = user_id);

create policy "Users can read own context" on ai_learning_context for select using (auth.uid() = user_id);
create policy "Users can insert own context" on ai_learning_context for insert with check (auth.uid() = user_id);

create policy "Users can read own images" on image_library for select using (auth.uid() = user_id);
create policy "Users can insert own images" on image_library for insert with check (auth.uid() = user_id);
create policy "Users can update own images" on image_library for update using (auth.uid() = user_id);
