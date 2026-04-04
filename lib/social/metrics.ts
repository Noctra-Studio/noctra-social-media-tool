import type { SocialConnectionRow, SocialMetricPlatform } from '@/types/social'

export type FlatMetrics = {
  clicks?: number | null
  comments?: number | null
  impressions?: number | null
  likes?: number | null
  reach?: number | null
  reactions?: number | null
  saves?: number | null
  shares?: number | null
  video_views?: number | null
}

type FetchMetricsOptions = {
  connection: SocialConnectionRow
  externalPostId: string
  platform: SocialMetricPlatform
}

function toNullableNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function requireOk(response: Response, context: string) {
  if (response.ok) {
    return
  }

  throw new Error(`${context} failed with ${response.status}`)
}

async function resolveInstagramMediaId(connection: SocialConnectionRow, externalPostId: string) {
  if (/^\d+$/.test(externalPostId)) {
    return externalPostId
  }

  let nextUrl = `https://graph.instagram.com/me/media?fields=id,permalink&limit=100&access_token=${encodeURIComponent(
    connection.access_token
  )}`

  for (let page = 0; page < 5 && nextUrl; page += 1) {
    const response = await fetch(nextUrl, { cache: 'no-store' })
    requireOk(response, 'Instagram media lookup')
    const payload = (await response.json()) as {
      data?: Array<{ id?: string; permalink?: string }>
      paging?: { next?: string }
    }

    const match = payload.data?.find((item) => item.permalink?.includes(`/${externalPostId}/`))

    if (match?.id) {
      return match.id
    }

    nextUrl = payload.paging?.next ?? ''
  }

  return externalPostId
}

async function fetchInstagramMetrics(connection: SocialConnectionRow, externalPostId: string) {
  const mediaId = await resolveInstagramMediaId(connection, externalPostId)
  const endpoint = new URL(`https://graph.instagram.com/${mediaId}/insights`)
  endpoint.searchParams.set(
    'metric',
    'impressions,reach,likes,comments,shares,saved,video_views'
  )
  endpoint.searchParams.set('access_token', connection.access_token)

  const response = await fetch(endpoint, { cache: 'no-store' })

  if (!response.ok) {
    const fallback = new URL(`https://graph.instagram.com/${mediaId}/insights`)
    fallback.searchParams.set('metric', 'impressions,reach,likes,comments,shares,saved')
    fallback.searchParams.set('access_token', connection.access_token)
    const retry = await fetch(fallback, { cache: 'no-store' })
    requireOk(retry, 'Instagram insights')
    return parseInstagramMetrics(await retry.json())
  }

  return parseInstagramMetrics(await response.json())
}

function parseInstagramMetrics(payload: unknown): FlatMetrics {
  const metrics = new Map<string, number | null>()

  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown[] }).data)) {
    for (const item of (payload as { data: Array<{ name?: string; values?: Array<{ value?: unknown }> }> }).data) {
      if (!item?.name) {
        continue
      }

      const key = item.name === 'saved' ? 'saves' : item.name
      metrics.set(key, toNullableNumber(item.values?.[0]?.value))
    }
  }

  return {
    comments: metrics.get('comments') ?? null,
    impressions: metrics.get('impressions') ?? null,
    likes: metrics.get('likes') ?? null,
    reach: metrics.get('reach') ?? null,
    saves: metrics.get('saves') ?? null,
    shares: metrics.get('shares') ?? null,
    video_views: metrics.get('video_views') ?? null,
  }
}

function buildLinkedInHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'LinkedIn-Version': process.env.LINKEDIN_API_VERSION?.trim() || '202602',
    'X-Restli-Protocol-Version': '2.0.0',
  }
}

async function fetchLinkedInMetrics(connection: SocialConnectionRow, externalPostId: string) {
  if (!connection.account_id) {
    throw new Error('LinkedIn connection is missing an organization account ID')
  }

  const organizationUrn = connection.account_id.startsWith('urn:')
    ? connection.account_id
    : `urn:li:organization:${connection.account_id}`
  const shareUrn = externalPostId.startsWith('urn:')
    ? externalPostId
    : `urn:li:share:${externalPostId}`
  const endpoint = new URL('https://api.linkedin.com/rest/organizationalEntityShareStatistics')
  endpoint.searchParams.set('q', 'organizationalEntity')
  endpoint.searchParams.set('organizationalEntity', organizationUrn)
  endpoint.searchParams.set('shares', `List(${shareUrn})`)

  const response = await fetch(endpoint, {
    cache: 'no-store',
    headers: buildLinkedInHeaders(connection.access_token),
  })
  requireOk(response, 'LinkedIn share statistics')
  const payload = (await response.json()) as {
    elements?: Array<{
      totalShareStatistics?: {
        clickCount?: number
        commentCount?: number
        engagement?: number
        impressionCount?: number
        likeCount?: number
        shareCount?: number
      }
    }>
  }
  const stats = payload.elements?.[0]?.totalShareStatistics

  return {
    clicks: toNullableNumber(stats?.clickCount),
    comments: toNullableNumber(stats?.commentCount),
    impressions: toNullableNumber(stats?.impressionCount),
    likes: toNullableNumber(stats?.likeCount),
    reactions: toNullableNumber(stats?.likeCount),
    shares: toNullableNumber(stats?.shareCount),
  }
}

async function fetchXMetrics(connection: SocialConnectionRow, externalPostId: string) {
  const endpoint = new URL(`https://api.x.com/2/tweets/${externalPostId}`)
  endpoint.searchParams.set('tweet.fields', 'public_metrics,non_public_metrics,organic_metrics')

  const response = await fetch(endpoint, {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${connection.access_token}`,
    },
  })
  requireOk(response, 'X post metrics')

  const payload = (await response.json()) as {
    data?: {
      non_public_metrics?: {
        impression_count?: number
        profile_clicks?: number
        url_link_clicks?: number
      }
      organic_metrics?: {
        impression_count?: number
        like_count?: number
        reply_count?: number
        retweet_count?: number
        user_profile_clicks?: number
        url_link_clicks?: number
      }
      public_metrics?: {
        like_count?: number
        quote_count?: number
        reply_count?: number
        retweet_count?: number
      }
    }
  }

  const publicMetrics = payload.data?.public_metrics
  const nonPublicMetrics = payload.data?.non_public_metrics
  const organicMetrics = payload.data?.organic_metrics
  const retweets = toNullableNumber(publicMetrics?.retweet_count) ?? toNullableNumber(organicMetrics?.retweet_count) ?? 0
  const quotes = toNullableNumber(publicMetrics?.quote_count) ?? 0

  return {
    clicks:
      toNullableNumber(nonPublicMetrics?.url_link_clicks) ??
      toNullableNumber(organicMetrics?.url_link_clicks) ??
      toNullableNumber(nonPublicMetrics?.profile_clicks) ??
      toNullableNumber(organicMetrics?.user_profile_clicks),
    comments: toNullableNumber(publicMetrics?.reply_count) ?? toNullableNumber(organicMetrics?.reply_count),
    impressions:
      toNullableNumber(nonPublicMetrics?.impression_count) ??
      toNullableNumber(organicMetrics?.impression_count),
    likes: toNullableNumber(publicMetrics?.like_count) ?? toNullableNumber(organicMetrics?.like_count),
    shares: retweets + quotes,
  }
}

export async function fetchMetricsForPlatform({
  connection,
  externalPostId,
  platform,
}: FetchMetricsOptions) {
  if (platform === 'instagram') {
    return fetchInstagramMetrics(connection, externalPostId)
  }

  if (platform === 'linkedin') {
    return fetchLinkedInMetrics(connection, externalPostId)
  }

  return fetchXMetrics(connection, externalPostId)
}

export function computeEngagementRate(metrics: FlatMetrics) {
  const reach = metrics.reach ?? metrics.impressions ?? 0
  const numerator =
    (metrics.likes ?? metrics.reactions ?? 0) +
    (metrics.comments ?? 0) +
    (metrics.shares ?? 0)

  if (!reach || reach <= 0) {
    return 0
  }

  return Number((((numerator / reach) * 100) || 0).toFixed(2))
}

export function computeTopMetric(metrics: FlatMetrics) {
  const entries = Object.entries(metrics).filter(
    (entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1])
  )

  if (!entries.length) {
    return null
  }

  entries.sort((left, right) => right[1] - left[1])
  return entries[0]?.[0] ?? null
}

export function computePerformanceScore(
  metrics: FlatMetrics & { engagement_rate?: number | null },
  averages: { engagementRate: number; impressions: number }
) {
  const engagementScore =
    averages.engagementRate > 0
      ? (metrics.engagement_rate ?? 0) / averages.engagementRate
      : 0
  const impressionScore =
    averages.impressions > 0 ? (metrics.impressions ?? 0) / averages.impressions : 0
  const raw = engagementScore > 0 ? engagementScore : impressionScore

  return Number(Math.max(0, Math.min(1, raw)).toFixed(3))
}
