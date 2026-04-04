import type { SocialConnectionPlatform, SocialMetricPlatform } from '@/types/social'

export const socialPlatformLabels: Record<SocialConnectionPlatform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  x: 'X',
}

export function formatSocialPlatformLabel(platform: SocialConnectionPlatform) {
  return socialPlatformLabels[platform] ?? platform
}

export function isSocialConnectionPlatform(value: string): value is SocialConnectionPlatform {
  return value === 'instagram' || value === 'linkedin' || value === 'x' || value === 'facebook'
}

export function isSocialMetricPlatform(value: string): value is SocialMetricPlatform {
  return value === 'instagram' || value === 'linkedin' || value === 'x'
}
