'use client'

import Link from 'next/link'
import { ArrowRight, ArrowDown } from 'lucide-react'
import { ComposeMockup } from '@/components/landing/demo-mockup'
import { landingContent, type LandingLocale } from '@/components/landing/content'
import { SectionReveal } from '@/components/landing/section-reveal'

export function Hero({ locale }: { locale: LandingLocale }) {
  return (
    <SectionReveal id="hero" className="px-6 pb-20 pt-14 sm:px-8 sm:pb-24 lg:px-10 lg:pb-28 lg:pt-20">
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(360px,500px)] lg:gap-12">
        <div className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.34em] text-[#4E576A]">
            {landingContent.hero.label[locale]}
          </p>

          <h1
            className="mt-5 text-4xl leading-[0.94] text-[#E0E5EB] sm:text-5xl lg:text-[3.5rem]"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            {landingContent.hero.title[locale]}
          </h1>

          <p className="mt-5 max-w-[520px] text-base leading-7 text-[#8D95A6] sm:text-lg">
            {landingContent.hero.subheadline[locale]}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-[#E0E5EB] px-6 py-3 text-sm text-[#101417] transition hover:bg-white"
              style={{ fontFamily: 'var(--font-brand-display)' }}
            >
              <span>{landingContent.hero.cta[locale]}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#como-funciona"
              className="inline-flex items-center gap-2 text-sm text-[#4E576A] transition hover:text-[#E0E5EB]"
            >
              <span>{landingContent.hero.secondaryCta[locale]}</span>
              <ArrowDown className="h-4 w-4" />
            </a>
          </div>

          <p className="mt-6 text-[13px] text-[#4E576A]">
            {landingContent.hero.trustLine[locale]}
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-[36px] bg-[radial-gradient(circle_at_top,rgba(224,229,235,0.09),transparent_56%)] blur-3xl" />
          <ComposeMockup compact locale={locale} />
        </div>
      </div>
    </SectionReveal>
  )
}
