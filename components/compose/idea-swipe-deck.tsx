'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { MoveRight } from 'lucide-react'
import type { SuggestedIdea } from '@/lib/product'

type IdeaSwipeDeckProps = {
  activePlatform?: string
  ideas: SuggestedIdea[]
  onDevelop: (idea: SuggestedIdea) => void
  onRequestMore: () => void
  onSave: (idea: SuggestedIdea) => void
  onSkip: (idea: SuggestedIdea) => void
  savedKeys: Record<string, string>
}

type DeckAction = 'develop' | 'save' | 'skip'

const transition = {
  duration: 0.25,
  ease: 'easeOut',
} as const

function getSuggestedIdeaKey(idea: SuggestedIdea) {
  return `${idea.title}-${idea.angle}`
}

function getExitAnimation(action: DeckAction | null) {
  if (action === 'save') {
    return {
      opacity: 0,
      x: '120%',
    }
  }

  if (action === 'develop') {
    return {
      opacity: 0,
      scale: 1.02,
      y: -40,
    }
  }

  return {
    opacity: 0,
    x: '-120%',
  }
}

export function IdeaSwipeDeck({
  activePlatform,
  ideas,
  onDevelop,
  onRequestMore,
  onSave,
  onSkip,
  savedKeys,
}: IdeaSwipeDeckProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [action, setAction] = useState<DeckAction | null>(null)
  const timeoutRef = useRef<number | null>(null)

  const currentIdea = ideas[activeIndex]
  const nextIdea = ideas[activeIndex + 1]
  const thirdIdea = ideas[activeIndex + 2]
  const progressCurrent = Math.min(activeIndex + 1, ideas.length)

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleAction = (nextAction: DeckAction) => {
    if (!currentIdea || action) {
      return
    }

    setAction(nextAction)

    timeoutRef.current = window.setTimeout(() => {
      if (nextAction === 'develop') {
        onDevelop(currentIdea)
      } else if (nextAction === 'save') {
        onSave(currentIdea)
      } else {
        onSkip(currentIdea)
      }

      setActiveIndex((current) => current + 1)
      setAction(null)
      timeoutRef.current = null
    }, 250)
  }

  if (!currentIdea) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[28px] border border-dashed border-zinc-700 bg-[#101417]/50 p-6 text-center">
        <p className="max-w-md text-sm leading-6 text-[#8D95A6]">
          Ya revisaste las 3 ideas. Pide una nueva tanda para seguir explorando.
        </p>
        <button
          type="button"
          onClick={onRequestMore}
          className="mt-5 rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition-transform hover:scale-[1.01]"
        >
          Sugerir 3 nuevas
        </button>
      </div>
    )
  }

  const currentKey = getSuggestedIdeaKey(currentIdea)
  const isSaved = Boolean(savedKeys[currentKey])

  return (
    <div className="space-y-6">
      <div className="relative mx-auto min-h-[360px] max-w-2xl">
        {thirdIdea ? (
          <div className="pointer-events-none absolute inset-0 z-0 translate-y-5 scale-90 rounded-[28px] border border-white/8 bg-[#101417]/45 p-6 opacity-35" />
        ) : null}

        {nextIdea ? (
          <div className="pointer-events-none absolute inset-0 z-10 translate-y-3 scale-95 rounded-[28px] border border-white/8 bg-[#101417]/70 p-6 opacity-60" />
        ) : null}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentKey}
            initial={{
              opacity: 0,
              scale: 0.95,
              y: 14,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              x: 0,
              y: 0,
            }}
            exit={getExitAnimation(action)}
            transition={transition}
            className="absolute inset-0 z-20 rounded-[28px] border border-white/10 bg-[#101417] p-6"
          >
            {activePlatform === 'x' ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
                      <svg viewBox="0 0 24 24" fill="black" className="h-3 w-3">
                        <path d="m5.53 4.5 5.09 6.82L5.5 19.5h1.88l4.08-6.2 4.63 6.2h4.41l-5.38-7.2 4.76-7.8H18l-3.75 5.86L9.91 4.5H5.53Z" />
                      </svg>
                    </div>
                    <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-[#B5BDCA]">
                      {currentIdea.angle}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAction('develop')}
                  disabled={Boolean(action)}
                  className="mt-4 block w-full text-left disabled:opacity-60"
                >
                  <p className="text-lg font-medium text-[#E0E5EB]" style={{ fontFamily: 'var(--font-brand-display)' }}>
                    {currentIdea.title}
                  </p>

                  <div className="mt-3 rounded-[16px] border border-white/[0.08] bg-[#0D1014] p-3">
                    <p className="text-[13px] leading-6 text-[#D5DBE5]">
                      {currentIdea.hook}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-[#4E576A]">Hook del thread</span>
                      <span className={`font-mono text-[11px] font-medium ${
                        currentIdea.hook.length > 240 ? 'text-red-400' :
                        currentIdea.hook.length > 200 ? 'text-amber-400' :
                        'text-[#4E576A]'
                      }`}>
                        {currentIdea.hook.length} / 270
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-start gap-2">
                    <span className="mt-0.5 text-[#462D6E]">✦</span>
                    <p className="text-[12px] leading-5 text-[#8D95A6]">
                      {currentIdea.why_now}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-[10px] text-[#4E576A]">Formato sugerido:</span>
                    <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-[#B5BDCA]">
                      {currentIdea.hook.length > 200 ? 'Hilo' : 'Tweet único'}
                    </span>
                  </div>

                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white underline-offset-2 hover:underline">
                    Desarrollar esta idea
                    <MoveRight className="h-4 w-4" />
                  </div>
                </button>
              </>
            ) : (
              <>
                <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs uppercase tracking-[0.24em] text-[#8D95A6] inline-flex">
                  {currentIdea.angle}
                </div>

                <p
                  className="mt-5 text-xl font-medium text-[#E0E5EB]"
                  style={{ fontFamily: 'var(--font-brand-display)' }}
                >
                  {currentIdea.title}
                </p>

                <p className="mt-3 text-sm leading-relaxed text-[#D5DBE5]">
                  {currentIdea.hook}
                </p>

                <p className="mt-4 inline-flex rounded-full bg-[#462D6E]/15 px-3 py-1 text-xs text-[#D3C2F1]">
                  Por qué ahora: {currentIdea.why_now}
                </p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => handleAction('skip')}
          disabled={Boolean(action)}
          className="rounded-full border border-white/10 px-5 py-2 text-sm text-[#8D95A6] transition-colors hover:border-white/20 hover:bg-white/5 disabled:opacity-60"
        >
          ✕ Saltar
        </button>
        <button
          type="button"
          onClick={() => handleAction('develop')}
          disabled={Boolean(action)}
          className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition-transform hover:scale-[1.01] disabled:opacity-60"
        >
          ✓ Desarrollar
        </button>
        <button
          type="button"
          onClick={() => handleAction('save')}
          disabled={Boolean(action) || isSaved}
          className="rounded-full border border-white/10 px-5 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5 disabled:opacity-60"
        >
          {isSaved ? 'Guardada' : '↓ Guardar'}
        </button>
      </div>

      <p className="text-center text-sm text-[#8D95A6]">
        {progressCurrent} / {ideas.length}
      </p>
    </div>
  )
}
