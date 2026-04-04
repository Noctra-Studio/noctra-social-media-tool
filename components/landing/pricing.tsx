'use client'

import { useState } from 'react'
import { landingContent, type LandingLocale } from '@/components/landing/content'
import { SectionLabel, SectionReveal } from '@/components/landing/section-reveal'
import { PricingCard } from './pricing-card'

export function Pricing({ locale }: { locale: LandingLocale }) {
  const { pricing } = landingContent
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [currency, setCurrency] = useState<'MXN' | 'USD'>('MXN')

  return (
    <SectionReveal id="precios" className="border-t border-white/6 px-6 py-24 sm:px-8 lg:px-10 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center text-center">
          <SectionLabel>{pricing.label[locale]}</SectionLabel>
          <h2
            className="mt-4 max-w-2xl text-4xl leading-[1.1] text-[#E0E5EB] sm:text-5xl lg:text-6xl"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            {pricing.heading[locale]}
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#8D95A6]">
            {pricing.subheading[locale]}
          </p>
        </div>

        <div className="mt-16 flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            {/* Billing Toggle */}
            <div className="flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`rounded-xl px-5 py-2 text-xs font-bold transition ${
                  billingCycle === 'monthly'
                    ? 'bg-[#E0E5EB] text-[#101417]'
                    : 'text-[#8D95A6] hover:text-[#E0E5EB]'
                }`}
              >
                {pricing.billing.monthly[locale]}
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`rounded-xl px-5 py-2 text-xs font-bold transition ${
                  billingCycle === 'annual'
                    ? 'bg-[#E0E5EB] text-[#101417]'
                    : 'text-[#8D95A6] hover:text-[#E0E5EB]'
                }`}
              >
                {pricing.billing.annual[locale]}
              </button>
            </div>

            {/* Currency Toggle */}
            <div className="flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
              <button
                onClick={() => setCurrency('MXN')}
                className={`rounded-xl px-5 py-2 text-xs font-bold transition ${
                  currency === 'MXN'
                    ? 'bg-[#E0E5EB] text-[#101417]'
                    : 'text-[#8D95A6] hover:text-[#E0E5EB]'
                }`}
              >
                MXN
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`rounded-xl px-5 py-2 text-xs font-bold transition ${
                  currency === 'USD'
                    ? 'bg-[#E0E5EB] text-[#101417]'
                    : 'text-[#8D95A6] hover:text-[#E0E5EB]'
                }`}
              >
                USD
              </button>
            </div>
          </div>

          {currency === 'USD' && (
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#4E576A]">
              {pricing.currencyNote[locale]}
            </p>
          )}
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
          {pricing.plans.map((plan, index) => (
            <PricingCard
              key={index}
              locale={locale}
              plan={plan}
              billingCycle={billingCycle}
              currency={currency}
            />
          ))}
        </div>
      </div>
    </SectionReveal>
  )
}
