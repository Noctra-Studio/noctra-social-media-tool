import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { buildUserContext } from '@/lib/ai/build-user-context'
import { getAudiencePrompt, getPillarPrompt, type BrandPillar, type PlatformAudience } from '@/lib/brand-strategy'
import type { Platform } from '@/lib/product'
import type { ExportMetadata, PostFormat } from '@/lib/social-content'
import {
  estimateReadTime,
  getDefaultFormat,
  inferPostFormat,
  readString,
  readStringArray,
} from '@/lib/social-content'
import {
  type BrandVoice,
  formatBrandVoice,
  getGenerationContext,
  parseAnthropicJson,
  saveGeneratedPost,
} from '@/lib/social-server'

type GenerateBody = {
  angle?: string
  brand_voice?: Record<string, unknown>
  format?: PostFormat
  idea?: string
  pillar_id?: string | null
  platform?: Platform
  post_id?: string
}

type GeneratedPayload = {
  content: Record<string, unknown>
  exportMetadata: ExportMetadata
  format: PostFormat
}

function getInstagramSinglePrompt(idea: string, angle: string, brandVoice: string, strategyContext: string) {
  return {
    system: `You are the lead content strategist for Noctra Studio, a boutique digital agency in Queretaro, Mexico.
Brand voice:
${brandVoice}

${strategyContext}

Language: Spanish (LATAM).
Output only valid JSON.`,
    prompt: `Create an Instagram single-image post.

Idea: ${idea}
Angle: ${angle}

Rules:
- Caption max 150 words.
- 5-8 hashtags, relevant and non-generic.
- Strong first line.
- CTA at the end.
- Also return visual_direction describing the best supporting image in one sentence.

Return ONLY valid JSON:
{
  "caption": "string",
  "hashtags": ["#tag"],
  "visual_direction": "string"
}`,
  }
}

function getLinkedInPrompt(
  idea: string,
  angle: string,
  brandVoice: string,
  format: PostFormat,
  strategyContext: string
) {
  const visualDirectionRule =
    format === 'image'
      ? `Also generate:
- visual_direction: string describing the ideal image for this post. Consider professional, minimal, dark tones preferred. The image should complement without competing with the text.`
      : ''

  return {
    system: `You are writing for LinkedIn on behalf of Noctra Studio, a boutique digital agency in Queretaro, Mexico.
Brand voice:
${brandVoice}

${strategyContext}

Language: Spanish (LATAM).
Tone: practitioner, direct, useful, not corporate.
Output only valid JSON.`,
    prompt: `Write a LinkedIn post.

Idea: ${idea}
Angle: ${angle}

Rules:
- 150-250 words.
- Paragraphs of 1-3 sentences.
- Max 5 hashtags.
- Thought-leadership tone grounded in execution.
${visualDirectionRule}

Return ONLY valid JSON:
{
  "caption": "string",
  "hashtags": ["#tag"],
  ${format === 'image' ? '"visual_direction": "string"' : '"visual_direction": ""'}
}`,
  }
}

function getXTweetPrompt(idea: string, angle: string, brandVoice: string, strategyContext: string) {
  return {
    system: `You are writing a single tweet for Manu, founder of Noctra Studio in Queretaro, Mexico.
Brand voice:
${brandVoice}

${strategyContext}

Language: Spanish (LATAM).
Output only valid JSON.`,
    prompt: `Write one publication-ready tweet for X.

Idea: ${idea}
Angle: ${angle}

Rules:
- Max 270 characters.
- No hashtags unless truly necessary.
- Tight, punchy, specific.
- No em dash.

Return ONLY valid JSON:
{
  "tweet": "string",
  "char_count": 123
}`,
  }
}

function buildPlatformPrompt(params: {
  angle: string
  brandVoice: string
  format: PostFormat
  idea: string
  platform: Platform
  strategyContext: string
}) {
  const { angle, brandVoice, format, idea, platform, strategyContext } = params

  if (platform === 'instagram') {
    return getInstagramSinglePrompt(idea, angle, brandVoice, strategyContext)
  }

  if (platform === 'linkedin') {
    return getLinkedInPrompt(idea, angle, brandVoice, format, strategyContext)
  }

  return getXTweetPrompt(idea, angle, brandVoice, strategyContext)
}

function normalizeGeneratedPayload(platform: Platform, requestedFormat: PostFormat, content: Record<string, unknown>) {
  const inferredFormat = inferPostFormat(platform, content, requestedFormat)

  if (platform === 'x' && inferredFormat === 'tweet') {
    const tweet = readString(content.tweet) || readString(content.caption)

    return {
      content: {
        char_count: tweet.length,
        tweet,
      },
      exportMetadata: {},
      format: inferredFormat,
    } satisfies GeneratedPayload
  }

  if (platform === 'linkedin' && (inferredFormat === 'text' || inferredFormat === 'image')) {
    const caption = readString(content.caption)
    const hashtags = readStringArray(content.hashtags)
    const visualDirection = readString(content.visual_direction)
    const readTime = estimateReadTime(caption)

    return {
      content: {
        caption,
        hashtags,
        ...(visualDirection ? { visual_direction: visualDirection } : {}),
      },
      exportMetadata: {
        read_time_minutes: readTime,
        word_count: caption.trim().split(/\s+/).filter(Boolean).length,
      },
      format: inferredFormat,
    } satisfies GeneratedPayload
  }

  return {
    content,
    exportMetadata: {},
    format: inferredFormat,
  } satisfies GeneratedPayload
}

export async function POST(req: Request) {
  try {
    const { brandVoice: savedBrandVoice, supabase, user } = await getGenerationContext()
    const body = (await req.json()) as GenerateBody
    const idea = body.idea?.trim()
    const platform = body.platform
    const angle = body.angle?.trim()

    if (!idea || !platform || !angle) {
      return NextResponse.json({ error: 'Missing idea, platform, or angle' }, { status: 400 })
    }

    const format = body.format ?? getDefaultFormat(platform)
    const selectedPillarId = body.pillar_id?.trim() || null
    const customBrandVoice: BrandVoice | null =
      body.brand_voice && Object.keys(body.brand_voice).length > 0
        ? (body.brand_voice as BrandVoice)
        : savedBrandVoice
    const [{ data: pillars, error: pillarsError }, { data: audience, error: audienceError }] =
      await Promise.all([
        supabase
          .from('brand_pillars')
          .select('id, name, description, color, post_count, sort_order')
          .eq('user_id', user.id)
          .order('sort_order', { ascending: true }),
        supabase
          .from('platform_audiences')
          .select('id, platform, audience_description, pain_points, desired_outcomes, language_level, updated_at')
          .eq('user_id', user.id)
          .eq('platform', platform)
          .maybeSingle(),
      ])

    if (pillarsError || audienceError) {
      throw pillarsError || audienceError
    }

    const activePillar =
      ((pillars as BrandPillar[] | null) || []).find((pillar) => pillar.id === selectedPillarId) || null
    const activeAudience = (audience as PlatformAudience | null) ?? null

    const context = await buildUserContext(user.id, platform)
    const learningInjection =
      context.total_posts_generated >= 5
        ? `
Context from previous posts:
- Top performing references: ${context.top_performing_posts
            .map((post) => (typeof post.content === 'object' && post.content ? readString((post.content as Record<string, unknown>).caption) : ''))
            .filter(Boolean)
            .join(' | ') || 'none'}
- Avoided patterns: ${context.avoided_patterns.join(', ') || 'none'}
- Style notes: ${context.style_notes.join(', ') || 'none'}
- Recent topics to avoid repeating: ${context.recent_topics.join(', ') || 'none'}`
        : ''
    const strategyContext = `${getPillarPrompt(activePillar)}

${getAudiencePrompt(activeAudience, platform)}

Calibra el lenguaje, ejemplos, y CTA del post para esta audiencia específica. Un post para LinkedIn (directores) debe sonar diferente al mismo tema en Instagram (dueños de PYME sin formación técnica).`

    const promptPayload = buildPlatformPrompt({
      angle,
      brandVoice: `${formatBrandVoice(customBrandVoice)}${learningInjection}`,
      format,
      idea,
      platform,
      strategyContext,
    })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1400,
      system: promptPayload.system,
      messages: [{ role: 'user', content: promptPayload.prompt }],
    })

    const parsed = parseAnthropicJson<Record<string, unknown>>(message)
    const normalized = normalizeGeneratedPayload(platform, format, parsed)
    const postId = await saveGeneratedPost({
      angle,
      content: normalized.content,
      exportMetadata: normalized.exportMetadata,
      format: normalized.format,
      idea,
      pillarId: activePillar?.id || null,
      platform,
      postId: body.post_id,
      userId: user.id,
    })

    return NextResponse.json({
      angle,
      content: normalized.content,
      export_metadata: normalized.exportMetadata,
      format: normalized.format,
      platform,
      pillar_id: activePillar?.id || null,
      post_id: postId,
      raw: idea,
    })
  } catch (error: unknown) {
    console.error('Error generating content:', error)
    const msg = error instanceof Error ? error.message : 'Failed to generate content'

    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
