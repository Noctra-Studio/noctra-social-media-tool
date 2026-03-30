'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { landingContent, type LandingLocale } from '@/components/landing/content'
import { SectionLabel, SectionReveal } from '@/components/landing/section-reveal'

export function Pricing({ locale }: { locale: LandingLocale }) {
  return (
    <SectionReveal id="precios" className="border-t border-white/6 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <SectionLabel>{landingContent.pricing.label[locale]}</SectionLabel>
          <h2
            className="mt-4 text-4xl leading-[0.96] text-[#E0E5EB] sm:text-5xl"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            {landingContent.pricing.heading[locale]}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#8D95A6]">
            {landingContent.pricing.note[locale]}
          </p>
        </div>

        <div className="mt-12 flex justify-center">
          <div className="w-full max-w-[480px] rounded-[28px] border border-[#4E576A] bg-[#212631] px-6 py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p
                  className="text-3xl text-[#E0E5EB]"
                  style={{ fontFamily: 'var(--font-brand-display)' }}
                >
                  {landingContent.pricing.title}
                </p>
                <p className="mt-2 max-w-[280px] text-sm leading-7 text-[#A7AFBD]">
                  {landingContent.pricing.subtitle[locale]}
                </p>
              </div>

              <span className="rounded-full border border-[#462D6E] px-3 py-1 text-xs text-[#E0E5EB]">
                {landingContent.pricing.badge[locale]}
              </span>
            </div>

            <Link
              href="mailto:hello@noctra.design?subject=Acceso%20Noctra%20Social"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#E0E5EB] px-5 py-3 text-sm text-[#101417] transition hover:bg-white"
              style={{ fontFamily: 'var(--font-brand-display)' }}
            >
              <span>{landingContent.pricing.button[locale]}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <p className="mt-4 text-xs text-[#4E576A]">
              {landingContent.pricing.responseTime[locale]}
            </p>
          </div>
        </div>
      </div>
    </SectionReveal>
  )
}
