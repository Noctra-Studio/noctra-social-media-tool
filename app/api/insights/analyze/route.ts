import { NextResponse } from 'next/server'
import { z } from 'zod'
import { anthropic } from '@/lib/anthropic'
import { requireActiveWorkspaceRouteContext } from '@/lib/workspace/route'

const analyzeSchema = z.object({
  platform: z.enum(['instagram', 'linkedin', 'x']),
})

type PostMetricWithPost = {
  comments: number | null
  engagement_rate: number | null
  impressions: number | null
  likes: number | null
  metric_date: string | null
  post: {
    content: Record<string, unknown> | null
    pillar: { name: string } | null
    published_at: string | null
  } | null
  saves: number | null
  shares: number | null
  workspace_id: string
}

type InsightResult = {
  confidence: number
  data_points: number
  expires_days: number
  insight_type: string
  summary: string
}

export async function POST(req: Request) {
  try {
    const workspaceContext = await requireActiveWorkspaceRouteContext()

    if ('response' in workspaceContext) {
      return workspaceContext.response
    }

    const { workspaceId, admin } = workspaceContext
    const parsed = analyzeSchema.safeParse(await req.json())

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid platform.' }, { status: 400 })
    }

    const platform = parsed.data.platform

    // 1. Gather last 50 post metrics with post data
    const { data: metricsData, error: metricsError } = await admin
      .from('post_metrics')
      .select(`
        workspace_id,
        impressions,
        engagement_rate,
        likes,
        comments,
        shares,
        saves,
        metric_date,
        post:posts(
          content,
          published_at,
          pillar:brand_pillars(name)
        )
      `)
      .eq('workspace_id', workspaceId)
      .eq('platform', platform)
      .not('engagement_rate', 'is', null)
      .order('metric_date', { ascending: false })
      .limit(50)

    if (metricsError) {
      throw metricsError
    }

    const metrics = (metricsData as unknown as PostMetricWithPost[] | null) ?? []

    if (metrics.length < 3) {
      return NextResponse.json(
        { error: 'Not enough data. Need at least 3 published posts with metrics.' },
        { status: 400 }
      )
    }

    // 2. Get workspace config for context
    const { data: config } = await admin
      .from('workspace_config')
      .select('brand_name, industry, tone_of_voice, main_goal')
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    // 3. Compute basic stats
    const avgEngagement =
      metrics.reduce((sum, m) => sum + (m.engagement_rate ?? 0), 0) / metrics.length
    const sortedByEngagement = [...metrics].sort(
      (a, b) => (b.engagement_rate ?? 0) - (a.engagement_rate ?? 0)
    )
    const topPosts = sortedByEngagement.slice(0, 5)
    const bottomPosts = sortedByEngagement.slice(-5)

    function extractText(content: Record<string, unknown> | null) {
      if (!content) return ''
      return (
        String(content.caption ?? content.tweet ?? content.body ?? '')
      )
    }

    // 4. Build analysis dataset
    const analysisData = {
      workspace: config,
      platform,
      data_points: metrics.length,
      avg_engagement_rate: avgEngagement.toFixed(2),
      top_performing_posts: topPosts.map((m) => ({
        content_preview: extractText(m.post?.content ?? null).substring(0, 200),
        pillar: m.post?.pillar?.name,
        published_at: m.post?.published_at,
        metrics: {
          impressions: m.impressions,
          engagement_rate: m.engagement_rate?.toFixed(2),
          likes: m.likes,
          comments: m.comments,
          shares: m.shares,
          saves: m.saves,
        },
      })),
      low_performing_posts: bottomPosts.map((m) => ({
        content_preview: extractText(m.post?.content ?? null).substring(0, 200),
        pillar: m.post?.pillar?.name,
        metrics: {
          engagement_rate: m.engagement_rate?.toFixed(2),
          impressions: m.impressions,
        },
      })),
      all_posts_summary: metrics.map((m) => {
        const text = extractText(m.post?.content ?? null)
        return {
          pillar: m.post?.pillar?.name ?? 'sin pilar',
          engagement_rate: m.engagement_rate,
          day_of_week: m.metric_date
            ? new Date(m.metric_date).toLocaleDateString('es', { weekday: 'long' })
            : null,
          content_length: text.length,
          has_emoji: /[\u{1F300}-\u{1F9FF}]/u.test(text),
          has_question: text.includes('?'),
          has_cta:
            /escríbe|agenda|visita|conoce|descubre|llámanos|contáctanos/i.test(text),
        }
      }),
    }

    // 5. Ask Claude for insights
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `You are a social media analytics expert analyzing performance data for ${config?.brand_name ?? 'a brand'} on ${platform}.
Your job is to extract specific, actionable insights that will improve future content generation.
You respond ONLY with valid JSON. No preamble, no markdown fences.`,
      messages: [
        {
          role: 'user',
          content: `Analyze this social media performance data and extract 3-6 actionable insights.

DATA:
${JSON.stringify(analysisData, null, 2)}

Return a JSON array where each item has this exact structure:
{
  "insight_type": "topic" | "format" | "tone" | "timing" | "hashtag" | "cta" | "length" | "general",
  "summary": "One actionable insight in Spanish, max 120 characters, starting with a verb",
  "confidence": 0.0 to 1.0,
  "data_points": number of posts this is based on,
  "detail": "2-3 sentence explanation in Spanish",
  "expires_days": number of days before re-evaluation (7-30)
}

Focus on patterns that are statistically meaningful, actionable, and specific.
Do not invent data. Only report patterns visible in the dataset.
If less than 5 posts exist for a pattern, set confidence below 0.5.`,
        },
      ],
    })

    const rawText =
      message.content[0].type === 'text' ? message.content[0].text : '[]'
    const insights = JSON.parse(rawText) as InsightResult[]

    // 6. Deactivate old insights, insert new ones
    await admin
      .from('ai_insights')
      .update({ is_active: false })
      .eq('workspace_id', workspaceId)
      .eq('platform', platform)

    const insightRows = insights.map((insight) => ({
      workspace_id: workspaceId,
      platform,
      insight_type: insight.insight_type,
      summary: insight.summary,
      confidence: insight.confidence,
      data_points: insight.data_points,
      is_active: true,
      expires_at: new Date(
        Date.now() + (insight.expires_days ?? 14) * 24 * 60 * 60 * 1000
      ).toISOString(),
    }))

    const { data: saved, error: insertError } = await admin
      .from('ai_insights')
      .insert(insightRows)
      .select()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({ insights: saved, analyzed_posts: metrics.length })
  } catch (error) {
    console.error('Insights analysis failed:', error)
    const msg = error instanceof Error ? error.message : 'Analysis failed'

    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
