'use client'

import Link from 'next/link'
import { ArrowRight, ArrowDown } from 'lucide-react'
import { ComposeMockup } from '@/components/landing/demo-mockup'
import { landingContent, type LandingLocale } from '@/components/landing/content'
import { SectionReveal } from '@/components/landing/section-reveal'

export function Hero({ locale }: { locale: LandingLocale }) {
  return (
    <SectionReveal id="hero" className="px-6 pb-20 pt-12 sm:px-8 sm:pb-24 lg:px-10 lg:pb-32 lg:pt-20">
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(380px,520px)] lg:gap-12">
        <div className="max-w-3xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-[#4E576A]">
            {landingContent.hero.label[locale]}
          </p>

          <h1
            className="mt-6 max-w-[20ch] text-4xl leading-[1.1] text-[#E0E5EB] sm:text-5xl lg:text-[3.75rem] lg:leading-[1.1]"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            {landingContent.hero.title[locale]}
          </h1>

          <p className="mt-6 max-w-[540px] text-lg leading-relaxed text-[#8D95A6] lg:text-xl">
            {landingContent.hero.subheadline[locale]}
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <Link
              href="/login"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#E0E5EB] px-8 py-3.5 text-sm font-semibold text-[#101417] transition-all hover:bg-white hover:shadow-[0_0_30px_rgba(224,229,235,0.1)] sm:w-auto"
              style={{ fontFamily: 'var(--font-brand-display)' }}
            >
              <span>{landingContent.hero.cta[locale]}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <a
              href="#demo"
              className="group inline-flex h-12 items-center justify-center gap-2 px-4 shadow-[0_1px_rgba(255,255,255,0.05)_inset,0_-1px_rgba(0,0,0,0.1)_inset] text-sm font-medium text-[#4E576A] transition-colors hover:text-[#E0E5EB] sm:h-auto sm:px-0 sm:shadow-none"
            >
              <span>{landingContent.hero.secondaryCta[locale]}</span>
              <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            </a>
          </div>

          <div className="mt-10 flex items-center gap-4">
            <div className="h-px w-10 bg-white/10" />
            <p className="text-[13px] font-medium text-[#4E576A]">
              {landingContent.hero.trustLine[locale]}
            </p>
          </div>
        </div>

        <div className="relative lg:pt-4">
          <div className="absolute inset-0 -z-10 rounded-[48px] bg-[radial-gradient(circle_at_top,rgba(224,229,235,0.12),transparent_65%)] blur-[100px]" />
          <div className="relative rounded-[36px] bg-white/[0.01] p-1.5 shadow-[0_0_1px_rgba(255,255,255,0.1)_inset] sm:p-2">
            <ComposeMockup compact locale={locale} />
          </div>
        </div>
      </div>
    </SectionReveal>
  )
}
