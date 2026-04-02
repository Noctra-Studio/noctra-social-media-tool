'use client'

import { EarlyAccessCard } from './early-access-card'
import { landingContent, type LandingLocale } from '@/components/landing/content'
import { SectionLabel, SectionReveal } from '@/components/landing/section-reveal'

export function Pricing({ locale }: { locale: LandingLocale }) {
  const { pricing } = landingContent

  return (
    <SectionReveal id="precios" className="border-t border-white/6 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <SectionLabel>{pricing.label[locale]}</SectionLabel>
          <h2
            className="mt-4 text-4xl leading-[1.1] text-[#E0E5EB] sm:text-5xl lg:text-6xl"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            {pricing.heading[locale]}
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#8D95A6]">
            {pricing.note[locale]}
          </p>
        </div>

        <div className="mt-16 flex justify-center">
          <EarlyAccessCard
            locale={locale}
            title={pricing.title}
            badge={pricing.badge[locale]}
            description={pricing.subtitle[locale]}
            buttonText={pricing.button[locale]}
            microcopy={pricing.responseTime[locale]}
            ctaHref="mailto:hello@noctra.design?subject=Acceso%20Noctra%20Social"
          />
        </div>
      </div>
    </SectionReveal>
  )
}
