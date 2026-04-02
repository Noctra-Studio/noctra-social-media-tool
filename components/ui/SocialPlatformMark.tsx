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

export function getPlatformToneClasses(platform: Platform) {
  return getPlatformTone(platform)
}


function getPlatformColor(platform: Platform) {
  switch (platform) {
    case 'instagram':
      return 'text-[#F0B7DD]'
    case 'linkedin':
      return 'text-[#B8CCFF]'
    case 'x':
      return 'text-[#DCE1E8]'
    default:
      return 'text-[#E0E5EB]'
  }
}

// Custom High-Quality Social Icons (SVG)
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
      width="20"
      height="20"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  )
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
      width="20"
      height="20"
    >
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
      width="18"
      height="18"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

export function SocialPlatformMark({ className = '', platform }: SocialPlatformMarkProps) {
  const colorClass = getPlatformColor(platform)
  
  return (
    <span 
      className={`inline-flex shrink-0 items-center justify-center aspect-square ${colorClass} ${className || 'w-5 h-5'} transition-all duration-300`.trim()}
      aria-hidden="true"
    >
      {platform === 'instagram' && <InstagramIcon className="h-full w-full" />}
      {platform === 'linkedin' && <LinkedInIcon className="h-full w-full" />}
      {platform === 'x' && <XIcon className="h-full w-full" />}
    </span>
  )
}
