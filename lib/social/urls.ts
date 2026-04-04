import type { SocialMetricPlatform } from '@/types/social'

function normalizeInput(value: string) {
  return value.trim()
}

function isUrl(value: string) {
  return /^https?:\/\//i.test(value.trim())
}

export function extractPostId(platform: SocialMetricPlatform, value: string): string | null {
  const normalized = normalizeInput(value)

  if (!normalized) {
    return null
  }

  if (!isUrl(normalized)) {
    return normalized
  }

  switch (platform) {
    case 'instagram':
      return normalized.match(/instagram\.com\/p\/([A-Za-z0-9_-]+)/i)?.[1] ?? null
    case 'linkedin':
      return (
        normalized.match(/urn:li:(?:share|ugcPost):(\d+)/i)?.[1] ??
        normalized.match(/activity-(\d+)/i)?.[1] ??
        null
      )
    case 'x':
      return normalized.match(/status\/(\d+)/i)?.[1] ?? null
    default:
      return null
  }
}
