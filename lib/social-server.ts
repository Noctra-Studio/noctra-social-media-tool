import type Anthropic from '@anthropic-ai/sdk'
import {
  buildStructuredPostFields,
  isMissingStructuredPostColumnError,
  omitStructuredPostFields,
} from '@/lib/post-records'
import { createClient } from '@/lib/supabase/server'
import type { Platform } from '@/lib/product'
import type { ExportMetadata, PostFormat } from '@/lib/social-content'
import { getActiveWorkspaceContext } from '@/lib/workspace/server'

export type BrandVoice = {
  example_posts?: string[]
  forbidden_words?: string[]
  tone?: string
  values?: string[]
}

type SavedPostRow = {
  id: string
}

export async function getGenerationContext() {
  const { config, supabase, user, workspace } = await getActiveWorkspaceContext()
  const data = config
    ? {
        example_posts: config.reference_posts ?? [],
        forbidden_words: config.forbidden_words ?? [],
        tone: config.tone_of_voice,
        values: config.brand_values ?? [],
      }
    : null

  return {
    brandVoice: (data as BrandVoice | null) ?? null,
    supabase,
    user,
    workspace,
  }
}

export function formatBrandVoice(brandVoice: BrandVoice | null) {
  if (!brandVoice) {
    return [
      'Tone: directo, moderno, seguro.',
      'Values: claridad, criterio, resultados.',
      'Forbidden words: none.',
      'Example posts: none.',
      '\nVoz de marca — nota editorial:\nNoctra habla desde el presente y desde la experiencia acumulada.\nNo predice el futuro de forma especulativa — señala hacia dónde va la industria\nbasado en lo que ya está ocurriendo. El tono es el de un practicante\nque lleva tiempo en el mercado, no el de un consultor que proyecta desde afuera.',
    ].join('\n')
  }

  return [
    `Tone: ${brandVoice.tone || 'directo, moderno, seguro'}`,
    `Values: ${brandVoice.values?.length ? brandVoice.values.join(', ') : 'claridad, criterio, resultados'}`,
    `Forbidden words: ${brandVoice.forbidden_words?.length ? brandVoice.forbidden_words.join(', ') : 'none'}`,
    `Example posts: ${brandVoice.example_posts?.length ? brandVoice.example_posts.join(' | ') : 'none'}`,
    `\nVoz de marca — nota editorial:\nNoctra habla desde el presente y desde la experiencia acumulada.\nNo predice el futuro de forma especulativa — señala hacia dónde va la industria\nbasado en lo que ya está ocurriendo. El tono es el de un practicante\nque lleva tiempo en el mercado, no el de un consultor que proyecta desde afuera.`,
  ].join('\n')
}

export function parseAnthropicJson<T>(message: Anthropic.Messages.Message) {
  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim()

  if (!text) {
    throw new Error('Anthropic returned an empty response')
  }

  const cleaned = text
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim()

  return JSON.parse(cleaned) as T
}

export async function saveGeneratedPost(params: {
  angle: string
  content: Record<string, unknown>
  createdBy?: string | null
  exportMetadata?: ExportMetadata
  format: PostFormat
  idea: string
  pillarId?: string | null
  platform: Platform
  postId?: string | null
  userId: string
  workspaceId?: string | null
}) {
  const {
    angle,
    content,
    createdBy,
    exportMetadata,
    format,
    idea,
    pillarId,
    platform,
    postId,
    userId,
    workspaceId,
  } = params
  const supabase = await createClient()
  const structuredFields = buildStructuredPostFields({
    content,
    export_metadata: exportMetadata,
    format,
    platform,
  })
  const postPayload = {
    angle,
    article_data: structuredFields.article_data,
    carousel_slides: structuredFields.carousel_slides,
    content,
    export_metadata: exportMetadata ?? {},
    format,
    image_url: structuredFields.image_url,
    pillar_id: pillarId ?? null,
    platform,
    post_type: structuredFields.post_type,
    slides_data: structuredFields.slides_data,
    thread_items: structuredFields.thread_items,
  }

  if (postId) {
    let { data, error } = await supabase
      .from('posts')
      .update({
        ...postPayload,
        ...(workspaceId ? { workspace_id: workspaceId } : {}),
        status: 'generated',
      })
      .eq('id', postId)
      .eq('user_id', userId)
      .select('id')
      .single()

    if (error && isMissingStructuredPostColumnError(error)) {
      const fallback = await supabase
        .from('posts')
        .update({
          ...omitStructuredPostFields(postPayload),
          ...(workspaceId ? { workspace_id: workspaceId } : {}),
          status: 'generated',
        })
        .eq('id', postId)
        .eq('user_id', userId)
        .select('id')
        .single()

      data = fallback.data
      error = fallback.error
    }

    if (error || !data) {
      throw error || new Error('No fue posible actualizar el post generado')
    }

    return (data as SavedPostRow).id
  }

  let { data, error } = await supabase
    .from('posts')
    .insert([
      {
        ...postPayload,
        created_by: createdBy ?? userId,
        status: 'generated',
        user_id: userId,
        ...(workspaceId ? { workspace_id: workspaceId } : {}),
      },
    ])
    .select('id')
    .single()

  if (error && isMissingStructuredPostColumnError(error)) {
    const fallback = await supabase
      .from('posts')
      .insert([
        {
          ...omitStructuredPostFields(postPayload),
          created_by: createdBy ?? userId,
          status: 'generated',
          user_id: userId,
          ...(workspaceId ? { workspace_id: workspaceId } : {}),
        },
      ])
      .select('id')
      .single()

    data = fallback.data
    error = fallback.error
  }

  if (error || !data) {
    throw error || new Error(`No fue posible guardar el resultado generado para: ${idea}`)
  }

  return (data as SavedPostRow).id
}
