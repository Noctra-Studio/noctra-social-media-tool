'use client'

import { ArrowRight } from 'lucide-react'
import { landingContent, type LandingLocale } from '@/components/landing/content'
import { SectionLabel, SectionReveal } from '@/components/landing/section-reveal'
import type { Platform } from '@/lib/product'

type ExampleOutputsProps = {
  locale: LandingLocale
  onShowPlatformDemo?: (platform: Platform) => void
}

export function ExampleOutputs({ locale, onShowPlatformDemo }: ExampleOutputsProps) {
  const { exampleOutputs } = landingContent

  const handleCtaClick = (id: string) => {
    if (!onShowPlatformDemo) return

    // Map content ID to platform mockup
    let platform: Platform = 'linkedin'
    if (id === 'storytelling') platform = 'x'
    if (id === 'authority') platform = 'instagram'

    onShowPlatformDemo(platform)
  }

  return (
    <SectionReveal id="ejemplos" className="border-t border-white/6 py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="px-6 sm:px-8 lg:px-10">
          <div className="max-w-3xl">
            <SectionLabel>{exampleOutputs.label[locale]}</SectionLabel>
            <h2
              className="mt-4 text-4xl leading-[1.1] text-[#E0E5EB] sm:text-5xl lg:text-6xl"
              style={{ fontFamily: 'var(--font-brand-display)' }}
            >
              {exampleOutputs.heading[locale]}
            </h2>
          </div>
        </div>

        {/* Scrollable Container with padding logic */}
        <div className="mt-16 overflow-x-auto pb-12 lg:overflow-visible lg:px-10">
          <div className="flex min-w-max gap-6 px-6 sm:px-8 lg:grid lg:min-w-0 lg:grid-cols-3 lg:gap-8 lg:px-0">
            {exampleOutputs.items.map((item) => (
              <div
                key={item.id}
                className="flex w-[82vw] flex-col rounded-[40px] border border-white/10 bg-white/[0.02] p-8 transition-all duration-300 hover:border-white/20 sm:w-[380px] lg:w-full lg:p-10"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#4E576A]">
                    {item.badge[locale]}
                  </span>
                </div>

                <blockquote className="mt-10 flex flex-1 flex-col">
                  <p
                    className="text-2xl leading-[1.25] text-white lg:text-[1.75rem]"
                    style={{ fontFamily: 'var(--font-brand-display)' }}
                  >
                    "{item.hook[locale]}"
                  </p>
                  <p className="mt-8 text-base leading-relaxed text-[#8D95A6] lg:text-lg">
                    {item.body[locale]}
                  </p>
                </blockquote>

                <button
                  type="button"
                  onClick={() => handleCtaClick(item.id)}
                  className="group mt-12 flex items-center gap-2 text-sm font-semibold text-[#E0E5EB] transition-colors hover:text-white"
                >
                  <span>{item.cta[locale]}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionReveal>
  )
}
