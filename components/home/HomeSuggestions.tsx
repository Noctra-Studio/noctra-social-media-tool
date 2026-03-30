'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2 } from 'lucide-react'
import { SocialPlatformMark, getPlatformToneClasses } from '@/components/ui/SocialPlatformMark'
import { formatPlatformLabel, type SuggestionCard } from '@/lib/product'

type SuggestionsState =
  | { status: 'loading' }
  | { items: SuggestionCard[]; status: 'success' }
  | { message: string; status: 'error' }

export function HomeSuggestions() {
  const [state, setState] = useState<SuggestionsState>({ status: 'loading' })

  useEffect(() => {
    let isCancelled = false

    async function loadSuggestions() {
      try {
        const response = await fetch('/api/home/suggestions', { credentials: 'include' })
        const data = (await response.json()) as { suggestions?: SuggestionCard[]; error?: string }

        if (!response.ok) {
          throw new Error(data.error || 'No fue posible cargar sugerencias')
        }

        if (!isCancelled) {
          setState({ items: data.suggestions || [], status: 'success' })
        }
      } catch (error) {
        if (!isCancelled) {
          setState({
            message:
              error instanceof Error ? error.message : 'No fue posible cargar sugerencias',
            status: 'error',
          })
        }
      }
    }

    loadSuggestions()

    return () => {
      isCancelled = true
    }
  }, [])

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-[28px] border border-white/10 bg-[#212631]/60">
        <Loader2 className="h-5 w-5 animate-spin text-[#8D95A6]" />
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="rounded-[28px] border border-dashed border-[#4E576A] bg-transparent p-6">
        <p
          className="text-lg font-medium text-[#E0E5EB]"
          style={{ fontFamily: 'var(--font-brand-display)' }}
        >
          Aún no puedo sugerir prioridades automáticas.
        </p>
        <p className="mt-2 text-sm leading-6 text-[#8D95A6]">{state.message}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/compose?mode=explore"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB]"
          >
            Ir a explorar ideas
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/ideas"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB]"
          >
            Ver ideas guardadas
          </Link>
        </div>
      </div>
    )
  }

  if (state.items.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-[#4E576A] bg-transparent p-6 text-sm leading-6 text-[#8D95A6]">
        Cuando haya más historial de publicaciones o ideas guardadas, aquí verás
        sugerencias diarias para avanzar sin pensar desde cero.
      </div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
      className="grid gap-3"
    >
      {state.items.map((item) => {
        const href = item.ideaId
          ? `/compose?mode=idea&idea=${item.ideaId}`
          : `/compose?mode=idea&platform=${item.platform}&draftIdea=${encodeURIComponent(
              item.ideaText || item.reason
            )}`

        return (
          <motion.div
            key={`${item.platform}-${item.ideaId ?? item.reason}`}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="rounded-[24px] border border-white/10 bg-[#212631]/45 p-5"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.24em] text-[#8D95A6]">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] tracking-[0.18em] ${getPlatformToneClasses(
                  item.platform
                )}`}
              >
                <SocialPlatformMark className="h-4 min-w-4 border-0 bg-transparent px-0 text-[9px]" platform={item.platform} />
                {formatPlatformLabel(item.platform)}
              </span>
              <span className="h-1 w-1 rounded-full bg-[#4E576A]" />
              <span>{item.ageLabel}</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-[#E0E5EB]">{item.reason}</p>
            <Link
              href={href}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-[#E0E5EB] transition-all hover:border-white/30 hover:bg-white/10"
            >
              Desarrollar esta idea
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
