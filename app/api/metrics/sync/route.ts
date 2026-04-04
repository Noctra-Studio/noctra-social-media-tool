import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  computeEngagementRate,
  computePerformanceScore,
  computeTopMetric,
  fetchMetricsForPlatform,
  type FlatMetrics,
} from '@/lib/social/metrics'
import { isSocialMetricPlatform } from '@/lib/social/platforms'
import type { PostMetricRow, SocialConnectionRow } from '@/types/social'
import { requireActiveWorkspaceRouteContext } from '@/lib/workspace/route'

const syncSchema = z.object({
  platform: z.string().min(1),
})

type PublishedPostRow = {
  external_post_id: string | null
  id: string
}

type MetricInsert = FlatMetrics & {
  engagement_rate: number
  external_post_id: string
  performance_score: number
  platform: string
  post_id: string
  synced_at: string
  top_metric: string | null
  workspace_id: string
}

function average(values: number[]) {
  if (!values.length) {
    return 0
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export async function POST(request: Request) {
  try {
    const workspaceContext = await requireActiveWorkspaceRouteContext()

    if ('response' in workspaceContext) {
      return workspaceContext.response
    }

    const parsed = syncSchema.safeParse(await request.json())

    if (!parsed.success || !isSocialMetricPlatform(parsed.data.platform)) {
      return NextResponse.json({ error: 'Invalid sync payload.' }, { status: 400 })
    }

    const platform = parsed.data.platform
    const { data: connectionData, error: connectionError } = await workspaceContext.admin
      .from('social_connections')
      .select('*')
      .eq('workspace_id', workspaceContext.workspaceId)
      .eq('platform', platform)
      .eq('is_active', true)
      .maybeSingle()

    if (connectionError) {
      throw connectionError
    }

    const connection = connectionData as SocialConnectionRow | null

    if (!connection) {
      return NextResponse.json({ error: 'No hay una cuenta conectada para esta plataforma.' }, { status: 400 })
    }

    const { data: postData, error: postsError } = await workspaceContext.admin
      .from('posts')
      .select('id, external_post_id')
      .eq('workspace_id', workspaceContext.workspaceId)
      .eq('platform', platform)
      .eq('status', 'published')
      .not('external_post_id', 'is', null)

    if (postsError) {
      throw postsError
    }

    const posts = (postData as PublishedPostRow[] | null) ?? []

    if (!posts.length) {
      return NextResponse.json({ failed: 0, synced: 0 })
    }

    const today = new Date().toISOString().slice(0, 10)
    const syncedAt = new Date().toISOString()
    const insertedRows: MetricInsert[] = []
    const failures: Array<{ message: string; post_id: string }> = []

    for (const post of posts) {
      if (!post.external_post_id) {
        continue
      }

      try {
        const metrics = await fetchMetricsForPlatform({
          connection,
          externalPostId: post.external_post_id,
          platform,
        })
        const engagementRate = computeEngagementRate(metrics)
        const row: MetricInsert = {
          ...metrics,
          engagement_rate: engagementRate,
          external_post_id: post.external_post_id,
          performance_score: 0,
          platform,
          post_id: post.id,
          synced_at: syncedAt,
          top_metric: computeTopMetric(metrics),
          workspace_id: workspaceContext.workspaceId,
        }

        const { error } = await workspaceContext.admin.from('post_metrics').upsert(
          {
            ...row,
            metric_date: today,
          },
          {
            onConflict: 'post_id,metric_date',
          }
        )

        if (error) {
          throw error
        }

        insertedRows.push(row)
      } catch (postError) {
        console.error(`Failed to sync metrics for post ${post.id}`, postError)
        failures.push({
          message: postError instanceof Error ? postError.message : 'Unknown sync error',
          post_id: post.id,
        })
      }
    }

    const { data: metricRows, error: metricRowsError } = await workspaceContext.admin
      .from('post_metrics')
      .select('post_id, engagement_rate, impressions, metric_date')
      .eq('workspace_id', workspaceContext.workspaceId)
      .eq('platform', platform)
      .order('metric_date', { ascending: false })

    if (metricRowsError) {
      throw metricRowsError
    }

    const latestByPost = new Map<string, Pick<PostMetricRow, 'engagement_rate' | 'impressions'>>()

    for (const row of ((metricRows as PostMetricRow[] | null) ?? [])) {
      if (!latestByPost.has(row.post_id)) {
        latestByPost.set(row.post_id, {
          engagement_rate: row.engagement_rate,
          impressions: row.impressions,
        })
      }
    }

    const averages = {
      engagementRate: average(
        [...latestByPost.values()]
          .map((row) => row.engagement_rate ?? 0)
          .filter((value) => value > 0)
      ),
      impressions: average(
        [...latestByPost.values()].map((row) => row.impressions ?? 0).filter((value) => value > 0)
      ),
    }

    for (const row of insertedRows) {
      const performanceScore = computePerformanceScore(row, averages)
      row.performance_score = performanceScore

      const { error } = await workspaceContext.admin
        .from('post_metrics')
        .update({ performance_score: performanceScore })
        .eq('post_id', row.post_id)
        .eq('metric_date', today)

      if (error) {
        throw error
      }
    }

    const { error: updateConnectionError } = await workspaceContext.admin
      .from('social_connections')
      .update({ last_synced_at: syncedAt })
      .eq('id', connection.id)

    if (updateConnectionError) {
      throw updateConnectionError
    }

    const synced = insertedRows.length

    // Auto-trigger analysis in background when enough data is synced
    if (synced >= 3) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL
      if (appUrl) {
        fetch(`${appUrl}/api/insights/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: request.headers.get('cookie') ?? '',
          },
          body: JSON.stringify({ platform }),
        }).catch((err) => console.error('Background insights analysis failed:', err))
      }
    }

    return NextResponse.json({
      failed: failures.length,
      failures,
      synced,
    })
  } catch (error) {
    console.error('Manual metrics sync failed', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'No fue posible sincronizar las métricas.',
      },
      { status: 500 }
    )
  }
}
