'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { type LandingLocale } from './content'

type EarlyAccessCardProps = {
  locale: LandingLocale
  title: string
  badge: string
  description: string
  buttonText: string
  microcopy: string
  ctaHref: string
}

export function EarlyAccessCard({
  locale,
  title,
  badge,
  description,
  buttonText,
  microcopy,
  ctaHref,
}: EarlyAccessCardProps) {
  return (
    <div className="w-full max-w-[440px] rounded-[36px] border border-white/8 bg-[#1A1D24] p-10 transition-all duration-500 hover:border-white/15 shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
      <div className="flex flex-col gap-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white tracking-tight" style={{ fontFamily: 'var(--font-brand-display)' }}>
            {title}
          </h3>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-slate-500">
            {badge}
          </span>
        </div>

        {/* Description */}
        <p className="text-center text-lg leading-relaxed text-[#8D95A6]">
          {/* Fix orphans with dangerouslySetInnerHTML or by mapping specific string part */}
          {description.split('en IA').map((part, index, array) => (
            <span key={index}>
              {part}
              {index < array.length - 1 && <span className="whitespace-nowrap italic text-white/90">en IA</span>}
            </span>
          ))}
        </p>

        {/* Action Section */}
        <div className="flex flex-col items-center gap-4">
          <Link
            href={ctaHref}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-[#101417] transition-all duration-300 hover:bg-[#E0E5EB] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            <span>{buttonText}</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
          <span className="text-[13px] font-medium text-[#4E576A]">
            {microcopy}
          </span>
        </div>
      </div>
    </div>
  )
}
