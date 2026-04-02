'use client'

import { landingContent, type LandingLocale } from '@/components/landing/content'
import { SectionLabel, SectionReveal } from '@/components/landing/section-reveal'

export function ForWho({ locale }: { locale: LandingLocale }) {
  return (
    <SectionReveal id="esto-es-para-ti" className="border-t border-white/6 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <SectionLabel>{landingContent.forWho.label[locale]}</SectionLabel>
          <h2
            className="mt-4 text-4xl leading-[1.1] text-[#E0E5EB] sm:text-5xl lg:text-6xl"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            {landingContent.forWho.heading[locale]}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[#8D95A6]">
            {landingContent.forWho.intro[locale]}
          </p>
        </div>

        <div className="mt-16 grid gap-x-12 gap-y-8 sm:grid-cols-2">
          {landingContent.forWho.bullets.map((bullet, index) => (
            <div key={index} className="flex gap-4">
              <div className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[10px] text-[#A7AFBD]">
                {index + 1}
              </div>
              <p className="text-base leading-relaxed text-[#E0E5EB] sm:text-lg">
                {bullet[locale]}
              </p>
            </div>
          ))}
        </div>
      </div>
    </SectionReveal>
  )
}
