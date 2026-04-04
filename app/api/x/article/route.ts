import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { withUserInputLanguageRule } from '@/lib/ai/language-rule'
import { buildTemporalContext, buildLatamGeoContext, buildNoctraIndustryContext } from '@/lib/ai/temporal-context'
import {
  getAudiencePrompt,
  getPillarPrompt,
  isMissingStrategyTablesError,
  type BrandPillar,
  type PlatformAudience,
} from '@/lib/brand-strategy'
import type { Platform } from '@/lib/product'
import type { ExportMetadata } from '@/lib/social-content'
import { estimateReadTime, readString } from '@/lib/social-content'
import {
  type BrandVoice,
  formatBrandVoice,
  getGenerationContext,
  parseAnthropicJson,
  saveGeneratedPost,
} from '@/lib/social-server'

type ArticleBody = {
  angle?: string
  brand_voice?: Record<string, unknown>
  idea?: string
  pillar_id?: string | null
  post_id?: string
}

type ArticleResponse = {
  body?: string
  read_time_minutes?: number
  subtitle?: string
  title?: string
  word_count?: number
}

export async function POST(req: Request) {
  try {
    const { brandVoice: savedBrandVoice, supabase, user, workspace } = await getGenerationContext()
    if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 401 })
    const body = (await req.json()) as ArticleBody
    const idea = body.idea?.trim()
    const angle = body.angle?.trim()
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
          .eq('platform', 'x')
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

${getAudiencePrompt(activeAudience, 'x')}

Calibra el lenguaje, los ejemplos y el CTA para esta audiencia específica.`

    const temporalClosingInstruction = `
INSTRUCCIÓN FINAL — TIEMPO:
Antes de escribir este post, confirma mentalmente:
- ¿Estoy usando el año actual (${new Date().getFullYear()}) como presente? ✓
- ¿Estoy usando el año pasado (${new Date().getFullYear() - 1}) solo como historia
  o contraste, nunca como presente o futuro? ✓
- ¿Mis proyecciones usan horizonte relativo ("próximos meses", "para ${new Date().getFullYear() + 1}")
  y no años que ya pasaron? ✓
Si cualquier respuesta es NO — reescribe esa parte antes de responder.
`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2600,
      system: withUserInputLanguageRule([
        buildTemporalContext(),
        buildLatamGeoContext(),
        buildNoctraIndustryContext(),
        `Write a long-form X Article for Noctra Studio.
Audience: comunidad tech, emprendedores y profesionales digitales en
México/LATAM. Más abierta a opiniones directas y datos concretos.
El humor es válido si es seco e inteligente — no forzado.
Brand voice:
${formatBrandVoice(brandVoice)}

${strategyContext}

Language: Spanish (LATAM).
Use markdown formatting.
Return only valid JSON.`,
        temporalClosingInstruction,
      ].join('\n\n')),
      messages: [
        {
          role: 'user',
          content: `Idea: ${idea}
Angle: ${angle}

Structure:
- Title: punchy, max 10 words
- Subtitle: 1 sentence expanding the title
- Introduction: 2-3 paragraphs
- Body: 3-5 sections with ## subheadings
- Conclusion: insight + what the reader should do now
- Total length: 600-900 words

Return ONLY valid JSON:
{
  "title": "string",
  "subtitle": "string",
  "body": "markdown string",
  "word_count": 700,
  "read_time_minutes": 4
}`,
        },
      ],
    })

    const parsed = parseAnthropicJson<ArticleResponse>(message)
    const bodyText = readString(parsed.body)
    const wordCount =
      typeof parsed.word_count === 'number'
        ? parsed.word_count
        : bodyText.trim().split(/\s+/).filter(Boolean).length
    const readTime =
      typeof parsed.read_time_minutes === 'number'
        ? parsed.read_time_minutes
        : estimateReadTime(bodyText)
    const content = {
      body: bodyText,
      read_time_minutes: readTime,
      subtitle: readString(parsed.subtitle),
      title: readString(parsed.title),
      word_count: wordCount,
    }
    const exportMetadata: ExportMetadata = {
      read_time_minutes: readTime,
      word_count: wordCount,
    }
    const postId = await saveGeneratedPost({
      angle,
      content,
      createdBy: user.id,
      exportMetadata,
      format: 'article',
      idea,
      pillarId: activePillar?.id || null,
      platform: 'x' satisfies Platform,
      postId: body.post_id,
      userId: user.id,
      workspaceId: workspace.id,
    })

    return NextResponse.json({
      angle,
      content,
      export_metadata: exportMetadata,
      format: 'article',
      platform: 'x',
      pillar_id: activePillar?.id || null,
      post_id: postId,
      raw: idea,
    })
  } catch (error: unknown) {
    console.error('Error generating X article:', error)
    const msg = error instanceof Error ? error.message : 'Failed to generate X article'

    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
