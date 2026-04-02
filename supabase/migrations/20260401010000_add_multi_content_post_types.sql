do $$
begin
  if to_regclass('public.posts') is null then
    raise exception 'Missing table public.posts. Run the base schema migrations first.';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'post_type'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.post_type as enum (
      'single_post',
      'carousel',
      'thread',
      'article',
      'slides'
    );
  end if;
end $$;

alter type public.post_type add value if not exists 'single_post';
alter type public.post_type add value if not exists 'carousel';
alter type public.post_type add value if not exists 'thread';
alter type public.post_type add value if not exists 'article';
alter type public.post_type add value if not exists 'slides';

alter table public.posts
  add column if not exists post_type public.post_type,
  add column if not exists thread_items jsonb,
  add column if not exists article_data jsonb,
  add column if not exists carousel_slides jsonb,
  add column if not exists slides_data jsonb;

alter table public.posts
  alter column post_type set default 'single_post'::public.post_type;

update public.posts
set post_type = case
  when platform = 'instagram' and (format = 'carousel' or jsonb_typeof(content -> 'slides') = 'array') then 'carousel'::public.post_type
  when platform = 'x' and (format = 'thread' or jsonb_typeof(content -> 'tweets') = 'array' or jsonb_typeof(content -> 'thread') = 'array') then 'thread'::public.post_type
  when platform = 'x' and (format = 'article' or (coalesce(content ->> 'title', '') <> '' and coalesce(content ->> 'body', '') <> '')) then 'article'::public.post_type
  when platform = 'linkedin' and (format in ('document', 'carousel') or jsonb_typeof(content -> 'slides') = 'array') then 'slides'::public.post_type
  else 'single_post'::public.post_type
end
where post_type is null;

update public.posts
set thread_items = (
  select coalesce(
    jsonb_agg(
      jsonb_strip_nulls(
        jsonb_build_object(
          'id', coalesce(item ->> 'id', 'tweet-' || ordinality::text),
          'text', case
            when jsonb_typeof(item) = 'string' then trim(both '"' from item::text)
            else coalesce(item ->> 'content', item ->> 'text', '')
          end,
          'media_url', case when jsonb_typeof(item) = 'object' then item ->> 'media_url' else null end,
          'media_source', case when jsonb_typeof(item) = 'object' then item ->> 'media_source' else null end
        )
      )
      order by ordinality
    ),
    '[]'::jsonb
  )
  from jsonb_array_elements(coalesce(content -> 'tweets', content -> 'thread', '[]'::jsonb)) with ordinality as thread(item, ordinality)
)
where post_type = 'thread'::public.post_type
  and thread_items is null;

update public.posts
set article_data = jsonb_strip_nulls(
  jsonb_build_object(
    'cover_image', content ->> 'cover_image',
    'cover_image_source', content ->> 'cover_image_source',
    'title', content ->> 'title',
    'subtitle', content ->> 'subtitle',
    'body_markdown', content ->> 'body'
  )
)
where post_type = 'article'::public.post_type
  and article_data is null;

update public.posts
set carousel_slides = (
  select coalesce(
    jsonb_agg(
      jsonb_strip_nulls(
        jsonb_build_object(
          'id', coalesce(slide ->> 'id', 'slide-' || coalesce(slide ->> 'slide_number', ordinality::text)),
          'image_url', matched.background ->> 'image_url',
          'image_source', matched.background ->> 'image_source',
          'caption', coalesce(nullif(slide ->> 'headline', ''), nullif(slide ->> 'body', ''))
        )
      )
      order by ordinality
    ),
    '[]'::jsonb
  )
  from jsonb_array_elements(coalesce(content -> 'slides', '[]'::jsonb)) with ordinality as slides(slide, ordinality)
  left join lateral (
    select bg.background
    from jsonb_array_elements(coalesce(export_metadata -> 'slide_backgrounds', '[]'::jsonb)) as bg(background)
    where coalesce(bg.background ->> 'slide_number', ordinality::text) = coalesce(slide ->> 'slide_number', ordinality::text)
    limit 1
  ) matched on true
)
where post_type = 'carousel'::public.post_type
  and carousel_slides is null;

update public.posts
set slides_data = (
  select coalesce(
    jsonb_agg(
      jsonb_strip_nulls(
        jsonb_build_object(
          'id', coalesce(slide ->> 'id', 'slide-' || coalesce(slide ->> 'number', ordinality::text)),
          'title', coalesce(nullif(slide ->> 'title', ''), nullif(slide ->> 'headline', ''), 'Slide ' || coalesce(slide ->> 'number', ordinality::text)),
          'body', coalesce(nullif(slide ->> 'content', ''), nullif(slide ->> 'message', ''), nullif(slide ->> 'subtitle', ''), ''),
          'image_url', slide ->> 'image_url',
          'image_source', slide ->> 'image_source'
        )
      )
      order by ordinality
    ),
    '[]'::jsonb
  )
  from jsonb_array_elements(coalesce(content -> 'slides', '[]'::jsonb)) with ordinality as slides(slide, ordinality)
)
where post_type = 'slides'::public.post_type
  and slides_data is null;

create index if not exists idx_posts_post_type on public.posts(post_type);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  10485760,
  array['image/avif', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;
