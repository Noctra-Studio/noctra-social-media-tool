'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Lightbulb } from 'lucide-react'
import { useState, type ReactNode } from 'react'

type CollapsibleTipProps = {
  children: ReactNode
  summary: string
  title: string
}

export function CollapsibleTip({ children, summary, title }: CollapsibleTipProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="overflow-hidden rounded-2xl border border-[#2A3040] bg-[#1A1F28]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-start gap-4 border-l-[3px] border-[#462D6E] px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#462D6E]/60 bg-[#12161d] text-[#CDB8F8]">
          <Lightbulb className="h-4 w-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-base font-medium text-[#E0E5EB]">{title}</span>
          <span className="mt-1 block text-sm text-[#9CA4B4]">{summary}</span>
        </span>

        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="mt-1 shrink-0 text-[#8D95A6]"
        >
          <ChevronDown className="h-5 w-5" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#2A3040] px-5 py-5 text-[15px] leading-[1.75] text-[#E0E5EB]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
