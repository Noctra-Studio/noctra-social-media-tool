import { formatPlatformLabel, type Platform } from '@/lib/product'

type PlatformBadgeProps = {
  className?: string
  platform: Platform
}

function getPlatformClasses(platform: Platform) {
  switch (platform) {
    case 'instagram':
      return 'bg-pink-500/20 text-pink-300'
    case 'linkedin':
      return 'bg-blue-500/20 text-blue-300'
    case 'x':
      return 'bg-zinc-500/20 text-zinc-300'
    default:
      return 'bg-white/10 text-white'
  }
}

export function PlatformBadge({ className = '', platform }: PlatformBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${getPlatformClasses(
        platform
      )} ${className}`.trim()}
    >
      {formatPlatformLabel(platform)}
    </span>
  )
}
