import type Anthropic from '@anthropic-ai/sdk';
import { platforms, type Platform } from '@/lib/product';
import { createClient } from '@/lib/supabase/server';
import type { BrandVoiceRow } from '@/lib/quick-actions/types';
import { getActiveWorkspaceContext } from '@/lib/workspace/server';

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

type SavedIdeaRow = {
  id: string;
};

type SavedPostRow = {
  id: string;
};

export async function getQuickActionContext() {
  const { config, supabase, user, workspace } = await getActiveWorkspaceContext();
  const data = config
    ? {
        example_posts: config.reference_posts ?? [],
        forbidden_words: config.forbidden_words ?? [],
        tone: config.tone_of_voice,
        values: config.brand_values ?? [],
      }
    : null;

  return {
    brandVoice: (data as BrandVoiceRow | null) ?? null,
    supabase,
    user,
    workspace,
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
    return 'Tone: directo y claro. Values: claridad, criterio, resultados. Forbidden words: none. Example posts: none.\n\nVoz de marca — nota editorial:\nNoctra habla desde el presente y desde la experiencia acumulada.\nNo predice el futuro de forma especulativa — señala hacia dónde va la industria\nbasado en lo que ya está ocurriendo. El tono es el de un practicante\nque lleva tiempo en el mercado, no el de un consultor que proyecta desde afuera.';
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
    `\nVoz de marca — nota editorial:\nNoctra habla desde el presente y desde la experiencia acumulada.\nNo predice el futuro de forma especulativa — señala hacia dónde va la industria\nbasado en lo que ya está ocurriendo. El tono es el de un practicante\nque lleva tiempo en el mercado, no el de un consultor que proyecta desde afuera.`,
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
  workspaceId: string,
  ideas: Array<{ platform: Platform; rawIdea: string }>
) {
  const rows = ideas.map((idea) => ({
    platform: idea.platform,
    raw_idea: idea.rawIdea,
    status: 'raw',
    user_id: userId,
    workspace_id: workspaceId,
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
  workspaceId: string,
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
    workspace_id: workspaceId,
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
    created_by: userId,
    content: post.content,
    idea_id: typedIdeas[index]?.id ?? null,
    platform: post.platform,
    status: 'draft',
    user_id: userId,
    workspace_id: workspaceId,
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
