'use client'

import {
  BrainCircuit,
  CalendarDays,
  FolderOutput,
  Layers3,
  MessageSquareQuote,
  Sparkles,
  Target,
  Users2,
  Zap,
} from 'lucide-react'
import { landingContent, type LandingLocale } from '@/components/landing/content'
import { SectionLabel, SectionReveal } from '@/components/landing/section-reveal'

const icons = {
  brain: BrainCircuit,
  calendar: CalendarDays,
  folder: FolderOutput,
  layers: Layers3,
  lightning: Zap,
  message: MessageSquareQuote,
  sparkles: Sparkles,
  target: Target,
  users: Users2,
}

export function Features({ locale }: { locale: LandingLocale }) {
  return (
    <SectionReveal id="capacidades" className="border-t border-white/6 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <SectionLabel>{landingContent.features.label[locale]}</SectionLabel>
          <h2
            className="mt-4 text-4xl leading-[0.96] text-[#E0E5EB] sm:text-5xl"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            {landingContent.features.heading[locale]}
          </h2>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {landingContent.features.items.map((feature) => {
            const Icon = icons[feature.icon]

            return (
              <div
                key={feature.title.es}
                className="rounded-[24px] border border-white/8 bg-white/[0.03] px-5 py-5 sm:px-6"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#14191F] text-[#E0E5EB]">
                  <Icon className="h-5 w-5" />
                </div>

                <h3
                  className="mt-5 text-xl text-[#E0E5EB]"
                  style={{ fontFamily: 'var(--font-brand-display)' }}
                >
                  {feature.title[locale]}
                </h3>

                <p className="mt-3 text-sm leading-7 text-[#8D95A6] sm:text-[15px]">
                  {feature.description[locale]}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </SectionReveal>
  )
}
