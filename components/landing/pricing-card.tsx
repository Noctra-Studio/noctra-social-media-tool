'use client'

import { Check } from 'lucide-react'
import { landingContent, type LandingLocale } from '@/components/landing/content'

type PricingCardProps = {
  locale: LandingLocale
  plan: typeof landingContent.pricing.plans[0]
  billingCycle: 'monthly' | 'annual'
  currency: 'MXN' | 'USD'
}

const USD_MXN_RATE = 17.9

export function PricingCard({ locale, plan, billingCycle, currency }: PricingCardProps) {
  const { pricing } = landingContent
  
  const rawRegular = plan[billingCycle].regular
  const rawFounder = plan[billingCycle].founder
  
  const formatPrice = (amount: number) => {
    if (currency === 'USD') {
      const converted = Math.round(amount / USD_MXN_RATE)
      return `$${converted}`
    }
    return `MXN ${amount}`
  }

  const strikePrice = formatPrice(rawRegular)
  const mainPrice = formatPrice(rawFounder)
  
  const periodLabel = billingCycle === 'monthly' 
    ? (locale === 'es' ? '/mes' : '/mo') 
    : (locale === 'es' ? '/año' : '/yr')

  return (
    <div className={`group relative flex flex-col rounded-[2.5rem] border p-8 transition-all duration-300 ${
      plan.popular 
        ? 'border-white/20 bg-white/[0.04] shadow-[0_32px_120px_rgba(255,255,255,0.06)]' 
        : 'border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.03]'
    }`}>
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#E0E5EB] px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-[#101417]">
          {locale === 'es' ? 'Más popular' : 'Most popular'}
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-[#E0E5EB]" style={{ fontFamily: 'var(--font-brand-display)' }}>
            {plan.title[locale]}
          </h3>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            {pricing.founderBadge[locale]}
          </span>
        </div>
        
        <div className="mt-6 flex items-baseline gap-2">
          <span className="text-sm text-[#4E576A] line-through decoration-[#4E576A]/50">
            {strikePrice}
          </span>
          <span className="text-4xl font-bold text-white" style={{ fontFamily: 'var(--font-brand-display)' }}>
            {mainPrice}
          </span>
          <span className="text-sm text-[#8D95A6]">{periodLabel}</span>
        </div>
        
        <p className="mt-3 text-[13px] leading-relaxed text-[#8D95A6]">
          {pricing.founderNote[locale]}
        </p>
      </div>

      <div className="mb-10 flex-1 space-y-4">
        {plan.features.map((feature, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <Check className="h-2.5 w-2.5" />
            </div>
            <span className="text-[14px] text-[#A7AFBD]">
              {feature[locale]}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <button className={`w-full rounded-2xl py-4 text-sm font-bold transition-all duration-200 ${
          plan.popular 
            ? 'bg-[#E0E5EB] text-[#101417] hover:bg-white' 
            : 'border border-[#4E576A] text-[#E0E5EB] hover:border-white/40 hover:bg-white/5'
        }`}>
          {pricing.cta[locale]}
        </button>
        
        <p className="text-center text-[11px] text-[#4E576A]">
          {pricing.urgencyNote[locale]}
        </p>
      </div>
    </div>
  )
}
