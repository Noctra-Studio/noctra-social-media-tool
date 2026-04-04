'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { landingContent, type LandingLocale } from '@/components/landing/content'
import { SectionLabel, SectionReveal } from '@/components/landing/section-reveal'

export function Faq({ locale }: { locale: LandingLocale }) {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <SectionReveal id="faq" className="border-t border-white/6 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-3xl">
          <SectionLabel>{landingContent.faq.label[locale]}</SectionLabel>
          <h2
            className="mt-4 text-4xl leading-[0.96] text-[#E0E5EB] sm:text-5xl"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            {landingContent.faq.heading[locale]}
          </h2>
        </div>

        <div className="mt-12 divide-y divide-white/6 rounded-[28px] border border-white/8 bg-white/[0.03]">
          {landingContent.faq.items.map((item, index) => {
            const isOpen = openIndex === index

            return (
              <div key={item.question.es} className="px-5 sm:px-6">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="flex min-h-[44px] w-full items-center justify-between gap-6 py-5 text-left"
                >
                  <span
                    className="text-lg text-[#E0E5EB]"
                    style={{ fontFamily: 'var(--font-brand-display)' }}
                  >
                    {item.question[locale]}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-[#4E576A] transition ${
                      isOpen ? 'rotate-180 text-[#E0E5EB]' : ''
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 text-sm leading-7 text-[#8D95A6] sm:text-[15px]">
                        {item.answer[locale]}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </SectionReveal>
  )
}
