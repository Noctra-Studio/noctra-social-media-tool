import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { requireActiveWorkspaceRouteContext } from '@/lib/workspace/route'

type PostMetricWithPost = {
  engagement_rate: number | null
  impressions: number | null
  metric_date: string | null
  platform: string
  post: {
    content: Record<string, unknown> | null
    pillar: { name: string } | null
  } | null
  saves: number | null
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

    // 1. Gather metrics across all platforms
    const { data: metricsData, error: metricsError } = await admin
      .from('post_metrics')
      .select(`
        workspace_id,
        platform,
        impressions,
        engagement_rate,
        saves,
        metric_date,
        post:posts(
          content,
          pillar:brand_pillars(name)
        )
      `)
      .eq('workspace_id', workspaceId)
      .not('engagement_rate', 'is', null)
      .order('metric_date', { ascending: false })
      .limit(100)

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

    // 2. Get workspace config
    const { data: config } = await admin
      .from('workspace_config')
      .select('brand_name, industry, tone_of_voice, main_goal')
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    function extractText(content: Record<string, unknown> | null) {
      if (!content) return ''
      return String(content.caption ?? content.tweet ?? content.body ?? '')
    }

    // 3. Build cross-platform analysis dataset
    const byPlatform = metrics.reduce<Record<string, { count: number; totalEngagement: number }>>(
      (acc, m) => {
        if (!acc[m.platform]) acc[m.platform] = { count: 0, totalEngagement: 0 }
        acc[m.platform].count += 1
        acc[m.platform].totalEngagement += m.engagement_rate ?? 0
        return acc
      },
      {}
    )

    const byPillar = metrics.reduce<Record<string, { count: number; totalEngagement: number }>>(
      (acc, m) => {
        const pillar = m.post?.pillar?.name ?? 'sin pilar'
        if (!acc[pillar]) acc[pillar] = { count: 0, totalEngagement: 0 }
        acc[pillar].count += 1
        acc[pillar].totalEngagement += m.engagement_rate ?? 0
        return acc
      },
      {}
    )

    const analysisData = {
      workspace: config,
      total_data_points: metrics.length,
      platform_breakdown: Object.entries(byPlatform).map(([platform, stats]) => ({
        platform,
        post_count: stats.count,
        avg_engagement: stats.count > 0 ? (stats.totalEngagement / stats.count).toFixed(2) : '0',
      })),
      pillar_breakdown: Object.entries(byPillar).map(([pillar, stats]) => ({
        pillar,
        post_count: stats.count,
        avg_engagement: stats.count > 0 ? (stats.totalEngagement / stats.count).toFixed(2) : '0',
      })),
      all_posts_summary: metrics.map((m) => {
        const text = extractText(m.post?.content ?? null)
        return {
          platform: m.platform,
          pillar: m.post?.pillar?.name ?? 'sin pilar',
          engagement_rate: m.engagement_rate,
          content_length: text.length,
          has_question: text.includes('?'),
          has_cta: /escríbe|agenda|visita|conoce|descubre|llámanos|contáctanos/i.test(text),
        }
      }),
    }

    // 4. Ask Claude for cross-platform insights
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `You are a social media analytics expert analyzing cross-platform performance data for ${config?.brand_name ?? 'a brand'}.
Your job is to extract actionable insights that apply across all platforms.
You respond ONLY with valid JSON. No preamble, no markdown fences.`,
      messages: [
        {
          role: 'user',
          content: `Analyze this cross-platform social media data and extract 3-5 general insights.

DATA:
${JSON.stringify(analysisData, null, 2)}

Return a JSON array where each item has this exact structure:
{
  "insight_type": "topic" | "format" | "tone" | "timing" | "hashtag" | "cta" | "length" | "general",
  "summary": "One actionable insight in Spanish, max 120 characters, starting with a verb",
  "confidence": 0.0 to 1.0,
  "data_points": number of posts this is based on,
  "detail": "2-3 sentence explanation in Spanish",
  "expires_days": number of days before re-evaluation (14-30)
}

Focus on cross-platform patterns: which content types, pillars, or formats work across all channels.
Do not invent data. Only report patterns visible in the dataset.`,
        },
      ],
    })

    const rawText =
      message.content[0].type === 'text' ? message.content[0].text : '[]'
    const insights = JSON.parse(rawText) as InsightResult[]

    // 5. Deactivate old general insights, insert new ones
    await admin
      .from('ai_insights')
      .update({ is_active: false })
      .eq('workspace_id', workspaceId)
      .eq('platform', 'all')

    const insightRows = insights.map((insight) => ({
      workspace_id: workspaceId,
      platform: 'all',
      insight_type: insight.insight_type,
      summary: insight.summary,
      confidence: insight.confidence,
      data_points: insight.data_points,
      is_active: true,
      expires_at: new Date(
        Date.now() + (insight.expires_days ?? 21) * 24 * 60 * 60 * 1000
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
    console.error('General insights analysis failed:', error)
    const msg = error instanceof Error ? error.message : 'Analysis failed'

    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
