'use client'

import { landingContent, type LandingLocale } from '@/components/landing/content'
import { SectionLabel, SectionReveal } from '@/components/landing/section-reveal'

export function HowItWorks({ locale }: { locale: LandingLocale }) {
  return (
    <SectionReveal id="como-funciona" className="border-t border-white/6 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <SectionLabel>{landingContent.howItWorks.label[locale]}</SectionLabel>
          <h2
            className="mt-4 text-4xl leading-[0.96] text-[#E0E5EB] sm:text-5xl"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            {landingContent.howItWorks.heading[locale]}
          </h2>
        </div>

        <div className="mt-12 divide-y divide-white/6 rounded-[28px] border border-white/8 bg-white/[0.03]">
          {landingContent.howItWorks.steps.map((step, index) => (
            <div
              key={step.title.es}
              className="grid gap-4 px-5 py-6 sm:px-6 lg:grid-cols-[84px_280px_minmax(0,1fr)] lg:items-start lg:gap-6"
            >
              <span
                className="text-2xl text-[#4E576A]"
                style={{ fontFamily: 'var(--font-brand-display)' }}
              >
                {String(index + 1).padStart(2, '0')}
              </span>

              <h3
                className="text-xl text-[#E0E5EB]"
                style={{ fontFamily: 'var(--font-brand-display)' }}
              >
                {step.title[locale]}
              </h3>

              <p className="max-w-2xl text-sm leading-7 text-[#8D95A6] sm:text-[15px]">
                {step.body[locale]}
              </p>
            </div>
          ))}
        </div>
      </div>
    </SectionReveal>
  )
}
