'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Lightbulb,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ANGLE_LIBRARY, type AngleDefinition, type Platform } from '@/lib/product'
import { getFormatLabel, type PostFormat } from '@/lib/social-content'

type AngleLibraryProps = {
  activePlatform: Platform
  activeFormat: PostFormat
  selectedAngle: string | null
  onSelect: (angleId: string) => void
}

const functionIcons: Record<
  AngleDefinition['functions'][number],
  { icon: typeof BookOpen; label: string }
> = {
  educa: { icon: BookOpen, label: 'Educa' },
  curiosidad: { icon: HelpCircle, label: 'Genera curiosidad' },
  conocimiento: { icon: Lightbulb, label: 'Demuestra conocimiento' },
  convence: { icon: Target, label: 'Convence' },
}

export function AngleLibrary({
  activePlatform,
  activeFormat,
  selectedAngle,
  onSelect,
}: AngleLibraryProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const [scrollState, setScrollState] = useState({ canScrollLeft: false, canScrollRight: false })

  const filteredAngles = useMemo(() => {
    return ANGLE_LIBRARY.filter((angle) => angle.best_for.includes(activePlatform)).sort((left, right) => {
      const leftMatches = left.format_affinity.includes(activeFormat) ? 1 : 0
      const rightMatches = right.format_affinity.includes(activeFormat) ? 1 : 0

      return rightMatches - leftMatches
    })
  }, [activeFormat, activePlatform])

  useEffect(() => {
    const container = scrollContainerRef.current

    if (!container) {
      return
    }

    const syncScrollState = () => {
      const maxScrollLeft = container.scrollWidth - container.clientWidth
      const nextState = {
        canScrollLeft: container.scrollLeft > 4,
        canScrollRight: maxScrollLeft - container.scrollLeft > 4,
      }

      setScrollState((current) => {
        if (
          current.canScrollLeft === nextState.canScrollLeft &&
          current.canScrollRight === nextState.canScrollRight
        ) {
          return current
        }

        return nextState
      })
    }

    syncScrollState()

    container.addEventListener('scroll', syncScrollState, { passive: true })

    const resizeObserver = new ResizeObserver(syncScrollState)
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener('scroll', syncScrollState)
      resizeObserver.disconnect()
    }
  }, [filteredAngles])

  const scrollByCard = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current

    if (!container) {
      return
    }

    const firstCard = container.querySelector<HTMLElement>('[data-angle-card]')
    const styles = window.getComputedStyle(container)
    const gap = Number.parseFloat(styles.columnGap || styles.gap || '0')
    const scrollAmount = (firstCard?.getBoundingClientRect().width ?? container.clientWidth * 0.8) + gap

    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  return (
    <div className="relative">
      {scrollState.canScrollLeft ? (
        <button
          type="button"
          aria-label="Ver ángulos anteriores"
          onClick={() => scrollByCard('left')}
          className="absolute left-3 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0F1317]/90 text-[#E0E5EB] shadow-[0_12px_24px_rgba(0,0,0,0.28)] backdrop-blur transition hover:border-white/20 hover:bg-[#171D24]"
        >
          <ChevronLeft size={18} />
        </button>
      ) : null}

      <div
        ref={scrollContainerRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 pr-16 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {filteredAngles.map((angle) => {
          const isSelected = selectedAngle === angle.id
          const previewFormat = angle.format_affinity[0]

          return (
            <button
              key={angle.id}
              type="button"
              data-angle-card
              onClick={() => onSelect(angle.id)}
              className={cn(
                'group w-[calc(100%-4rem)] min-w-[260px] snap-start rounded-[20px] border p-4 text-left transition-all duration-200 sm:min-w-[280px] lg:min-w-[300px]',
                isSelected
                  ? 'border-[#E0E5EB]/50 bg-[#2A3040]'
                  : 'border-white/10 bg-[#101417]/60 hover:border-white/20'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-[#E0E5EB]">{angle.label}</p>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-[#B5BDCA]">
                  {getFormatLabel(activePlatform, previewFormat)}
                </span>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-[#8D95A6]">{angle.description}</p>

              <div className="mt-3 flex items-center gap-2">
                {angle.functions.map((func) => {
                  const Icon = functionIcons[func].icon

                  return (
                    <span
                      key={`${angle.id}-${func}`}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[#C9D0DB]"
                      title={functionIcons[func].label}
                    >
                      <Icon size={10} />
                    </span>
                  )
                })}
              </div>

              <p
                className={cn(
                  'mt-3 text-xs italic text-[#D3C2F1] transition-opacity duration-200',
                  isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                )}
              >
                {angle.example_hook}
              </p>
            </button>
          )
        })}
      </div>

      {scrollState.canScrollRight ? (
        <>
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#0A0D0F] via-[#0A0D0F]/88 to-transparent" />
          <button
            type="button"
            aria-label="Ver más ángulos"
            onClick={() => scrollByCard('right')}
            className="absolute right-3 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0F1317]/90 text-[#E0E5EB] shadow-[0_12px_24px_rgba(0,0,0,0.28)] backdrop-blur transition hover:border-white/20 hover:bg-[#171D24]"
          >
            <ChevronRight size={18} />
          </button>
        </>
      ) : null}
    </div>
  )
}
