'use client'

import { useLocale } from 'next-intl'
import { Comparison } from '@/components/landing/comparison'
import { CtaFinal } from '@/components/landing/cta-final'
import { DemoMockup } from '@/components/landing/demo-mockup'
import { ExampleOutputs } from '@/components/landing/example-outputs'
import { LandingFooter } from '@/components/landing/footer'
import { Faq } from '@/components/landing/faq'
import { Features } from '@/components/landing/features'
import { EditorShowcase } from '@/components/landing/editor-showcase'
import { ForWho } from '@/components/landing/for-who'
import { Hero } from '@/components/landing/hero'
import { HowItWorks } from '@/components/landing/how-it-works'
import { LandingNavbar } from '@/components/landing/navbar'
import { type LandingLocale } from '@/components/landing/content'
import { Pricing } from '@/components/landing/pricing'
import { Problem } from '@/components/landing/problem'
import type { Platform } from '@/lib/product'
import { useState } from 'react'

export function LandingPage() {
  const locale = useLocale() as LandingLocale
  const [activeDemoTab, setActiveDemoTab] = useState<Platform>('instagram')

  const handleShowPlatformDemo = (platform: Platform) => {
    setActiveDemoTab(platform)
    const element = document.getElementById('demo')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-[#101417] text-[#E0E5EB]">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(224,229,235,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(70,45,110,0.18),transparent_32%)]" />
      <div className="fixed inset-0 -z-10 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:72px_72px]" />

      <LandingNavbar locale={locale} />

      <main>
        <Hero locale={locale} />
        <Problem locale={locale} />
        <DemoMockup
          locale={locale}
          activeTab={activeDemoTab}
          onTabChange={setActiveDemoTab}
        />
        <HowItWorks locale={locale} />
        <Features locale={locale} />
        <EditorShowcase locale={locale} />
        <ForWho locale={locale} />
        <Comparison locale={locale} />
        <ExampleOutputs locale={locale} onShowPlatformDemo={handleShowPlatformDemo} />
        <Pricing locale={locale} />
        <Faq locale={locale} />
        <CtaFinal locale={locale} />
      </main>

      <LandingFooter locale={locale} />
    </div>
  )
}
