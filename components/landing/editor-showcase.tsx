'use client'

import { landingContent, type LandingLocale } from '@/components/landing/content'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Check } from 'lucide-react'

export function EditorShowcase({ locale }: { locale: LandingLocale }) {
  const content = landingContent.editorShowcase

  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="container relative mx-auto px-6">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#E0E5EB]"
          >
            {content.label[locale]}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-medium tracking-tight text-[#E0E5EB] sm:text-5xl"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            {content.heading[locale]}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg leading-8 text-[#8D95A6]"
          >
            {content.subheading[locale]}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="relative mt-16 sm:mt-24"
        >
          {/* Ambient Glows */}
          <div className="absolute -inset-4 -z-10 rounded-[32px] bg-gradient-to-tr from-white/5 to-transparent blur-3xl" />
          <div className="absolute -top-24 left-1/2 -z-10 h-64 w-96 -translate-x-1/2 bg-[#462D6E]/20 blur-[120px]" />

          {/* Screenshot Container */}
          <div className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-[#101417] shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />
            
            <Image
              src="/images/live-editor.png"
              alt="Noctra Studio Editor"
              width={1920}
              height={1080}
              className="w-full transition-transform duration-700 group-hover:scale-[1.02]"
              priority
            />

            {/* Feature Chips Overlay (Desktop only-ish) */}
            <div className="absolute bottom-8 left-8 hidden items-center gap-3 sm:flex">
                {content.features.map((feature, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + (idx * 0.1) }}
                        className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs font-medium text-[#E0E5EB] backdrop-blur-md"
                    >
                        <Check className="h-3 w-3 text-emerald-400" />
                        {feature[locale]}
                    </motion.div>
                ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
