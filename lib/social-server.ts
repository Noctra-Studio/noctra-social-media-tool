import type Anthropic from '@anthropic-ai/sdk'
import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import type { Platform } from '@/lib/product'
import type { ExportMetadata, PostFormat } from '@/lib/social-content'

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
  const user = await getUser()
  const supabase = await createClient()
  const { data, error } = await supabase.from('brand_voice').select('*').limit(1).maybeSingle()

  if (error) {
    throw error
  }

  return {
    brandVoice: (data as BrandVoice | null) ?? null,
    supabase,
    user,
  }
}

export function formatBrandVoice(brandVoice: BrandVoice | null) {
  if (!brandVoice) {
    return [
      'Tone: directo, moderno, seguro.',
      'Values: claridad, criterio, resultados.',
      'Forbidden words: none.',
      'Example posts: none.',
    ].join('\n')
  }

  return [
    `Tone: ${brandVoice.tone || 'directo, moderno, seguro'}`,
    `Values: ${brandVoice.values?.length ? brandVoice.values.join(', ') : 'claridad, criterio, resultados'}`,
    `Forbidden words: ${brandVoice.forbidden_words?.length ? brandVoice.forbidden_words.join(', ') : 'none'}`,
    `Example posts: ${brandVoice.example_posts?.length ? brandVoice.example_posts.join(' | ') : 'none'}`,
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
  exportMetadata?: ExportMetadata
  format: PostFormat
  idea: string
  pillarId?: string | null
  platform: Platform
  postId?: string | null
  userId: string
}) {
  const { angle, content, exportMetadata, format, idea, pillarId, platform, postId, userId } = params
  const supabase = await createClient()

  if (postId) {
    const { data, error } = await supabase
      .from('posts')
      .update({
        angle,
        content,
        export_metadata: exportMetadata ?? {},
        format,
        pillar_id: pillarId ?? null,
        platform,
        status: 'generated',
      })
      .eq('id', postId)
      .eq('user_id', userId)
      .select('id')
      .single()

    if (error || !data) {
      throw error || new Error('No fue posible actualizar el post generado')
    }

    return (data as SavedPostRow).id
  }

  const { data, error } = await supabase
    .from('posts')
    .insert([
      {
        angle,
        content,
        export_metadata: exportMetadata ?? {},
        format,
        pillar_id: pillarId ?? null,
        platform,
        status: 'generated',
        user_id: userId,
      },
    ])
    .select('id')
    .single()

  if (error || !data) {
    throw error || new Error(`No fue posible guardar el resultado generado para: ${idea}`)
  }

  return (data as SavedPostRow).id
}
