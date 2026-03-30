import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { withUserInputLanguageRule } from '@/lib/ai/language-rule'
import {
  getAudiencePrompt,
  getPillarPrompt,
  isMissingStrategyTablesError,
  type BrandPillar,
  type PlatformAudience,
} from '@/lib/brand-strategy'
import type { Platform } from '@/lib/product'
import type { ExportMetadata } from '@/lib/social-content'
import { readInstagramSlides, readString, readStringArray } from '@/lib/social-content'
import {
  type BrandVoice,
  formatBrandVoice,
  getGenerationContext,
  parseAnthropicJson,
  saveGeneratedPost,
} from '@/lib/social-server'

type CarouselBody = {
  angle?: string
  brand_voice?: Record<string, unknown>
  idea?: string
  include_cover?: boolean
  include_cta?: boolean
  pillar_id?: string | null
  post_id?: string
  slide_count?: number
}

type CarouselResponse = {
  audio_mood?: string
  caption?: string
  hashtags?: unknown
  slides?: unknown
}

export async function POST(req: Request) {
  try {
    const { brandVoice: savedBrandVoice, supabase, user } = await getGenerationContext()
    const body = (await req.json()) as CarouselBody
    const idea = body.idea?.trim()
    const angle = body.angle?.trim()
    const slideCount = Math.min(10, Math.max(3, Number(body.slide_count) || 5))
    const includeCover = body.include_cover ?? true
    const includeCta = body.include_cta ?? true
    const selectedPillarId = body.pillar_id?.trim() || null

    if (!idea || !angle) {
      return NextResponse.json({ error: 'Missing idea or angle' }, { status: 400 })
    }

    const brandVoice: BrandVoice | null =
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
          .eq('platform', 'instagram')
          .maybeSingle(),
      ])

    if (
      (pillarsError && !isMissingStrategyTablesError(pillarsError)) ||
      (audienceError && !isMissingStrategyTablesError(audienceError))
    ) {
      throw pillarsError || audienceError
    }

    const activePillar =
      ((pillars as BrandPillar[] | null) || []).find((pillar) => pillar.id === selectedPillarId) || null
    const activeAudience = (audience as PlatformAudience | null) ?? null
    const strategyContext = `${getPillarPrompt(activePillar)}

${getAudiencePrompt(activeAudience, 'instagram')}

Calibra el lenguaje, los ejemplos y el CTA para esta audiencia específica.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2200,
      system: withUserInputLanguageRule(`You are creating an Instagram carousel for Noctra Studio, a boutique digital agency in Queretaro, Mexico.
Brand voice:
${formatBrandVoice(brandVoice)}

${strategyContext}

Language: Spanish (LATAM).
Return only valid JSON.`),
      messages: [
        {
          role: 'user',
          content: `Idea: ${idea}
Angle: ${angle}
Total slides: ${slideCount}
Include cover slide: ${includeCover}
Include CTA slide: ${includeCta}

Generate each slide with:
- slide_number: number
- type: 'cover' | 'content' | 'cta'
- headline: string (max 8 words)
- body: string (max 30 words)
- visual_direction: string
- design_note: string using Noctra palette (#101417, #212631, #E0E5EB, #462D6E)

Also generate:
- caption: full Instagram caption for the post (max 150 words, 5-8 hashtags)
- hashtags: string[]
- audio_mood: string

Return ONLY valid JSON:
{
  "slides": [{ "slide_number": 1, "type": "cover", "headline": "string", "body": "string", "visual_direction": "string", "design_note": "string" }],
  "caption": "string",
  "hashtags": ["#tag"],
  "audio_mood": "string"
}`,
        },
      ],
    })

    const parsed = parseAnthropicJson<CarouselResponse>(message)
    const slides = readInstagramSlides(parsed.slides)
    const content = {
      audio_mood: readString(parsed.audio_mood),
      caption: readString(parsed.caption),
      hashtags: readStringArray(parsed.hashtags),
      slides,
    }
    const exportMetadata: ExportMetadata = {
      include_cover: includeCover,
      include_cta: includeCta,
      slide_count: slides.length || slideCount,
    }
    const postId = await saveGeneratedPost({
      angle,
      content,
      exportMetadata,
      format: 'carousel',
      idea,
      pillarId: activePillar?.id || null,
      platform: 'instagram' satisfies Platform,
      postId: body.post_id,
      userId: user.id,
    })

    return NextResponse.json({
      angle,
      content,
      export_metadata: exportMetadata,
      format: 'carousel',
      platform: 'instagram',
      pillar_id: activePillar?.id || null,
      post_id: postId,
      raw: idea,
    })
  } catch (error: unknown) {
    console.error('Error generating Instagram carousel:', error)
    const msg = error instanceof Error ? error.message : 'Failed to generate Instagram carousel'

    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
