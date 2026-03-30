'use client'

import { motion } from 'framer-motion'

type SectionRevealProps = {
  children: React.ReactNode
  className?: string
  id?: string
}

export function SectionReveal({
  children,
  className = '',
  id,
}: SectionRevealProps) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      viewport={{ amount: 0.2, once: true }}
      whileInView={{ opacity: 1, y: 0 }}
      className={className}
    >
      {children}
    </motion.section>
  )
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.34em] text-[#4E576A]">
      {children}
    </p>
  )
}
