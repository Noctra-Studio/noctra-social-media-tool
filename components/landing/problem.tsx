'use client'

import { Check, X } from 'lucide-react'
import { landingContent, type LandingLocale } from '@/components/landing/content'
import { SectionLabel, SectionReveal } from '@/components/landing/section-reveal'

export function Problem({ locale }: { locale: LandingLocale }) {
  return (
    <SectionReveal id="el-problema" className="border-t border-white/6 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <SectionLabel>{landingContent.problem.label[locale]}</SectionLabel>
          <h2
            className="mt-4 text-4xl leading-[0.96] text-[#E0E5EB] sm:text-5xl"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            {landingContent.problem.heading[locale]}
          </h2>
        </div>

        <div className="mt-12 grid gap-4">
          {landingContent.problem.pairs.map((pair) => (
            <div
              key={pair.problem.es}
              className="grid gap-4 rounded-[24px] border border-white/8 bg-white/[0.03] px-5 py-5 sm:px-6 lg:grid-cols-2 lg:gap-8"
            >
              <div className="flex gap-3">
                <div className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#5D242A] bg-[#241417] text-[#C67B84]">
                  <X className="h-3.5 w-3.5" />
                </div>
                <p className="text-sm leading-7 text-[#6F798B] sm:text-[15px]">
                  {pair.problem[locale]}
                </p>
              </div>

              <div className="flex gap-3">
                <div className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#244634] bg-[#16251B] text-[#4ADE80]">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <p className="text-sm leading-7 text-[#E0E5EB] sm:text-[15px]">
                  {pair.solution[locale]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionReveal>
  )
}
