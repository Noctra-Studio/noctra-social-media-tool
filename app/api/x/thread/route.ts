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
import { readString, readXThreadTweets } from '@/lib/social-content'
import {
  type BrandVoice,
  formatBrandVoice,
  getGenerationContext,
  parseAnthropicJson,
  saveGeneratedPost,
} from '@/lib/social-server'

type ThreadBody = {
  angle?: string
  brand_voice?: Record<string, unknown>
  idea?: string
  pillar_id?: string | null
  post_id?: string
}

type ThreadResponse = {
  hook_note?: string
  hook_strength?: string
  tweets?: unknown
}

export async function POST(req: Request) {
  try {
    const { brandVoice: savedBrandVoice, supabase, user } = await getGenerationContext()
    const body = (await req.json()) as ThreadBody
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

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2200,
      system: withUserInputLanguageRule(`You are writing a Twitter/X thread for Manu, founder of Noctra Studio, a boutique digital agency in Queretaro, Mexico.
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

Write a thread of 4-8 tweets following these rules:
- Tweet 1: the hook. It must work standalone.
- Tweets 2-N: one point per tweet.
- Last tweet: payoff, CTA, or question inviting replies.
- Max 270 characters each.
- No hashtags except the last tweet, max 2.
- No em dash overuse. Max 1 in the full thread.
- Numbers and specifics beat vagueness.

Return ONLY valid JSON:
{
  "tweets": [{ "number": 1, "content": "string", "char_count": 123 }],
  "hook_strength": "strong",
  "hook_note": "string"
}`,
        },
      ],
    })

    const parsed = parseAnthropicJson<ThreadResponse>(message)
    const tweets = readXThreadTweets(parsed.tweets)
    const hookStrength = readString(parsed.hook_strength) as ExportMetadata['hook_strength']
    const content = {
      hook_note: readString(parsed.hook_note),
      hook_strength: hookStrength,
      tweets,
    }
    const exportMetadata: ExportMetadata = {
      hook_strength: hookStrength,
      tweet_count: tweets.length,
    }
    const postId = await saveGeneratedPost({
      angle,
      content,
      exportMetadata,
      format: 'thread',
      idea,
      pillarId: activePillar?.id || null,
      platform: 'x' satisfies Platform,
      postId: body.post_id,
      userId: user.id,
    })

    return NextResponse.json({
      angle,
      content,
      export_metadata: exportMetadata,
      format: 'thread',
      platform: 'x',
      pillar_id: activePillar?.id || null,
      post_id: postId,
      raw: idea,
    })
  } catch (error: unknown) {
    console.error('Error generating X thread:', error)
    const msg = error instanceof Error ? error.message : 'Failed to generate X thread'

    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
