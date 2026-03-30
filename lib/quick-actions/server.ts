import type Anthropic from '@anthropic-ai/sdk';
import { getUser } from '@/lib/auth/get-user';
import { platforms, type Platform } from '@/lib/product';
import { createClient } from '@/lib/supabase/server';
import type { BrandVoiceRow } from '@/lib/quick-actions/types';

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

type SavedIdeaRow = {
  id: string;
};

type SavedPostRow = {
  id: string;
};

export async function getQuickActionContext() {
  const user = await getUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from('brand_voice').select('*').limit(1).maybeSingle();

  if (error) {
    throw error;
  }

  return {
    brandVoice: (data as BrandVoiceRow | null) ?? null,
    supabase,
    user,
  };
}

export function asPlatform(value: unknown): Platform | null {
  return typeof value === 'string' && platforms.includes(value as Platform)
    ? (value as Platform)
    : null;
}

export function readStringList(value: string[] | string | null | undefined) {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function formatBrandVoice(brandVoice: BrandVoiceRow | null) {
  if (!brandVoice) {
    return 'Tone: directo y claro. Values: claridad, criterio, resultados. Forbidden words: none. Example posts: none.';
  }

  const values = readStringList(brandVoice.values);
  const forbiddenWords = readStringList(brandVoice.forbidden_words);
  const examplePosts = Array.isArray(brandVoice.example_posts)
    ? brandVoice.example_posts.filter((item) => item.trim().length > 0)
    : [];

  return [
    `Tone: ${brandVoice.tone || 'directo y claro'}`,
    `Values: ${values.length > 0 ? values.join(', ') : 'claridad, criterio, resultados'}`,
    `Forbidden words: ${forbiddenWords.length > 0 ? forbiddenWords.join(', ') : 'none'}`,
    `Example posts: ${examplePosts.length > 0 ? examplePosts.join(' | ') : 'none'}`,
  ].join('\n');
}

export function formatPostContentForPrompt(content: unknown) {
  if (!content || typeof content !== 'object') {
    return '';
  }

  const maybeContent = content as { caption?: unknown; hashtags?: unknown; thread?: unknown };
  const caption = typeof maybeContent.caption === 'string' ? maybeContent.caption : '';
  const hashtags = Array.isArray(maybeContent.hashtags)
    ? maybeContent.hashtags.filter((item): item is string => typeof item === 'string').join(' ')
    : '';
  const thread = Array.isArray(maybeContent.thread)
    ? maybeContent.thread.filter((item): item is string => typeof item === 'string').join('\n\n')
    : '';

  return [caption, thread, hashtags].filter(Boolean).join('\n\n');
}

export function parseAnthropicJson<T>(message: Anthropic.Messages.Message) {
  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

  if (!text) {
    throw new Error('Anthropic returned an empty response');
  }

  return JSON.parse(text) as T;
}

export async function saveRawIdeas(
  supabase: ServerSupabase,
  userId: string,
  ideas: Array<{ platform: Platform; rawIdea: string }>
) {
  const rows = ideas.map((idea) => ({
    platform: idea.platform,
    raw_idea: idea.rawIdea,
    status: 'raw',
    user_id: userId,
  }));

  const { data, error } = await supabase.from('content_ideas').insert(rows).select('id');

  if (error) {
    throw error;
  }

  return (data as SavedIdeaRow[] | null) ?? [];
}

export async function saveDraftPosts(
  supabase: ServerSupabase,
  userId: string,
  posts: Array<{
    angle: string;
    content: Record<string, unknown>;
    ideaText: string;
    platform: Platform;
  }>
) {
  const ideaRows = posts.map((post) => ({
    platform: post.platform,
    raw_idea: post.ideaText,
    status: 'drafted',
    user_id: userId,
  }));

  const { data: createdIdeas, error: ideasError } = await supabase
    .from('content_ideas')
    .insert(ideaRows)
    .select('id');

  if (ideasError) {
    throw ideasError;
  }

  const typedIdeas = (createdIdeas as SavedIdeaRow[] | null) ?? [];

  const postRows = posts.map((post, index) => ({
    angle: post.angle,
    content: post.content,
    idea_id: typedIdeas[index]?.id ?? null,
    platform: post.platform,
    status: 'draft',
    user_id: userId,
  }));

  const { data: createdPosts, error: postsError } = await supabase
    .from('posts')
    .insert(postRows)
    .select('id');

  if (postsError) {
    throw postsError;
  }

  return (createdPosts as SavedPostRow[] | null) ?? [];
}
