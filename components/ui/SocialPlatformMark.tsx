import type { Platform } from '@/lib/product'

type SocialPlatformMarkProps = {
  className?: string
  platform: Platform
}

function getPlatformTone(platform: Platform) {
  switch (platform) {
    case 'instagram':
      return 'border-[#D76DB6]/30 bg-[#D76DB6]/12 text-[#F0B7DD]'
    case 'linkedin':
      return 'border-[#7AA2F7]/30 bg-[#7AA2F7]/12 text-[#B8CCFF]'
    case 'x':
      return 'border-white/15 bg-white/5 text-[#DCE1E8]'
    default:
      return 'border-white/10 bg-white/5 text-[#E0E5EB]'
  }
}

function getPlatformMonogram(platform: Platform) {
  switch (platform) {
    case 'instagram':
      return 'IG'
    case 'linkedin':
      return 'in'
    case 'x':
      return 'X'
    default:
      return '?'
  }
}

export function getPlatformToneClasses(platform: Platform) {
  return getPlatformTone(platform)
}

export function SocialPlatformMark({ className = '', platform }: SocialPlatformMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full border px-1.5 text-[10px] font-semibold tracking-[0.02em] ${getPlatformTone(
        platform
      )} ${className}`.trim()}
    >
      {getPlatformMonogram(platform)}
    </span>
  )
}
