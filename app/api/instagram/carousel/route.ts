import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { buildUserContext } from '@/lib/ai/build-user-context'
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
import {
  fetchMarketIntelligence,
  formatMarketSignalsForPrompt,
} from '@/lib/ai/market-intelligence'
import { getNoctraPositioningPrompt } from '@/lib/ai/noctra-positioning'

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

    const [context, marketContext] = await Promise.allSettled([
      buildUserContext(user.id, 'instagram'),
      fetchMarketIntelligence(idea, 'instagram'),
    ])

    const userCtx = context.status === 'fulfilled'
      ? context.value
      : {
          top_performing_posts: [],
          avoided_patterns: [],
          style_notes: [],
          recent_topics: [],
          total_posts_generated: 0,
          editorial_principles: '',
        }

    const marketSignals = marketContext.status === 'fulfilled'
      ? formatMarketSignalsForPrompt(marketContext.value)
      : ''

    const learningInjection = `
${getNoctraPositioningPrompt(idea)}
${userCtx.editorial_principles ?? ''}
${marketSignals}
${userCtx.total_posts_generated >= 5 ? `
## CONTEXTO DE POSTS ANTERIORES
- Referencias de alto rendimiento: ${userCtx.top_performing_posts
    .map(p => typeof p.content === 'object' && p.content
      ? readString((p.content as Record<string,unknown>).caption)
      : '')
    .filter(Boolean)
    .slice(0, 2)
    .join(' | ') || 'ninguno aún'}
- Patrones a evitar (basado en historial): ${userCtx.avoided_patterns.join(', ') || 'ninguno'}
- Notas de estilo: ${userCtx.style_notes.join(', ') || 'ninguna'}
- Temas recientes (no repetir): ${userCtx.recent_topics.slice(0, 5).join(', ') || 'ninguno'}
` : ''}
`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2200,
      system: withUserInputLanguageRule(`You are creating an Instagram carousel for Noctra Studio, a boutique digital agency in Queretaro, Mexico.
Brand voice:
${formatBrandVoice(brandVoice)}

${strategyContext}

${learningInjection}

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
- headline: string (STRICT MAX 32 chars - MUST fit in one or two lines)
- body: string (STRICT MAX 80 chars - NO paragraphs, just punchy sentences)
- visual_direction: string
- design_note: string using Noctra palette (#101417, #212631, #E0E5EB, #462D6E)
- stat_or_example: (optional) short metric or highlight (max 5 words)
- bg_type: 'image' | 'gradient' | 'solid'
- bg_reasoning: string
- unsplash_query: string | null
- color_suggestion: string | null
- suggested_template: 'editorial' | 'bold-statement' | 'split' | 'list' | 'stat-hero' | 'minimal-quote'

Suggest background type based on content and emotion:

- Use 'image' when content is narrative, human, or benefits from real-world visual context.
- Use 'gradient' when you want to create mood or energy that pure color can't achieve alone.
- Use 'solid' when typography is the hero.

Suggest a layout template for each slide:
- editorial     -> Large headline, minimal body, offset layout.
- bold-statement -> Massive centered headline, high impact.
- split         -> Text vs Visual (balanced 50/50 look).
- list          -> Clean bullet points with icons/numbers.
- stat-hero     -> Large number/metric as the focal point.
- minimal-quote -> Atmospheric, breathable, small text. (Use for philosophical or high-level quotes).

CRITICAL: Content MUST be extremely concise. Instagram users scan quickly. Avoid filler words. Every word must earn its place.

Provide color_suggestion as HEX colors matching "Premium Noctra" (Deep purples, dark greys, emerald accents).

Return ONLY valid JSON:
{
  "slides": [{ 
    "slide_number": 1, 
    "type": "cover", 
    "headline": "string", 
    "body": "string", 
    "visual_direction": "string", 
    "design_note": "string", 
    "stat_or_example": "string",
    "bg_type": "image",
    "bg_reasoning": "string",
    "unsplash_query": "string",
    "color_suggestion": "#0A1628,#1E3A5F",
    "suggested_template": "editorial"
  }],
  "caption": "string",
  "hashtags": ["#tag"]
}`,
        },
      ],
    })

    const parsed = parseAnthropicJson<CarouselResponse>(message)
    const slides = readInstagramSlides(parsed.slides)
    const content = {
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
