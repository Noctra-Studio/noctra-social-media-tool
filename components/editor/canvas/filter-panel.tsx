'use client'

import Image from 'next/image'
import { X } from 'lucide-react'
import { FILTER_PRESETS } from '@/lib/editor/filter-presets'
import { cn } from '@/lib/utils'

export type FilterPanelProps = {
  activeFilterId: string
  onFilterChange: (filterId: string, filterCSS: string) => void
  canvasPreviewDataURL: string | null
  className?: string
}

export function FilterPanel({
  activeFilterId,
  onFilterChange,
  canvasPreviewDataURL,
  className,
}: FilterPanelProps) {
  const hasActiveFilter = activeFilterId !== 'none'

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#4E576A]">
          Filtros
        </span>
        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => onFilterChange('none', '')}
            className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[10px] text-[#8D95A6] transition-colors hover:border-white/20 hover:text-[#E0E5EB]"
          >
            <X className="h-3 w-3" />
            Quitar
          </button>
        )}
      </div>

      <p className="text-[10px] leading-relaxed text-[#4E576A]">
        Se aplica al exportar. El canvas no se modifica.
      </p>

      <div className="grid grid-cols-2 gap-2">
        {FILTER_PRESETS.map((preset) => {
          const isActive = preset.id === activeFilterId

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onFilterChange(preset.id, preset.css)}
              className={cn(
                'group flex flex-col overflow-hidden rounded-xl border-2 transition-all hover:scale-[1.03]',
                isActive
                  ? 'border-[#E0E5EB] shadow-[0_0_0_1px_rgba(224,229,235,0.2)]'
                  : 'border-transparent hover:border-white/15'
              )}
            >
              <div className="relative aspect-square w-full overflow-hidden bg-[#0F1317]">
                {canvasPreviewDataURL ? (
                  <Image
                    src={canvasPreviewDataURL}
                    alt={preset.label}
                    fill
                    sizes="(max-width: 220px) 50vw, 90px"
                    unoptimized
                    className="object-cover"
                    style={{ filter: preset.css || 'none' }}
                  />
                ) : (
                  <div
                    className="h-full w-full bg-gradient-to-br from-[#462D6E] via-[#1B2430] to-[#0F1419]"
                    style={{ filter: preset.css || 'none' }}
                  />
                )}

                {isActive && (
                  <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#E0E5EB] text-[10px] font-bold text-[#101417] shadow-lg">
                    ✓
                  </div>
                )}
              </div>

              <div
                className={cn(
                  'bg-[#0F1317] px-1.5 py-1.5 text-center text-[10px] font-medium transition-colors',
                  isActive ? 'text-[#E0E5EB]' : 'text-[#4E576A] group-hover:text-[#8D95A6]'
                )}
              >
                {preset.label}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
