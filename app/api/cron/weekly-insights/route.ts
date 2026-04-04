import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { createAdminClient } from '@/lib/supabase'

type SocialConnectionRow = {
  platform: string
  workspace_id: string
}

type InsightRow = {
  generated_at: string
  platform: string
  workspace_id: string
}

type InsightResult = {
  confidence: number
  data_points: number
  expires_days: number
  insight_type: string
  summary: string
}

type PostMetricWithPost = {
  comments: number | null
  engagement_rate: number | null
  impressions: number | null
  likes: number | null
  metric_date: string | null
  platform: string
  post: {
    content: Record<string, unknown> | null
    pillar: { name: string } | null
    published_at: string | null
  } | null
  saves: number | null
  shares: number | null
  workspace_id: string
}

export async function GET(req: Request) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const results: Array<{ platform: string; status: string; workspace_id: string }> = []

  try {
    // 1. Find all active social connections
    const { data: connections, error: connectionsError } = await admin
      .from('social_connections')
      .select('workspace_id, platform')
      .eq('is_active', true)

    if (connectionsError) {
      throw connectionsError
    }

    const rows = (connections as SocialConnectionRow[] | null) ?? []

    // 2. For each workspace+platform, re-analyze if insights are stale (>14 days)
    const staleThreshold = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

    for (const connection of rows) {
      try {
        // Check when last insight was generated
        const { data: latestInsight } = await admin
          .from('ai_insights')
          .select('generated_at, platform, workspace_id')
          .eq('workspace_id', connection.workspace_id)
          .eq('platform', connection.platform)
          .order('generated_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        const insight = latestInsight as InsightRow | null
        const isStale = !insight || insight.generated_at < staleThreshold

        if (!isStale) {
          results.push({ platform: connection.platform, status: 'skipped_fresh', workspace_id: connection.workspace_id })
          continue
        }

        // Fetch recent metrics
        const { data: metricsData } = await admin
          .from('post_metrics')
          .select(`
            workspace_id,
            platform,
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
          .eq('workspace_id', connection.workspace_id)
          .eq('platform', connection.platform)
          .not('engagement_rate', 'is', null)
          .order('metric_date', { ascending: false })
          .limit(50)

        const metrics = (metricsData as PostMetricWithPost[] | null) ?? []

        if (metrics.length < 3) {
          results.push({ platform: connection.platform, status: 'skipped_no_data', workspace_id: connection.workspace_id })
          continue
        }

        const { data: config } = await admin
          .from('workspace_config')
          .select('brand_name, industry')
          .eq('workspace_id', connection.workspace_id)
          .maybeSingle()

        const avgEngagement =
          metrics.reduce((sum, m) => sum + (m.engagement_rate ?? 0), 0) / metrics.length
        const sortedByEngagement = [...metrics].sort(
          (a, b) => (b.engagement_rate ?? 0) - (a.engagement_rate ?? 0)
        )

        function extractText(content: Record<string, unknown> | null) {
          if (!content) return ''
          return String(content.caption ?? content.tweet ?? content.body ?? '')
        }

        const analysisData = {
          workspace: config,
          platform: connection.platform,
          data_points: metrics.length,
          avg_engagement_rate: avgEngagement.toFixed(2),
          top_posts: sortedByEngagement.slice(0, 5).map((m) => ({
            content_preview: extractText(m.post?.content ?? null).substring(0, 150),
            pillar: m.post?.pillar?.name,
            engagement_rate: m.engagement_rate?.toFixed(2),
          })),
          all_posts_summary: metrics.map((m) => {
            const text = extractText(m.post?.content ?? null)
            return {
              pillar: m.post?.pillar?.name ?? 'sin pilar',
              engagement_rate: m.engagement_rate,
              content_length: text.length,
              has_question: text.includes('?'),
            }
          }),
        }

        const message = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1200,
          system: `You analyze social media performance for ${config?.brand_name ?? 'a brand'} on ${connection.platform}.
Extract actionable insights. Respond ONLY with valid JSON. No preamble, no markdown.`,
          messages: [
            {
              role: 'user',
              content: `Extract 3-5 insights from this data. Return a JSON array:
[{ "insight_type": "topic"|"format"|"tone"|"timing"|"cta"|"length"|"general", "summary": "Spanish, max 120 chars, starts with verb", "confidence": 0.0-1.0, "data_points": number, "expires_days": 7-21 }]

DATA: ${JSON.stringify(analysisData)}`,
            },
          ],
        })

        const rawText = message.content[0].type === 'text' ? message.content[0].text : '[]'
        const newInsights = JSON.parse(rawText) as InsightResult[]

        await admin
          .from('ai_insights')
          .update({ is_active: false })
          .eq('workspace_id', connection.workspace_id)
          .eq('platform', connection.platform)

        await admin.from('ai_insights').insert(
          newInsights.map((i) => ({
            workspace_id: connection.workspace_id,
            platform: connection.platform,
            insight_type: i.insight_type,
            summary: i.summary,
            confidence: i.confidence,
            data_points: i.data_points,
            is_active: true,
            expires_at: new Date(
              Date.now() + (i.expires_days ?? 14) * 24 * 60 * 60 * 1000
            ).toISOString(),
          }))
        )

        results.push({ platform: connection.platform, status: 'analyzed', workspace_id: connection.workspace_id })
      } catch (err) {
        console.error(`Weekly insights failed for ${connection.workspace_id}/${connection.platform}:`, err)
        results.push({ platform: connection.platform, status: 'error', workspace_id: connection.workspace_id })
      }
    }

    return NextResponse.json({ results, processed: rows.length })
  } catch (error) {
    console.error('Weekly insights cron failed:', error)
    return NextResponse.json({ error: 'Cron execution failed' }, { status: 500 })
  }
}
