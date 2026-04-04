import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { buildUserContext } from '@/lib/ai/build-user-context'
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
import {
  fetchMarketIntelligence,
  formatMarketSignalsForPrompt,
} from '@/lib/ai/market-intelligence'
import { getNoctraPositioningPrompt } from '@/lib/ai/noctra-positioning'

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

function clampHeadlineWords(value: string, maxWords = 10) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords)
    .join(' ')
    .trim()
}

function deriveInstagramHeadline(...sources: string[]) {
  for (const source of sources) {
    const normalized = source.trim()

    if (!normalized) {
      continue
    }

    const firstLine = normalized
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean)

    if (!firstLine) {
      continue
    }

    const firstSentence = firstLine.split(/(?<=[.!?])\s+/)[0]?.trim() || firstLine
    const cleaned = firstSentence.replace(/[#*_`"]/g, '').trim()
    const headline = clampHeadlineWords(cleaned)

    if (headline) {
      return headline
    }
  }

  return ''
}

function buildTemporalClosingInstruction(): string {
  const year = new Date().getFullYear()
  return `
INSTRUCCIÓN FINAL — TIEMPO:
Antes de escribir este post, confirma mentalmente:
- ¿Estoy usando el año actual (${year}) como presente? ✓
- ¿Estoy usando el año pasado (${year - 1}) solo como historia
  o contraste, nunca como presente o futuro? ✓
- ¿Mis proyecciones usan horizonte relativo ("próximos meses", "para ${year + 1}")
  y no años que ya pasaron? ✓
Si cualquier respuesta es NO — reescribe esa parte antes de responder.
`
}

function getInstagramSinglePrompt(idea: string, angle: string, brandVoice: string, strategyContext: string) {
  return {
    system: withUserInputLanguageRule([
      buildTemporalContext(),
      buildLatamGeoContext(),
      buildNoctraIndustryContext(),
      `You are the lead content strategist for Noctra Studio, a boutique digital agency in Queretaro, Mexico.
Audience: dueños de negocio, emprendedores y profesionales en México y LATAM.
Consumen contenido en español. Esperan valor práctico, no teoría de mercado.
Brand voice:
${brandVoice}

${strategyContext}

Language: Spanish (LATAM).
Output only valid JSON.`,
      buildTemporalClosingInstruction(),
    ].join('\n\n')),
    prompt: `Create an Instagram single-image post.

Idea: ${idea}
Angle: ${angle}

Rules:
- Return a "headline" for the visual/social title. Max 10 words. Punchy, specific, no hashtags.
- Return a "body" for the on-image/post body copy. Max 45 words, 1-3 short sentences.
- Caption max 150 words.
- 5-8 hashtags, relevant and non-generic.
- Strong first line.
- CTA at the end.
- Also return visual_direction describing the best supporting image in one sentence.

Return ONLY valid JSON:
{
  "headline": "string",
  "body": "string",
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
    system: withUserInputLanguageRule([
      buildTemporalContext(),
      buildLatamGeoContext(),
      buildNoctraIndustryContext(),
      `You are writing for LinkedIn on behalf of Noctra Studio, a boutique digital agency in Queretaro, Mexico.
Audience: profesionales, directivos de PYMEs y emprendedores en México/LATAM.
LinkedIn en LATAM tiene un tono más formal que en USA — el contenido debe
ser directo y orientado a resultado, sin ser demasiado casual.
Brand voice:
${brandVoice}

${strategyContext}

Language: Spanish (LATAM).
Tone: practitioner, direct, useful, not corporate.
Output only valid JSON.`,
      buildTemporalClosingInstruction(),
    ].join('\n\n')),
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
    system: withUserInputLanguageRule([
      buildTemporalContext(),
      buildLatamGeoContext(),
      buildNoctraIndustryContext(),
      `You are Manu, founder of Noctra Studio,
writing on X (Twitter) from a practitioner's perspective.
You execute digital projects for SMBs in Mexico and LATAM.
Your voice: direct, specific, earned credibility — not corporate.
Audience: comunidad tech, emprendedores y profesionales digitales en
México/LATAM. Más abierta a opiniones directas y datos concretos.
El humor es válido si es seco e inteligente — no forzado.

Brand voice context:
${brandVoice}

${strategyContext}

Language: Spanish (LATAM).
Output only valid JSON.`,
      buildTemporalClosingInstruction(),
    ].join('\n\n')),
    prompt: `Write one publication-ready tweet for X.

Idea: ${idea}
Angle: ${angle}

Rules:
- Max 270 characters.
- No hashtags unless truly necessary.
- Tight, punchy, specific.
- No em dash.
- The hook must create one of: curiosity, contradiction, threatened identity, or specific transformation promise.
- If angle is "Contrarian": start with what the majority believes, then flip it with evidence.
- If angle is "Historia": first person, past tense, specific moment.
- If angle is "Tutorial": lead with the outcome, not the steps.
- Never start with "En", "La", "El", "Los" — start with action or tension.

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

  if (platform === 'instagram' && inferredFormat === 'single') {
    const caption = readString(content.caption)
    const body = readString(content.body) || caption
    const visualDirection = readString(content.visual_direction)
    const headline = deriveInstagramHeadline(readString(content.headline), body, caption)

    return {
      content: {
        body,
        caption,
        hashtags: readStringArray(content.hashtags),
        headline,
        ...(visualDirection ? { visual_direction: visualDirection } : {}),
      },
      exportMetadata: {},
      format: inferredFormat,
    } satisfies GeneratedPayload
  }

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
    const { brandVoice: savedBrandVoice, supabase, user, workspace } = await getGenerationContext()
    if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 401 })
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

    // Fetch active AI insights for this workspace + platform
    const { createAdminClient } = await import('@/lib/supabase')
    const adminForInsights = createAdminClient()
    const { data: activeInsights } = await adminForInsights
      .from('ai_insights')
      .select('insight_type, summary, confidence')
      .eq('workspace_id', workspace.id)
      .eq('is_active', true)
      .or(`platform.eq.${platform},platform.eq.all`)
      .gte('confidence', 0.4)
      .gt('expires_at', new Date().toISOString())
      .order('confidence', { ascending: false })
      .limit(6)

    const insightsBlock =
      activeInsights && activeInsights.length > 0
        ? `\n\n## Performance insights from past posts (apply these patterns):\n${activeInsights
            .map((i: { insight_type: string; summary: string }) => `- [${i.insight_type.toUpperCase()}] ${i.summary}`)
            .join('\n')}`
        : ''

    const insightsApplied =
      activeInsights && activeInsights.length > 0
        ? activeInsights.map((i: { summary: string }) => i.summary)
        : []

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
      if (isMissingStrategyTablesError(pillarsError) || isMissingStrategyTablesError(audienceError)) {
        const [context, marketContext] = await Promise.allSettled([
          buildUserContext(user.id, platform),
          fetchMarketIntelligence(idea, platform),
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
${userCtx.editorial_principles ?? ''}
${marketSignals}
${insightsBlock}
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
        const promptPayload = buildPlatformPrompt({
          angle,
          brandVoice: `${formatBrandVoice(customBrandVoice as never)}${learningInjection}`,
          format,
          idea,
          platform,
          strategyContext: `${getPillarPrompt(null)}

${getAudiencePrompt(null, platform)}

Calibra el lenguaje, ejemplos, y CTA del post para esta audiencia específica. Un post para LinkedIn (directores) debe sonar diferente al mismo tema en Instagram (dueños de PYME sin formación técnica).`,
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
          createdBy: user.id,
          exportMetadata: normalized.exportMetadata,
          format: normalized.format,
          idea,
          pillarId: null,
          platform,
          postId: body.post_id,
          userId: user.id,
          workspaceId: workspace.id,
        })

        return NextResponse.json({
          angle,
          content: normalized.content,
          export_metadata: normalized.exportMetadata,
          format: normalized.format,
          insights_applied: insightsApplied,
          platform,
          pillar_id: null,
          post_id: postId,
          raw: idea,
        })
      }

      throw pillarsError || audienceError
    }

    const activePillar =
      ((pillars as BrandPillar[] | null) || []).find((pillar) => pillar.id === selectedPillarId) || null
    const activeAudience = (audience as PlatformAudience | null) ?? null

    const [context, marketContext] = await Promise.allSettled([
      buildUserContext(user.id, platform),
      fetchMarketIntelligence(idea, platform),
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
${insightsBlock}
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
      createdBy: user.id,
      exportMetadata: normalized.exportMetadata,
      format: normalized.format,
      idea,
      pillarId: activePillar?.id || null,
      platform,
      postId: body.post_id,
      userId: user.id,
      workspaceId: workspace.id,
    })

    return NextResponse.json({
      angle,
      content: normalized.content,
      export_metadata: normalized.exportMetadata,
      format: normalized.format,
      insights_applied: insightsApplied,
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
