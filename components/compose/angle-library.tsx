'use client'

import { useMemo } from 'react'
import { BookOpen, HelpCircle, Lightbulb, Target } from 'lucide-react'
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
  const filteredAngles = useMemo(() => {
    return ANGLE_LIBRARY.filter((angle) => angle.best_for.includes(activePlatform)).sort((left, right) => {
      const leftMatches = left.format_affinity.includes(activeFormat) ? 1 : 0
      const rightMatches = right.format_affinity.includes(activeFormat) ? 1 : 0

      return rightMatches - leftMatches
    })
  }, [activeFormat, activePlatform])

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {filteredAngles.map((angle) => {
        const isSelected = selectedAngle === angle.id
        const previewFormat = angle.format_affinity[0]

        return (
          <button
            key={angle.id}
            type="button"
            onClick={() => onSelect(angle.id)}
            className={cn(
              'group rounded-[20px] border p-4 text-left transition-all duration-200',
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
  )
}
