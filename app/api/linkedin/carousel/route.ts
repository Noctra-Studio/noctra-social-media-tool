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
import { readLinkedInSlides, readString, readStringArray } from '@/lib/social-content'
import {
  type BrandVoice,
  formatBrandVoice,
  getGenerationContext,
  parseAnthropicJson,
  saveGeneratedPost,
} from '@/lib/social-server'

type LinkedInCarouselBody = {
  angle?: string
  brand_voice?: Record<string, unknown>
  idea?: string
  pillar_id?: string | null
  post_id?: string
  slide_count?: number
}

type LinkedInCarouselResponse = {
  hashtags?: unknown
  post_caption?: string
  slides?: unknown
}

export async function POST(req: Request) {
  try {
    const { brandVoice: savedBrandVoice, supabase, user } = await getGenerationContext()
    const body = (await req.json()) as LinkedInCarouselBody
    const idea = body.idea?.trim()
    const angle = body.angle?.trim()
    const slideCount = Math.min(15, Math.max(5, Number(body.slide_count) || 8))
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
          .eq('platform', 'linkedin')
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

${getAudiencePrompt(activeAudience, 'linkedin')}

Calibra el lenguaje, los ejemplos y el CTA para esta audiencia específica.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2600,
      system: withUserInputLanguageRule(`Create a LinkedIn document/carousel for Noctra Studio.
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
Slides: ${slideCount}

LinkedIn carousels work as PDF documents. Generate:

Slide 1 (Cover):
- title: string (max 8 words)
- subtitle: string (max 15 words)

Slides 2 to N-1 (Content):
- headline: string (max 6 words)
- content: string (max 50 words)
- stat_or_example: string | null

Last slide (CTA):
- message: string
- handle: '@NoctraStudio'

Also generate:
- post_caption: 100-150 words and include CTA to swipe through
- hashtags: string[] max 5

Return ONLY valid JSON:
{
  "slides": [{ "number": 1, "type": "cover", "title": "string", "subtitle": "string" }],
  "post_caption": "string",
  "hashtags": ["#tag"]
}`,
        },
      ],
    })

    const parsed = parseAnthropicJson<LinkedInCarouselResponse>(message)
    const slides = readLinkedInSlides(parsed.slides)
    const content = {
      hashtags: readStringArray(parsed.hashtags),
      post_caption: readString(parsed.post_caption),
      slides,
    }
    const exportMetadata: ExportMetadata = {
      pdf_generated: false,
      slide_count: slides.length || slideCount,
    }
    const postId = await saveGeneratedPost({
      angle,
      content,
      exportMetadata,
      format: 'document',
      idea,
      pillarId: activePillar?.id || null,
      platform: 'linkedin' satisfies Platform,
      postId: body.post_id,
      userId: user.id,
    })

    return NextResponse.json({
      angle,
      content,
      export_metadata: exportMetadata,
      format: 'document',
      platform: 'linkedin',
      pillar_id: activePillar?.id || null,
      post_id: postId,
      raw: idea,
    })
  } catch (error: unknown) {
    console.error('Error generating LinkedIn carousel:', error)
    const msg = error instanceof Error ? error.message : 'Failed to generate LinkedIn carousel'

    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
