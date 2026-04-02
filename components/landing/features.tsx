'use client'

import {
  Brain,
  Calendar,
  Folder,
  Layers,
  Zap,
  MessageSquare,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'
import { landingContent, type LandingLocale } from '@/components/landing/content'
import { SectionLabel, SectionReveal } from '@/components/landing/section-reveal'

const iconMap = {
  brain: Brain,
  calendar: Calendar,
  folder: Folder,
  layers: Layers,
  lightning: Zap,
  message: MessageSquare,
  sparkles: Sparkles,
  target: Target,
  users: Users,
}

export function Features({ locale }: { locale: LandingLocale }) {
  const { features } = landingContent

  return (
    <SectionReveal id="capacidades" className="border-t border-white/6 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <SectionLabel>{features.label[locale]}</SectionLabel>
          <h2
            className="mt-4 text-4xl leading-[1.1] text-[#E0E5EB] sm:text-5xl lg:text-6xl"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            {features.heading[locale]}
          </h2>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {features.items.map((item, index) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap] || Sparkles

            return (
              <div
                key={index}
                className="group relative rounded-[32px] border border-white/8 bg-white/[0.02] p-8 transition-all hover:border-white/15 hover:bg-white/[0.04]"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#E0E5EB] transition-transform group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </div>
                <h3
                  className="mt-8 text-xl font-semibold text-[#E0E5EB]"
                  style={{ fontFamily: 'var(--font-brand-display)' }}
                >
                  {item.title[locale]}
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed text-[#8D95A6]">
                  {item.description[locale]}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </SectionReveal>
  )
}
