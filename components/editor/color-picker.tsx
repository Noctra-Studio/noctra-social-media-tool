'use client'

import { HexColorPicker, HslaStringColorPicker } from 'react-colorful'
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import {
  BRAND_COLOR_SWATCHES,
  gradientConfigToCss,
  isValidHexColor,
  normalizeGradientConfig,
  normalizeHexColor,
  type CarouselGradientConfig,
} from '@/lib/carousel-backgrounds'
import { getRecentColors, getSavedGradients, saveGradient, saveRecentColor } from '@/lib/editor-preferences'
import { cn } from '@/lib/utils'

export type ColorValue =
  | { type: 'solid'; hex: string }
  | { type: 'gradient'; config: CarouselGradientConfig }
  | { type: 'transparent' }

type ColorPickerMode = ColorValue['type']

type ColorPickerProps = {
  label?: string
  onChange: (hex: string) => void
  onGradientChange?: (config: CarouselGradientConfig) => void
  value: string
  showLabel?: boolean
  allowGradient?: boolean
  gradientValue?: CarouselGradientConfig
}

type GradientStopItem = {
  color: string
  position: number
}

const MAX_GRADIENT_STOPS = 3
const DEFAULT_GRADIENT: CarouselGradientConfig = {
  angle: 135,
  stops: ['#101417', '#462D6E'],
  type: 'linear',
}
const PRESET_GRADIENTS: CarouselGradientConfig[] = [
  { angle: 135, stops: ['#101417', '#1C2028'], type: 'linear' },
  { angle: 155, stops: ['#1A0A2E', '#462D6E'], type: 'linear' },
  { angle: 45, stops: ['#0A1628', '#1E3A5F'], type: 'linear' },
  { angle: 90, stops: ['#E0E5EB', '#8D95A6'], type: 'linear' },
  { angle: 135, stops: ['#462D6E', '#E0E5EB', '#101417'], type: 'linear' },
]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function buildEvenPositions(length: number) {
  if (length <= 1) {
    return [0]
  }

  return Array.from({ length }, (_, index) => Math.round((index / (length - 1)) * 100))
}

function normalizeGradientStops(
  config: Partial<CarouselGradientConfig> | null | undefined,
  fallbackColor: string
): GradientStopItem[] {
  const normalized = normalizeGradientConfig(config, {
    ...DEFAULT_GRADIENT,
    stops: [fallbackColor, DEFAULT_GRADIENT.stops[1]],
  })

  return normalized.stops.map((color, index) => ({
    color: normalizeHexColor(color, fallbackColor),
    position: buildEvenPositions(normalized.stops.length)[index] ?? 0,
  }))
}

function gradientStopsToConfig(stops: GradientStopItem[], current: CarouselGradientConfig): CarouselGradientConfig {
  return normalizeGradientConfig(
    {
      ...current,
      stops: stops.map((stop) => normalizeHexColor(stop.color)),
    },
    current
  )
}

function buildGradientCss(config: CarouselGradientConfig, stops: GradientStopItem[]) {
  if (!stops.length) {
    return gradientConfigToCss(config)
  }

  const normalizedStops = [...stops]
    .map((stop) => ({
      color: normalizeHexColor(stop.color),
      position: clamp(Math.round(stop.position), 0, 100),
    }))
    .sort((left, right) => left.position - right.position)
    .map((stop) => `${stop.color} ${stop.position}%`)
    .join(', ')

  if (config.type === 'radial') {
    return `radial-gradient(circle, ${normalizedStops})`
  }

  return `linear-gradient(${config.angle}deg, ${normalizedStops})`
}

function isTransparentValue(value: string | null | undefined) {
  return value?.trim().toLowerCase() === 'transparent'
}

function parseHslaString(value: string) {
  const match =
    value.match(
      /hsla?\(\s*(-?\d+(?:\.\d+)?)\s*(?:deg)?[\s,]+(\d+(?:\.\d+)?)%\s*[\s,]+(\d+(?:\.\d+)?)%\s*(?:\/|,)\s*(\d+(?:\.\d+)?)\s*\)/
    ) ?? value.match(/hsla?\(\s*(-?\d+(?:\.\d+)?)\s*(?:deg)?[\s,]+(\d+(?:\.\d+)?)%\s*[\s,]+(\d+(?:\.\d+)?)%\s*\)/)

  if (!match) {
    return null
  }

  return {
    a: clamp(Number(match[4] ?? 1), 0, 1),
    h: Number(match[1]),
    l: clamp(Number(match[3]), 0, 100),
    s: clamp(Number(match[2]), 0, 100),
  }
}

function rgbChannelToHex(value: number) {
  return clamp(Math.round(value), 0, 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase()
}

function hslaStringToHex(value: string, fallback: string) {
  const parsed = parseHslaString(value)

  if (!parsed) {
    return fallback
  }

  const h = ((parsed.h % 360) + 360) % 360
  const s = parsed.s / 100
  const l = parsed.l / 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  let r = 0
  let g = 0
  let b = 0

  if (h < 60) {
    r = c
    g = x
  } else if (h < 120) {
    r = x
    g = c
  } else if (h < 180) {
    g = c
    b = x
  } else if (h < 240) {
    g = x
    b = c
  } else if (h < 300) {
    r = x
    b = c
  } else {
    r = c
    b = x
  }

  return `#${rgbChannelToHex((r + m) * 255)}${rgbChannelToHex((g + m) * 255)}${rgbChannelToHex((b + m) * 255)}`
}

function hexToHslaString(hex: string) {
  const color = normalizeHexColor(hex)
  const r = Number.parseInt(color.slice(1, 3), 16) / 255
  const g = Number.parseInt(color.slice(3, 5), 16) / 255
  const b = Number.parseInt(color.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  const l = (max + min) / 2

  let h = 0
  let s = 0

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1))

    if (max === r) {
      h = 60 * (((g - b) / delta) % 6)
    } else if (max === g) {
      h = 60 * ((b - r) / delta + 2)
    } else {
      h = 60 * ((r - g) / delta + 4)
    }
  }

  const safeHue = Math.round((h + 360) % 360)
  const safeSaturation = Math.round(s * 100)
  const safeLightness = Math.round(l * 100)

  return `hsla(${safeHue}, ${safeSaturation}%, ${safeLightness}%, 1)`
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

function TransparencyPreview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(45deg,#1A1F27_25%,transparent_25%,transparent_75%,#1A1F27_75%,#1A1F27),linear-gradient(45deg,#1A1F27_25%,transparent_25%,transparent_75%,#1A1F27_75%,#1A1F27)] bg-[length:14px_14px] bg-[position:0_0,7px_7px]',
        className
      )}
    />
  )
}

function GradientStop({
  color,
  index,
  isActive,
  max,
  min,
  position,
  onPositionChange,
  onSelect,
}: {
  color: string
  index: number
  isActive: boolean
  max: number
  min: number
  position: number
  onPositionChange: (position: number) => void
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={cn(
        'absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-[0_6px_18px_rgba(0,0,0,0.35)] transition-transform',
        isActive ? 'z-10 scale-110 border-white' : 'z-0 border-white/60'
      )}
      style={{
        backgroundColor: color,
        left: `${position}%`,
      }}
      aria-label={`Seleccionar stop ${index + 1}`}
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
      }}
      onPointerDown={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onSelect()

        const track = event.currentTarget.parentElement

        if (!track) {
          return
        }

        const moveToClientX = (clientX: number) => {
          const rect = track.getBoundingClientRect()
          const nextPosition = clamp(((clientX - rect.left) / rect.width) * 100, min, max)
          onPositionChange(nextPosition)
        }

        moveToClientX(event.clientX)

        const handleMove = (moveEvent: PointerEvent) => moveToClientX(moveEvent.clientX)
        const handleUp = () => {
          window.removeEventListener('pointermove', handleMove)
          window.removeEventListener('pointerup', handleUp)
        }

        window.addEventListener('pointermove', handleMove)
        window.addEventListener('pointerup', handleUp)
      }}
    />
  )
}

function AngleInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const handleValueChange = useCallback(
    (nextValue: number) => {
      if (!Number.isFinite(nextValue)) {
        return
      }

      onChange(((Math.round(nextValue) % 360) + 360) % 360)
    },
    [onChange]
  )

  return (
    <div className="flex items-center gap-2">
      <div
        className="relative h-9 w-9 cursor-crosshair rounded-full border border-white/15 bg-black/30"
        onPointerDown={(event) => {
          const element = event.currentTarget
          const rect = element.getBoundingClientRect()
          const centerX = rect.left + rect.width / 2
          const centerY = rect.top + rect.height / 2

          const updateFromPointer = (clientX: number, clientY: number) => {
            const angle = ((Math.atan2(clientY - centerY, clientX - centerX) * 180) / Math.PI + 450) % 360
            handleValueChange(angle)
          }

          updateFromPointer(event.clientX, event.clientY)

          const handleMove = (moveEvent: PointerEvent) => updateFromPointer(moveEvent.clientX, moveEvent.clientY)
          const handleUp = () => {
            window.removeEventListener('pointermove', handleMove)
            window.removeEventListener('pointerup', handleUp)
          }

          window.addEventListener('pointermove', handleMove)
          window.addEventListener('pointerup', handleUp)
        }}
      >
        <div
          className="absolute left-1/2 top-1/2 h-3.5 w-0.5 origin-bottom rounded-full bg-white"
          style={{ transform: `translate(-50%, -100%) rotate(${value}deg)` }}
        />
      </div>
      <input
        type="number"
        min={0}
        max={360}
        value={value}
        onChange={(event) => handleValueChange(Number(event.target.value))}
        className="w-14 rounded-lg border border-white/8 bg-white/5 px-2 py-1 text-center font-mono text-[11px] text-[#E0E5EB] outline-none"
      />
      <span className="text-[10px] text-[#4E576A]">°</span>
    </div>
  )
}

export function ColorPicker({
  label,
  onChange,
  onGradientChange,
  value,
  showLabel = true,
  allowGradient = false,
  gradientValue,
}: ColorPickerProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const transparent = isTransparentValue(value)
  const fallbackSolid = normalizeHexColor(gradientValue?.stops[0], DEFAULT_GRADIENT.stops[0])
  const normalizedValue = useMemo(
    () => normalizeHexColor(transparent ? undefined : value, fallbackSolid),
    [fallbackSolid, transparent, value]
  )

  const [isOpen, setIsOpen] = useState(false)
  const [brandOpen, setBrandOpen] = useState(false)
  const [mode, setMode] = useState<ColorPickerMode>(() =>
    transparent ? 'transparent' : allowGradient && gradientValue ? 'gradient' : 'solid'
  )
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom')
  const [inputValue, setInputValue] = useState(normalizedValue)
  const [recentColors, setRecentColors] = useState<string[]>([])
  const [savedGradients, setSavedGradients] = useState<CarouselGradientConfig[]>([])
  const [gradientConfig, setGradientConfig] = useState<CarouselGradientConfig>(() =>
    normalizeGradientConfig(gradientValue, {
      ...DEFAULT_GRADIENT,
      stops: [normalizedValue, DEFAULT_GRADIENT.stops[1]],
    })
  )
  const [gradientStops, setGradientStops] = useState<GradientStopItem[]>(() =>
    normalizeGradientStops(gradientValue, normalizedValue)
  )
  const [activeStopIndex, setActiveStopIndex] = useState(0)
  const [activeStopInput, setActiveStopInput] = useState(
    gradientStops[0]?.color ?? normalizedValue
  )

  useEffect(() => {
    setInputValue(normalizedValue)
  }, [normalizedValue])

  useEffect(() => {
    setActiveStopInput(gradientStops[activeStopIndex]?.color ?? normalizedValue)
  }, [activeStopIndex, gradientStops, normalizedValue])

  useEffect(() => {
    setRecentColors(getRecentColors())
    setSavedGradients(getSavedGradients())
  }, [])

  useEffect(() => {
    if (!allowGradient && mode !== 'solid') {
      setMode('solid')
    }
  }, [allowGradient, mode])

  useEffect(() => {
    if (transparent) {
      setMode('transparent')
      return
    }

    if (mode === 'transparent') {
      setMode(allowGradient && gradientValue ? 'gradient' : 'solid')
    }
  }, [allowGradient, gradientValue, mode, transparent])

  useEffect(() => {
    if (!gradientValue) {
      return
    }

    const normalizedGradient = normalizeGradientConfig(gradientValue, {
      ...DEFAULT_GRADIENT,
      stops: [normalizedValue, DEFAULT_GRADIENT.stops[1]],
    })

    setGradientConfig(normalizedGradient)
    setGradientStops(normalizeGradientStops(normalizedGradient, normalizedValue))
    setActiveStopIndex((current) => clamp(current, 0, normalizedGradient.stops.length - 1))
  }, [gradientValue, normalizedValue])

  const commitRecentColor = useCallback(() => {
    if (mode !== 'solid' || !isValidHexColor(inputValue)) {
      return
    }

    setRecentColors(saveRecentColor(inputValue))
  }, [inputValue, mode])

  useClickOutside(
    [buttonRef, popoverRef],
    useCallback(() => {
      if (!isOpen) {
        return
      }

      commitRecentColor()
      setIsOpen(false)
    }, [commitRecentColor, isOpen]),
    isOpen
  )

  const syncGradient = useCallback(
    (nextStops: GradientStopItem[], nextConfig?: Partial<CarouselGradientConfig>) => {
      const config = gradientStopsToConfig(
        nextStops,
        normalizeGradientConfig(
          {
            ...gradientConfig,
            ...nextConfig,
          },
          gradientConfig
        )
      )

      setGradientStops(nextStops)
      setGradientConfig(config)
      onGradientChange?.(config)
    },
    [gradientConfig, onGradientChange]
  )

  const applyColor = useCallback(
    (nextColor: string, saveToRecent = false) => {
      const normalized = normalizeHexColor(nextColor, normalizedValue)
      setInputValue(normalized)
      setMode('solid')
      onChange(normalized)

      if (saveToRecent) {
        setRecentColors(saveRecentColor(normalized))
      }
    },
    [normalizedValue, onChange]
  )

  const selectMode = useCallback(
    (nextMode: ColorPickerMode) => {
      setMode(nextMode)

      if (nextMode === 'transparent') {
        onChange('transparent')
        return
      }

      if (nextMode === 'gradient') {
        onGradientChange?.(gradientConfig)
        return
      }

      onChange(normalizedValue)
    },
    [gradientConfig, normalizedValue, onChange, onGradientChange]
  )

  const toggleOpen = useCallback(() => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPlacement(window.innerHeight - rect.bottom < 500 ? 'top' : 'bottom')
    }

    if (isOpen) {
      commitRecentColor()
    }

    setIsOpen((current) => !current)
  }, [commitRecentColor, isOpen])

  const updateGradientStopColor = useCallback(
    (index: number, nextColor: string) => {
      const fallback = gradientStops[index]?.color ?? normalizedValue
      const normalized = normalizeHexColor(nextColor, fallback)
      const nextStops = gradientStops.map((stop, stopIndex) =>
        stopIndex === index ? { ...stop, color: normalized } : stop
      )

      syncGradient(nextStops)
    },
    [gradientStops, normalizedValue, syncGradient]
  )

  const addGradientStop = useCallback(
    (requestedPosition?: number) => {
      if (gradientStops.length >= MAX_GRADIENT_STOPS) {
        return
      }

      const position =
        typeof requestedPosition === 'number'
          ? clamp(requestedPosition, 0, 100)
          : gradientStops.length === 1
            ? 50
            : Math.round((gradientStops[0]!.position + gradientStops[gradientStops.length - 1]!.position) / 2)

      const insertAt = gradientStops.findIndex((stop) => position < stop.position)
      const nextIndex = insertAt === -1 ? gradientStops.length : insertAt
      const referenceColor =
        gradientStops[Math.max(0, nextIndex - 1)]?.color ?? gradientStops[0]?.color ?? normalizedValue
      const nextStops = [...gradientStops]

      nextStops.splice(nextIndex, 0, {
        color: referenceColor,
        position,
      })

      const boundedStops = nextStops.map((stop, index, array) => {
        if (index === 0) {
          return { ...stop, position: 0 }
        }

        if (index === array.length - 1) {
          return { ...stop, position: 100 }
        }

        const minimum = (array[index - 1]?.position ?? 0) + 5
        const maximum = (array[index + 1]?.position ?? 100) - 5
        return { ...stop, position: clamp(stop.position, minimum, maximum) }
      })

      setActiveStopIndex(nextIndex)
      syncGradient(boundedStops)
    },
    [gradientStops, normalizedValue, syncGradient]
  )

  const removeGradientStop = useCallback(
    (index: number) => {
      if (gradientStops.length <= 2) {
        return
      }

      const nextStops = gradientStops.filter((_, stopIndex) => stopIndex !== index)
      setActiveStopIndex((current) => clamp(current > index ? current - 1 : current, 0, nextStops.length - 1))
      syncGradient(nextStops)
    },
    [gradientStops, syncGradient]
  )

  const gradientPreviewCss = useMemo(
    () => buildGradientCss(gradientConfig, gradientStops),
    [gradientConfig, gradientStops]
  )

  const activeStop = gradientStops[activeStopIndex] ?? gradientStops[0]
  const pickerPreviewMode = allowGradient ? mode : transparent ? 'transparent' : 'solid'
  const buttonLabel =
    pickerPreviewMode === 'gradient' ? 'Gradiente' : pickerPreviewMode === 'transparent' ? 'Transp.' : normalizedValue

  return (
    <div className={cn('space-y-2', !showLabel && 'space-y-0')}>
      {showLabel && label ? <span className="text-xs text-[#8D95A6]">{label}</span> : null}

      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={toggleOpen}
          className={cn(
            'flex w-full items-center justify-between rounded-xl border border-white/8 bg-[#14171C] px-3 py-2 text-left text-sm text-[#E0E5EB]',
            !showLabel && 'h-10 w-10 justify-center rounded-full p-0'
          )}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                'relative block h-10 w-10 overflow-hidden rounded-xl border border-white/10',
                !showLabel && 'h-8 w-8 rounded-full border-0'
              )}
            >
              {pickerPreviewMode === 'transparent' ? (
                <TransparencyPreview className="h-full w-full border-0" />
              ) : (
                <span
                  className="absolute inset-0"
                  style={{
                    background: pickerPreviewMode === 'gradient' ? gradientPreviewCss : normalizedValue,
                  }}
                />
              )}
            </span>
            {showLabel ? (
              <span className="truncate font-mono text-sm uppercase tracking-[0.08em]">{buttonLabel}</span>
            ) : null}
          </span>
          {showLabel ? (
            <ChevronDown
              className={cn('h-4 w-4 text-[#8D95A6] transition-transform', isOpen && 'rotate-180')}
            />
          ) : null}
        </button>

        {isOpen ? (
          <div
            ref={popoverRef}
            className={cn(
              'absolute left-0 z-[200] w-[320px] rounded-2xl border border-white/10 bg-[#0F1317] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.6)]',
              placement === 'top' ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'
            )}
          >
            {allowGradient ? (
              <div className="mb-4 flex gap-1 rounded-xl bg-black/30 p-1">
                {(['solid', 'gradient', 'transparent'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => selectMode(tab)}
                    className={cn(
                      'flex-1 rounded-lg py-1.5 text-[11px] font-bold transition-all',
                      mode === tab ? 'bg-[#212631] text-white' : 'text-[#4E576A] hover:text-[#8D95A6]'
                    )}
                  >
                    {tab === 'solid' ? 'Sólido' : tab === 'gradient' ? 'Gradiente' : 'Transp.'}
                  </button>
                ))}
              </div>
            ) : null}

            {(mode === 'solid' || !allowGradient) ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#0B0E12] p-2">
                  <HslaStringColorPicker
                    color={hexToHslaString(normalizedValue)}
                    onChange={(nextValue) => applyColor(hslaStringToHex(nextValue, normalizedValue))}
                    className="!w-full"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className="h-9 w-9 shrink-0 rounded-xl border border-white/20"
                    style={{ backgroundColor: normalizedValue }}
                  />
                  <input
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    onBlur={() => applyColor(inputValue, true)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        applyColor(inputValue, true)
                      }
                    }}
                    className="flex-1 rounded-xl border border-white/8 bg-[#14171C] px-3 py-2 font-mono text-sm text-[#E0E5EB] uppercase outline-none"
                    placeholder="#101417"
                    maxLength={7}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#4E576A]">Recientes</p>
                  <div className="flex flex-wrap gap-2">
                    {recentColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => applyColor(color, true)}
                        className="h-6 w-6 rounded-full border border-white/10"
                        style={{ backgroundColor: color }}
                        aria-label={`Aplicar color ${color}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-white/6 bg-black/10 p-2">
                  <button
                    type="button"
                    onClick={() => setBrandOpen((current) => !current)}
                    className="flex w-full items-center justify-between text-[11px] uppercase tracking-[0.18em] text-[#8D95A6]"
                  >
                    <span>Colores Noctra</span>
                    <ChevronDown className={cn('h-4 w-4 transition-transform', brandOpen && 'rotate-180')} />
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

            {mode === 'gradient' && allowGradient ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="relative overflow-hidden rounded-xl border border-white/10">
                    <TransparencyPreview className="absolute inset-0 border-0" />
                    <button
                      type="button"
                      className="relative h-12 w-full cursor-crosshair"
                      style={{ background: gradientPreviewCss }}
                      onClick={(event) => {
                        const rect = event.currentTarget.getBoundingClientRect()
                        const position = ((event.clientX - rect.left) / rect.width) * 100
                        addGradientStop(position)
                      }}
                    />
                  </div>

                  <div className="relative h-7">
                    {gradientStops.map((stop, index) => (
                      <GradientStop
                        key={`${index}-${stop.color}`}
                        color={stop.color}
                        index={index}
                        isActive={activeStopIndex === index}
                        min={index === 0 ? 0 : gradientStops[index - 1]!.position + 5}
                        max={index === gradientStops.length - 1 ? 100 : gradientStops[index + 1]!.position - 5}
                        position={stop.position}
                        onSelect={() => setActiveStopIndex(index)}
                        onPositionChange={(position) => {
                          const nextStops = gradientStops.map((currentStop, stopIndex) =>
                            stopIndex === index ? { ...currentStop, position } : currentStop
                          )
                          syncGradient(nextStops)
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-white/8 bg-black/20 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#4E576A]">
                      Stop {activeStopIndex + 1} / {gradientStops.length}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => addGradientStop()}
                        disabled={gradientStops.length >= MAX_GRADIENT_STOPS}
                        className="rounded-lg border border-white/10 p-1 text-[#4E576A] hover:text-[#E0E5EB] disabled:opacity-30"
                        aria-label="Agregar stop"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeGradientStop(activeStopIndex)}
                        disabled={gradientStops.length <= 2}
                        className="rounded-lg border border-white/10 p-1 text-[#4E576A] hover:text-red-400 disabled:opacity-30"
                        aria-label="Eliminar stop"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#0B0E12] p-2">
                    <HexColorPicker
                      color={activeStop?.color ?? normalizedValue}
                      onChange={(nextColor) => updateGradientStopColor(activeStopIndex, nextColor)}
                      className="!w-full"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className="h-9 w-9 shrink-0 rounded-xl border border-white/20"
                      style={{ backgroundColor: activeStop?.color ?? normalizedValue }}
                    />
                    <input
                      value={activeStopInput}
                      onChange={(event) => setActiveStopInput(event.target.value)}
                      onBlur={() => updateGradientStopColor(activeStopIndex, activeStopInput)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          updateGradientStopColor(activeStopIndex, activeStopInput)
                        }
                      }}
                      className="flex-1 rounded-xl border border-white/8 bg-[#14171C] px-3 py-2 font-mono text-sm text-[#E0E5EB] uppercase outline-none"
                      maxLength={7}
                    />
                    <div className="w-14 rounded-xl border border-white/8 bg-[#14171C] px-2 py-2 text-center font-mono text-[11px] text-[#8D95A6]">
                      {Math.round(activeStop?.position ?? 0)}%
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {recentColors.map((color) => (
                      <button
                        key={`gradient-recent-${color}`}
                        type="button"
                        onClick={() => updateGradientStopColor(activeStopIndex, color)}
                        className="h-5 w-5 rounded-full border border-white/10"
                        style={{ backgroundColor: color }}
                        aria-label={`Aplicar ${color} al stop`}
                      />
                    ))}
                    {BRAND_COLOR_SWATCHES.map((color) => (
                      <button
                        key={`gradient-brand-${color}`}
                        type="button"
                        onClick={() => updateGradientStopColor(activeStopIndex, color)}
                        className="h-5 w-5 rounded-full border border-white/10"
                        style={{ backgroundColor: color }}
                        aria-label={`Aplicar color Noctra ${color} al stop`}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#4E576A]">Tipo</span>
                    <div className="flex rounded-xl border border-white/5 bg-black/20 p-0.5">
                      {(['linear', 'radial'] as const).map((gradientType) => (
                        <button
                          key={gradientType}
                          type="button"
                          onClick={() => syncGradient(gradientStops, { type: gradientType })}
                          className={cn(
                            'flex-1 rounded-lg py-1.5 text-[10px] font-bold',
                            gradientConfig.type === gradientType ? 'bg-[#212631] text-white' : 'text-[#4E576A]'
                          )}
                        >
                          {gradientType === 'linear' ? 'Lineal' : 'Radial'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {gradientConfig.type === 'linear' ? (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#4E576A]">Ángulo</span>
                      <AngleInput
                        value={gradientConfig.angle}
                        onChange={(angle) => syncGradient(gradientStops, { angle })}
                      />
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#4E576A]">Presets</span>
                    <button
                      type="button"
                      onClick={() => setSavedGradients(saveGradient(gradientConfig))}
                      className="rounded-lg border border-dashed border-white/20 px-2 py-1 text-[10px] font-medium text-[#8D95A6] hover:text-[#E0E5EB]"
                    >
                      Guardar
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {PRESET_GRADIENTS.map((preset, index) => (
                      <button
                        key={`preset-${index}`}
                        type="button"
                        onClick={() => {
                          const normalizedPreset = normalizeGradientConfig(preset)
                          setActiveStopIndex(0)
                          setMode('gradient')
                          setGradientStops(normalizeGradientStops(normalizedPreset, normalizedValue))
                          setGradientConfig(normalizedPreset)
                          onGradientChange?.(normalizedPreset)
                        }}
                        className="h-8 w-16 rounded-lg border border-white/10 transition-transform hover:scale-105"
                        style={{ background: gradientConfigToCss(normalizeGradientConfig(preset)) }}
                        aria-label={`Aplicar preset ${index + 1}`}
                      />
                    ))}
                  </div>

                  {savedGradients.length ? (
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#4E576A]">Guardados</span>
                      <div className="flex flex-wrap gap-2">
                        {savedGradients.map((savedGradient, index) => (
                          <button
                            key={`saved-${index}-${gradientConfigToCss(savedGradient)}`}
                            type="button"
                            onClick={() => {
                              const normalizedPreset = normalizeGradientConfig(savedGradient)
                              setActiveStopIndex(0)
                              setGradientStops(normalizeGradientStops(normalizedPreset, normalizedValue))
                              setGradientConfig(normalizedPreset)
                              onGradientChange?.(normalizedPreset)
                            }}
                            className="h-8 w-16 rounded-lg border border-white/10 transition-transform hover:scale-105"
                            style={{ background: gradientConfigToCss(savedGradient) }}
                            aria-label={`Aplicar gradiente guardado ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {mode === 'transparent' && allowGradient ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <TransparencyPreview className="h-20 w-20 rounded-2xl border-white/20" />
                <p className="text-center text-[11px] text-[#4E576A]">Sin relleno. El objeto se renderiza transparente.</p>
                <button
                  type="button"
                  onClick={() => {
                    onChange('transparent')
                    setIsOpen(false)
                  }}
                  className="rounded-xl bg-white/5 px-4 py-2 text-sm text-[#E0E5EB] hover:bg-white/10"
                >
                  Aplicar transparente
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
