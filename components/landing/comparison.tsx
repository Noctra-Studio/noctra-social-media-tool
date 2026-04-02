'use client'

import { Minus, Plus, ArrowRight } from 'lucide-react'
import {
  landingContent,
  type LandingLocale,
} from '@/components/landing/content'
import { SectionLabel, SectionReveal } from '@/components/landing/section-reveal'

export function Comparison({ locale }: { locale: LandingLocale }) {
  const { comparison } = landingContent

  return (
    <SectionReveal id="comparativa" className="border-t border-white/6 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <SectionLabel>{comparison.label[locale]}</SectionLabel>
          <h2
            className="mt-4 text-4xl leading-[1.1] text-[#E0E5EB] sm:text-5xl lg:text-6xl"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            {comparison.heading[locale]}
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#8D95A6]">
            {comparison.subheading[locale]}
          </p>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-2 lg:gap-20">
          {/* Before: Chaos */}
          <div className="group relative rounded-[40px] border border-white/5 bg-[#14181F] p-8 transition-colors hover:border-white/10 sm:p-12">
            <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#4E576A]">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#4E576A]/30">
                <Minus className="h-3.5 w-3.5" />
              </div>
              {locale === 'es' ? 'Antes: El Caos' : 'Before: The Chaos'}
            </div>

            <ul className="mt-12 space-y-10">
              {comparison.items.map((item, i) => (
                <li key={i} className="flex items-start gap-5 opacity-60 grayscale transition-opacity duration-300 group-hover:opacity-100 group-hover:grayscale-0">
                  <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#4E576A]" />
                  <p className="max-w-md text-lg leading-relaxed text-[#8D95A6] line-through decoration-[#4E576A]/40">
                    {item.before[locale]}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* After: The System */}
          <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-br from-[#1C212A] to-[#14181F] p-8 shadow-2xl shadow-emerald-900/10 transition-all duration-500 hover:border-emerald-500/30 sm:p-12">
            <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-emerald-500/10 blur-[90px]" />
            
            <div className="relative flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 shadow-[0_0_15px_rgba(52,211,153,0.1)]">
                <Plus className="h-3.5 w-3.5" />
              </div>
              {locale === 'es' ? 'Después: El Sistema' : 'After: The System'}
            </div>

            <ul className="mt-12 space-y-10">
              {comparison.items.map((item, i) => (
                <li key={i} className="group/item relative flex items-start gap-5">
                  <div className="mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-4 ring-emerald-500/5 transition-transform group-hover/item:scale-110">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                  <p className="max-w-md text-xl font-medium leading-normal text-white">
                    {item.after[locale]}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </SectionReveal>
  )
}
