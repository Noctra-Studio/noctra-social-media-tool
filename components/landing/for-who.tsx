'use client'

import { landingContent, type LandingLocale } from '@/components/landing/content'
import { SectionLabel, SectionReveal } from '@/components/landing/section-reveal'

export function ForWho({ locale }: { locale: LandingLocale }) {
  return (
    <SectionReveal id="para-quien" className="border-t border-white/6 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <SectionLabel>{landingContent.forWho.label[locale]}</SectionLabel>
          <h2
            className="mt-4 text-4xl leading-[0.96] text-[#E0E5EB] sm:text-5xl"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            {landingContent.forWho.heading[locale]}
          </h2>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          {landingContent.forWho.cards.map((card) => (
            <div
              key={card.title.es}
              className="rounded-[24px] border border-white/8 bg-white/[0.03] px-5 py-5 sm:px-6"
            >
              <div className="flex flex-wrap items-center gap-3">
                <h3
                  className="text-2xl text-[#E0E5EB]"
                  style={{ fontFamily: 'var(--font-brand-display)' }}
                >
                  {card.title[locale]}
                </h3>
                {card.note ? (
                  <span className="rounded-full border border-[#462D6E] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#E0E5EB]">
                    {card.note[locale]}
                  </span>
                ) : null}
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[#4E576A]">
                    {card.challengeLabel[locale]}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#8D95A6] sm:text-[15px]">
                    {card.challenge[locale]}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[#4E576A]">
                    {card.solutionLabel[locale]}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#E0E5EB] sm:text-[15px]">
                    {card.solution[locale]}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionReveal>
  )
}
