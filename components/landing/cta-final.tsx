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
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#E0E5EB] px-6 py-3 text-sm text-[#101417] transition hover:bg-white"
          style={{ fontFamily: 'var(--font-brand-display)' }}
        >
          <span>{landingContent.finalCta.button[locale]}</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </SectionReveal>
  )
}
