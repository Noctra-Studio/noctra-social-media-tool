'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { landingContent, type LandingLocale } from '@/components/landing/content'
import { SectionReveal } from '@/components/landing/section-reveal'

export function CtaFinal({ locale }: { locale: LandingLocale }) {
  return (
    <SectionReveal className="border-t border-white/6 px-6 py-20 text-center sm:px-8 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-4xl">
        <p
          className="text-4xl leading-[0.98] text-[#E0E5EB] sm:text-5xl lg:text-[3.4rem]"
          style={{ fontFamily: 'var(--font-brand-display)' }}
        >
          {landingContent.finalCta.body[locale]}
        </p>

        <Link
          href="mailto:hello@noctra.design?subject=Acceso%20Noctra%20Social"
          className="group mt-10 inline-flex items-center gap-2 rounded-xl bg-[#E0E5EB] px-8 py-4 text-sm font-bold text-[#101417] transition-all hover:bg-white hover:shadow-[0_0_30px_rgba(255,255,255,0.08)]"
          style={{ fontFamily: 'var(--font-brand-display)' }}
        >
          <span>{landingContent.finalCta.button[locale]}</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </SectionReveal>
  )
}
