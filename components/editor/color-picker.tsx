"use client";

import { HexColorPicker } from 'react-colorful'
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { ChevronDown } from 'lucide-react'
import { BRAND_COLOR_SWATCHES, isValidHexColor, normalizeHexColor } from '@/lib/carousel-backgrounds'
import { getRecentColors, saveRecentColor } from '@/lib/editor-preferences'
import { cn } from '@/lib/utils'

type ColorPickerProps = {
  label?: string
  onChange: (hex: string) => void
  value: string
  showLabel?: boolean
}

function useClickOutside(
  refs: Array<RefObject<HTMLElement | null>>,
  onOutsideClick: () => void,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null

      if (refs.some((ref) => ref.current?.contains(target ?? null))) {
        return
      }

      onOutsideClick()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [enabled, onOutsideClick, refs])
}

export function ColorPicker({ label, onChange, value, showLabel = true }: ColorPickerProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const normalizedValue = useMemo(() => normalizeHexColor(value), [value])
  const [isOpen, setIsOpen] = useState(false)
  const [brandOpen, setBrandOpen] = useState(false)
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom')
  const [inputValue, setInputValue] = useState(normalizedValue)
  const [recentColors, setRecentColors] = useState<string[]>([])

  const commitRecentColor = () => {
    if (!isValidHexColor(inputValue)) {
      return
    }

    setRecentColors(saveRecentColor(inputValue))
  }

  useEffect(() => {
    setInputValue(normalizedValue)
  }, [normalizedValue])

  useEffect(() => {
    setRecentColors(getRecentColors())
  }, [])

  useClickOutside([buttonRef, popoverRef], () => {
    if (!isOpen) {
      return
    }

    commitRecentColor()
    setIsOpen(false)
  }, isOpen)

  const applyColor = (nextColor: string, saveToRecent = false) => {
    const normalized = normalizeHexColor(nextColor, normalizedValue)
    setInputValue(normalized)
    onChange(normalized)

    if (saveToRecent) {
      setRecentColors(saveRecentColor(normalized))
    }
  }

  const toggleOpen = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPlacement(window.innerHeight - rect.bottom < 330 ? 'top' : 'bottom')
    }

    if (isOpen) {
      commitRecentColor()
    }

    setIsOpen((current) => !current)
  }

  return (
    <div className={cn("space-y-2", !showLabel && "space-y-0")}>
      {showLabel && label ? <span className="text-xs text-[#8D95A6]">{label}</span> : null}

      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={toggleOpen}
          className={cn(
            "flex w-full items-center justify-between rounded-xl border border-white/8 bg-[#14171C] px-3 py-2 text-left text-sm text-[#E0E5EB]",
            !showLabel && "w-10 h-10 p-0 justify-center rounded-full"
          )}
        >
          <span className="flex items-center gap-3">
            <span
              className={cn(
                "block h-10 w-10 rounded-xl border border-white/10",
                !showLabel && "h-8 w-8 rounded-full border-0"
              )}
              style={{ backgroundColor: normalizedValue }}
            />
            {showLabel && <span className="font-mono text-sm uppercase tracking-[0.08em]">{normalizedValue}</span>}
          </span>
          {showLabel && <ChevronDown className={`h-4 w-4 text-[#8D95A6] transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
        </button>

        {isOpen ? (
          <div
            ref={popoverRef}
            className={`absolute z-30 w-[280px] rounded-2xl border border-white/10 bg-[#0F1317] p-3 shadow-[0_16px_50px_rgba(0,0,0,0.45)] ${
              placement === 'top' ? 'bottom-[calc(100%+12px)]' : 'top-[calc(100%+12px)]'
            }`}
          >
            <HexColorPicker
              color={normalizedValue}
              onChange={(next) => applyColor(next)}
              className="!w-full"
            />

            <label className="mt-3 block space-y-1">
              <span className="text-[11px] uppercase tracking-[0.18em] text-[#4E576A]">Hex</span>
              <input
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onBlur={() => applyColor(inputValue, true)}
                className="w-full rounded-xl border border-white/8 bg-[#14171C] px-3 py-2 font-mono text-sm text-[#E0E5EB] uppercase focus:outline-none"
              />
            </label>

            <div className="mt-3 space-y-2">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#4E576A]">Recientes</p>
              <div className="flex flex-wrap gap-2">
                {recentColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => applyColor(color, true)}
                    className="h-5 w-5 rounded-full border border-white/10"
                    style={{ backgroundColor: color }}
                    aria-label={`Aplicar color ${color}`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-white/6 bg-black/10 p-2">
              <button
                type="button"
                onClick={() => setBrandOpen((current) => !current)}
                className="flex w-full items-center justify-between text-left text-[11px] uppercase tracking-[0.18em] text-[#8D95A6]"
              >
                <span>Colores Noctra</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${brandOpen ? 'rotate-180' : ''}`} />
              </button>

              {brandOpen ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {BRAND_COLOR_SWATCHES.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => applyColor(color, true)}
                      className="h-6 w-6 rounded-full border border-white/10"
                      style={{ backgroundColor: color }}
                      aria-label={`Aplicar color Noctra ${color}`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
