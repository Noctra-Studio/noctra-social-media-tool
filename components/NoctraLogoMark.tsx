type NoctraLogoMarkProps = {
  className?: string
}

export function NoctraLogoMark({ className }: NoctraLogoMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1.5" y="1.5" width="21" height="21" rx="5" fill="url(#noctra-gradient)" />
      <path
        d="M15.9 6.2a6.8 6.8 0 1 0 0 11.6A5.5 5.5 0 1 1 15.9 6.2Z"
        fill="#101417"
      />
      <defs>
        <linearGradient id="noctra-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A9B2C8" />
          <stop offset="0.5" stopColor="#D8DBE0" />
          <stop offset="1" stopColor="#E8E9EA" />
        </linearGradient>
      </defs>
    </svg>
  )
}
