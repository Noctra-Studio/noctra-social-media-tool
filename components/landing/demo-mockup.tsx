'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Download, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SocialPlatformMark } from '@/components/ui/SocialPlatformMark'
import { landingContent, type LandingLocale } from '@/components/landing/content'
import { SectionLabel, SectionReveal } from '@/components/landing/section-reveal'
import type { Platform } from '@/lib/product'

type ComposeMockupProps = {
  compact?: boolean
  locale: LandingLocale
  activeTab?: Platform
  onTabChange?: (id: Platform) => void
}

function getTone(id: Platform) {
  switch (id) {
    case 'instagram':
      return 'from-[#D76DB6]/18 via-white/0 to-white/0'
    case 'linkedin':
      return 'from-[#7AA2F7]/16 via-white/0 to-white/0'
    case 'x':
      return 'from-white/12 via-white/0 to-white/0'
  }
}

export function ComposeMockup({
  compact = false,
  locale,
  activeTab: externalActiveTab,
  onTabChange,
}: ComposeMockupProps) {
  const tabs = landingContent.mockupTabs
  const [internalActiveTab, setInternalActiveTab] = useState<Platform>('instagram')

  const activeTab = (externalActiveTab ?? internalActiveTab) as Platform
  const setActiveTab = (id: Platform) => {
    if (onTabChange) {
      onTabChange(id)
    } else {
      setInternalActiveTab(id)
    }
  }

  const current = tabs.find((tab) => tab.id === activeTab) ?? tabs[0]

  useEffect(() => {
    if (compact || externalActiveTab) {
      return undefined
    }

    const interval = window.setInterval(() => {
      const nextIndex = (tabs.findIndex((tab) => tab.id === activeTab) + 1) % tabs.length
      setActiveTab(tabs[nextIndex].id as Platform)
    }, 3200)

    return () => {
      window.clearInterval(interval)
    }
  }, [compact, tabs, externalActiveTab, activeTab])

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[#14191F] shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(224,229,235,0.1),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(70,45,110,0.3),transparent_32%)]" />
      <div className="absolute inset-0 opacity-20 mix-blend-soft-light [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:36px_36px]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(rgba(255,255,255,0.9)_0.6px,transparent_0.6px)] [background-size:14px_14px]" />

      <div className="relative border-b border-white/8 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => {
            const platformId = tab.id as Platform
            const active = platformId === activeTab

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(platformId)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs transition ${
                  active
                    ? 'border-[#E0E5EB] bg-white/8 text-[#E0E5EB]'
                    : 'border-white/8 bg-white/[0.03] text-[#70798C] hover:border-white/15 hover:text-[#E0E5EB]'
                }`}
              >
                <SocialPlatformMark platform={platformId} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className={`relative p-4 sm:p-6 ${compact ? 'min-h-[340px]' : 'min-h-[430px]'}`}>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_35%)]" />

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.24em] text-[#8D95A6]">
                <Sparkles className="h-3.5 w-3.5 text-[#E0E5EB]" />
                <span>{current.badge[locale]}</span>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-[#244634] bg-[#16251B] px-3 py-1 text-[11px] text-[#9AE6B4]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{locale === 'es' ? 'Voz calibrada' : 'Voice calibrated'}</span>
              </div>
            </div>

            <div
              className={`rounded-[24px] border border-white/8 bg-gradient-to-br ${getTone(
                current.id as Platform
              )} px-5 py-5 sm:px-6 sm:py-6`}
            >
              <p className="max-w-2xl text-xl leading-tight text-[#E0E5EB] sm:text-[1.65rem] sm:leading-[1.1]" style={{ fontFamily: 'var(--font-brand-display)' }}>
                {current.hook[locale]}
              </p>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#A7AFBD] sm:text-[15px]">
                {current.body[locale]}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
              <div className="rounded-[22px] border border-white/8 bg-[#101417] px-5 py-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#4E576A]">
                  {locale === 'es' ? 'Vista previa' : 'Preview'}
                </p>
                <p className="mt-3 text-sm leading-7 text-[#C4CBD6]">
                  {current.footer[locale]}
                </p>
              </div>

              <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#4E576A]">
                  {locale === 'es' ? 'Salida' : 'Output'}
                </p>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-[#E0E5EB] transition hover:border-white/25"
                >
                  <Download className="h-4 w-4" />
                  <span>{current.exportLabel[locale]}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

type DemoMockupProps = {
  locale: LandingLocale
  activeTab?: Platform
  onTabChange?: (id: Platform) => void
}

export function DemoMockup({ locale, activeTab, onTabChange }: DemoMockupProps) {
  return (
    <SectionReveal id="demo" className="px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <SectionLabel>{landingContent.demo.label[locale]}</SectionLabel>
          <h2
            className="mt-4 max-w-3xl text-4xl leading-[0.96] text-[#E0E5EB] sm:text-5xl lg:text-[3.5rem]"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            {landingContent.demo.heading[locale]}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#8D95A6] sm:text-[16px]">
            {landingContent.demo.subheading[locale]}
          </p>
        </div>

        <div className="mt-12">
          <ComposeMockup locale={locale} activeTab={activeTab} onTabChange={onTabChange} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {landingContent.demo.platformPills.map((pill) => (
            <span
              key={pill.es}
              className="inline-flex items-center rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-[#C4CBD6]"
            >
              {pill[locale]}
            </span>
          ))}
        </div>
      </div>
    </SectionReveal>
  )
}
