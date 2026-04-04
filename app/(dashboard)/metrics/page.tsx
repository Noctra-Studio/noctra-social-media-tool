import { subDays } from 'date-fns'
import { MetricsDashboard } from '@/components/metrics/MetricsDashboard'
import { formatPlatformLabel, platforms, type Platform } from '@/lib/product'
import { createClient } from '@/lib/supabase/server'
import { getPreviewText, inferPostFormat, isRecord } from '@/lib/social-content'
import { getActiveWorkspaceContext } from '@/lib/workspace/server'
import type { PostMetricRow, SocialConnectionRow } from '@/types/social'

type MetricsPageProps = {
  searchParams?: Promise<{ platform?: string; range?: string }>
}

type PostRow = {
  angle: string | null
  content: Record<string, unknown> | null
  id: string
  pillar_id: string | null
  platform: Platform
}

type PillarRow = {
  color: string | null
  id: string
  name: string
}

type InsightRow = {
  confidence: number
  data_points: number
  id: string
  insight_type: string
  summary: string
}

function average(values: number[]) {
  if (!values.length) {
    return 0
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function buildPostTitle(post: PostRow | undefined) {
  if (!post) {
    return 'Post sin título'
  }

  if (post.angle?.trim()) {
    return post.angle.trim()
  }

  const content = isRecord(post.content) ? post.content : {}
  const preview = getPreviewText(post.platform, inferPostFormat(post.platform, content, undefined), content, 96)

  return preview || 'Post sin título'
}

export default async function MetricsPage({ searchParams }: MetricsPageProps) {
  const params = (await searchParams) || {}
  const requestedRange = Number(params.range)
  const selectedRange = requestedRange === 7 || requestedRange === 90 ? requestedRange : 30
  const { workspace } = await getActiveWorkspaceContext()
  if (!workspace) return null
  const supabase = await createClient()
  const { data: connectionsData } = await supabase
    .from('social_connections')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('is_active', true)

  const connections = (connectionsData as SocialConnectionRow[] | null) ?? []
  const availablePlatformValues = connections
    .map((connection) => connection.platform)
    .filter((platform): platform is Platform => platform === 'instagram' || platform === 'linkedin' || platform === 'x')
  const requestedPlatform = params.platform
  const defaultPlatform =
    requestedPlatform &&
    (requestedPlatform === 'all' || platforms.includes(requestedPlatform as Platform))
      ? requestedPlatform
      : availablePlatformValues[0] || 'all'
  const fromDate = subDays(new Date(), selectedRange - 1).toISOString().slice(0, 10)

  let metricsQuery = supabase
    .from('post_metrics')
    .select('*')
    .eq('workspace_id', workspace.id)
    .gte('metric_date', fromDate)
    .order('metric_date', { ascending: false })

  if (defaultPlatform !== 'all') {
    metricsQuery = metricsQuery.eq('platform', defaultPlatform)
  }

  const { data: metricRowsData } = await metricsQuery
  const metricRows = (metricRowsData as PostMetricRow[] | null) ?? []
  const latestByPost = new Map<string, PostMetricRow>()

  for (const row of metricRows) {
    if (!latestByPost.has(row.post_id)) {
      latestByPost.set(row.post_id, row)
    }
  }

  const postIds = [...latestByPost.keys()]
  const { data: postsData } = postIds.length
    ? await supabase
        .from('posts')
        .select('id, angle, content, pillar_id, platform')
        .in('id', postIds)
    : { data: [] }
  const posts = ((postsData as PostRow[] | null) ?? []).reduce<Record<string, PostRow>>((acc, post) => {
    acc[post.id] = post
    return acc
  }, {})

  const pillarIds = [...new Set(Object.values(posts).map((post) => post.pillar_id).filter(Boolean))]
  const { data: pillarsData } = pillarIds.length
    ? await supabase.from('brand_pillars').select('id, name, color').in('id', pillarIds)
    : { data: [] }
  const pillars = ((pillarsData as PillarRow[] | null) ?? []).reduce<Record<string, PillarRow>>((acc, pillar) => {
    acc[pillar.id] = pillar
    return acc
  }, {})

  let insightsQuery = supabase
    .from('ai_insights')
    .select('id, insight_type, summary, confidence, data_points')
    .eq('workspace_id', workspace.id)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .order('confidence', { ascending: false })
    .limit(6)

  if (defaultPlatform !== 'all') {
    insightsQuery = insightsQuery.in('platform', [defaultPlatform, 'all'])
  }

  const { data: insightsData } = await insightsQuery
  const insights = (insightsData as InsightRow[] | null) ?? []

  const latestSnapshots = [...latestByPost.values()]
  const avgImpressions = average(
    latestSnapshots.map((row) => row.impressions ?? 0).filter((value) => value > 0)
  )
  const avgEngagement = average(
    latestSnapshots.map((row) => row.engagement_rate ?? 0).filter((value) => value > 0)
  )
  const bestPost = [...latestSnapshots].sort((left, right) => {
    const leftScore = left.engagement_rate ?? left.impressions ?? 0
    const rightScore = right.engagement_rate ?? right.impressions ?? 0
    return rightScore - leftScore
  })[0]

  const pillarMap = new Map<string, { count: number; total: number }>()

  for (const row of latestSnapshots) {
    const pillarId = posts[row.post_id]?.pillar_id
    const pillarName = pillarId ? pillars[pillarId]?.name : null

    if (!pillarName) {
      continue
    }

    const current = pillarMap.get(pillarName) || { count: 0, total: 0 }
    current.count += 1
    current.total += row.engagement_rate ?? 0
    pillarMap.set(pillarName, current)
  }

  const pillarData = [...pillarMap.entries()]
    .map(([name, entry]) => ({
      count: entry.count,
      engagement: entry.count > 0 ? Number((entry.total / entry.count).toFixed(2)) : 0,
      name,
    }))
    .sort((left, right) => right.engagement - left.engagement)

  const timelineMap = new Map<string, number>()

  for (const row of metricRows) {
    timelineMap.set(row.metric_date, (timelineMap.get(row.metric_date) || 0) + (row.impressions ?? 0))
  }

  const timelineData = [...timelineMap.entries()]
    .map(([date, impressions]) => ({
      date,
      impressions,
    }))
    .sort((left, right) => left.date.localeCompare(right.date))

  const topPosts = latestSnapshots
    .map((row) => ({
      engagementRate: row.engagement_rate ?? 0,
      id: row.post_id,
      impressions: row.impressions ?? 0,
      pillarName: posts[row.post_id]?.pillar_id ? pillars[posts[row.post_id].pillar_id!]?.name ?? null : null,
      title: buildPostTitle(posts[row.post_id]),
    }))
    .sort((left, right) =>
      right.engagementRate === left.engagementRate
        ? right.impressions - left.impressions
        : right.engagementRate - left.engagementRate
    )
    .slice(0, 5)

  const availablePlatforms = [
    { label: 'Todas las plataformas', value: 'all' },
    ...platforms.map((platform) => ({
      label: formatPlatformLabel(platform),
      value: platform,
    })),
  ]

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      <MetricsDashboard
        availablePlatforms={availablePlatforms}
        emptyState={{ hasConnections: connections.length > 0 }}
        insights={insights.map((insight) => ({
          confidence: insight.confidence ?? 0.5,
          dataPoints: insight.data_points ?? 0,
          id: insight.id,
          summary: insight.summary,
          type: insight.insight_type,
        }))}
        pillarData={pillarData}
        selectedPlatform={defaultPlatform}
        selectedRange={selectedRange}
        summary={{
          avgEngagement,
          avgImpressions,
          bestPostLabel: bestPost ? buildPostTitle(posts[bestPost.post_id]) : null,
          publishedPosts: latestSnapshots.length,
        }}
        timelineData={timelineData}
        topPosts={topPosts}
      />
    </div>
  )
}
