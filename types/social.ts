export const socialConnectionPlatforms = ['instagram', 'linkedin', 'x', 'facebook'] as const
export const socialMetricPlatforms = ['instagram', 'linkedin', 'x'] as const

export type SocialConnectionPlatform = (typeof socialConnectionPlatforms)[number]
export type SocialMetricPlatform = (typeof socialMetricPlatforms)[number]

export type SocialConnectionRow = {
  access_token: string
  account_avatar: string | null
  account_id: string | null
  account_name: string | null
  created_at: string
  id: string
  is_active: boolean
  last_synced_at: string | null
  platform: SocialConnectionPlatform
  refresh_token: string | null
  scopes: string[] | null
  token_expires_at: string | null
  updated_at: string
  workspace_id: string
}

export type PostMetricRow = {
  clicks: number | null
  comments: number | null
  engagement_rate: number | null
  external_post_id: string | null
  id: string
  impressions: number | null
  likes: number | null
  metric_date: string
  performance_score: number | null
  platform: SocialConnectionPlatform
  post_id: string
  reach: number | null
  reactions: number | null
  saves: number | null
  shares: number | null
  synced_at: string
  top_metric: string | null
  video_views: number | null
  workspace_id: string
}
