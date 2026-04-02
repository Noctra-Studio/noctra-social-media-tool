import type { InstagramCarouselSlide } from '@/lib/social-content'

export type CarouselGradientType = 'linear' | 'radial'

export type CarouselGradientConfig = {
  angle: number
  stops: string[]
  type: CarouselGradientType
}

export type CarouselBackgroundValue = {
  gradientConfig?: CarouselGradientConfig
  imageUrl?: string
  solidColor?: string
  type: 'gradient' | 'image' | 'solid'
}

export type ResolvedSlideBackground =
  | {
      overlay: string
      representativeColor: string
      type: 'image'
      url: string
    }
  | {
      color: string
      overlay: string
      representativeColor: string
      type: 'solid'
    }
  | {
      config: CarouselGradientConfig
      overlay: string
      representativeColor: string
      type: 'gradient'
    }

export const DEFAULT_IMAGE_OVERLAY =
  'linear-gradient(to bottom, rgba(10,12,15,0.4) 0%, rgba(10,12,15,0.2) 40%, rgba(10,12,15,0.75) 100%)'

export const BRAND_COLOR_SWATCHES = ['#101417', '#212631', '#E0E5EB', '#FFFFFF', '#000000'] as const

export const BRAND_GRADIENT_SUGGESTIONS: Array<{
  config: CarouselGradientConfig
  id: string
  label: string
}> = [
  {
    config: { angle: 145, stops: ['#101417', '#1C2028'], type: 'linear' },
    id: 'dark-to-navy',
    label: 'Dark to Navy',
  },
  {
    config: { angle: 135, stops: ['#212631', '#101417'], type: 'linear' },
    id: 'navy-to-dark',
    label: 'Navy to Dark',
  },
  {
    config: { angle: 155, stops: ['#1A0A2E', '#462D6E'], type: 'linear' },
    id: 'purple-accent',
    label: 'Purple accent',
  },
  {
    config: { angle: 145, stops: ['#0A1628', '#1E3A5F'], type: 'linear' },
    id: 'trust-navy',
    label: 'Trust Navy',
  },
  {
    config: { angle: 135, stops: ['#2D1B00', '#7A3E00'], type: 'linear' },
    id: 'warm-launch',
    label: 'Warm Launch',
  },
]

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
const RGB_COLOR_PATTERN =
  /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i

function clampAngle(angle: number) {
  if (!Number.isFinite(angle)) {
    return 0
  }

  const normalized = angle % 360
  return normalized < 0 ? normalized + 360 : normalized
}

function expandHex(value: string) {
  if (value.length !== 4) {
    return value.toUpperCase()
  }

  const [, r, g, b] = value
  return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
}

function componentToHex(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, '0')
    .toUpperCase()
}

function parseGradientColorToRgb(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const normalized = normalizeGradientColor(value, '')

  if (!normalized) {
    return null
  }

  if (normalized.startsWith('#')) {
    return {
      b: Number.parseInt(normalized.slice(5, 7), 16),
      g: Number.parseInt(normalized.slice(3, 5), 16),
      r: Number.parseInt(normalized.slice(1, 3), 16),
    }
  }

  const match = normalized.match(
    /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)/i
  )

  if (!match) {
    return null
  }

  return {
    b: Math.max(0, Math.min(255, Number(match[3]))),
    g: Math.max(0, Math.min(255, Number(match[2]))),
    r: Math.max(0, Math.min(255, Number(match[1]))),
  }
}

export function isValidHexColor(value: string | null | undefined): value is string {
  return Boolean(value && HEX_COLOR_PATTERN.test(value.trim()))
}

export function isValidGradientColor(value: string | null | undefined): value is string {
  if (!value) {
    return false
  }

  const trimmed = value.trim()
  return HEX_COLOR_PATTERN.test(trimmed) || RGB_COLOR_PATTERN.test(trimmed)
}

export function normalizeHexColor(value: string | null | undefined, fallback = '#101417') {
  if (!value) {
    return fallback
  }

  const trimmed = value.trim()

  if (!HEX_COLOR_PATTERN.test(trimmed)) {
    return fallback
  }

  return expandHex(trimmed)
}

export function normalizeGradientColor(value: string | null | undefined, fallback = '#101417') {
  if (!value) {
    return fallback
  }

  const trimmed = value.trim()

  if (HEX_COLOR_PATTERN.test(trimmed)) {
    return expandHex(trimmed)
  }

  if (RGB_COLOR_PATTERN.test(trimmed)) {
    return trimmed
  }

  return fallback
}

export function extractHexColors(value: string | null | undefined) {
  if (!value) {
    return []
  }

  return Array.from(value.matchAll(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})/g), (match) =>
    normalizeHexColor(match[0])
  )
}

export function normalizeGradientConfig(
  value: Partial<CarouselGradientConfig> | null | undefined,
  fallback?: Partial<CarouselGradientConfig>
): CarouselGradientConfig {
  const fallbackStops =
    fallback?.stops?.filter((stop) => isValidGradientColor(stop)).map((stop) => normalizeGradientColor(stop)) ??
    ['#101417', '#1C2028']
  const rawStops = Array.isArray(value?.stops) ? value.stops : fallbackStops
  const normalizedStops = rawStops
    .filter((stop): stop is string => typeof stop === 'string')
    .map((stop) => normalizeGradientColor(stop))
    .slice(0, 3)

  const stops = normalizedStops.length >= 2 ? normalizedStops : fallbackStops.slice(0, 2)

  return {
    angle: clampAngle(value?.angle ?? fallback?.angle ?? 145),
    stops,
    type: value?.type === 'radial' ? 'radial' : fallback?.type === 'radial' ? 'radial' : 'linear',
  }
}

export function gradientConfigToCss(config: CarouselGradientConfig) {
  const normalized = normalizeGradientConfig(config)
  const stops = normalized.stops
    .map((stop, index) => {
      if (normalized.stops.length === 1) {
        return `${stop} 0%`
      }

      const position = Math.round((index / (normalized.stops.length - 1)) * 100)
      return `${stop} ${position}%`
    })
    .join(', ')

  if (normalized.type === 'radial') {
    return `radial-gradient(circle, ${stops})`
  }

  return `linear-gradient(${normalized.angle}deg, ${stops})`
}

export function gradientStopsToColorStops(stops: string[]) {
  const safeStops = stops.length >= 2 ? stops : ['#101417', '#1C2028']

  return safeStops.map((stop, index) => ({
    color: normalizeGradientColor(stop),
    offset: safeStops.length === 1 ? 0 : index / (safeStops.length - 1),
  }))
}

export function averageHexColors(colors: string[]) {
  const normalized = colors
    .map((color) => parseGradientColorToRgb(color))
    .filter((color): color is { b: number; g: number; r: number } => Boolean(color))

  if (!normalized.length) {
    return '#101417'
  }

  const aggregate = normalized.reduce(
    (result, color) => {
      result.r += color.r
      result.g += color.g
      result.b += color.b
      return result
    },
    { b: 0, g: 0, r: 0 }
  )

  return `#${componentToHex(aggregate.r / normalized.length)}${componentToHex(
    aggregate.g / normalized.length
  )}${componentToHex(aggregate.b / normalized.length)}`
}

export function getLogoVariant(hexColor: string): 'light' | 'dark' {
  const color = normalizeHexColor(hexColor)
  const r = Number.parseInt(color.slice(1, 3), 16) / 255
  const g = Number.parseInt(color.slice(3, 5), 16) / 255
  const b = Number.parseInt(color.slice(5, 7), 16) / 255
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance < 0.4 ? 'light' : 'dark'
}

export function getLogoVariantForResolvedBackground(background: ResolvedSlideBackground) {
  if (background.type === 'image') {
    return 'light'
  }

  return getLogoVariant(background.representativeColor)
}

export function colorSuggestionToBackground(
  slide: Pick<InstagramCarouselSlide, 'bg_type' | 'color_suggestion'>
): ResolvedSlideBackground | null {
  const suggestedColors = extractHexColors(slide.color_suggestion)

  if (!suggestedColors.length) {
    return null
  }

  if (slide.bg_type === 'gradient' && suggestedColors.length >= 2) {
    const config = normalizeGradientConfig({
      angle: 145,
      stops: suggestedColors.slice(0, 3),
      type: 'linear',
    })

    return {
      config,
      overlay: DEFAULT_IMAGE_OVERLAY,
      representativeColor: averageHexColors(config.stops),
      type: 'gradient',
    }
  }

  if (slide.bg_type === 'solid') {
    return {
      color: suggestedColors[0],
      overlay: DEFAULT_IMAGE_OVERLAY,
      representativeColor: suggestedColors[0],
      type: 'solid',
    }
  }

  return null
}

export function resolveSlideBackground(
  slide: Pick<InstagramCarouselSlide, 'bg_type' | 'color_suggestion' | 'slide_number' | 'type'>,
  background?: Partial<CarouselBackgroundValue> | null
): ResolvedSlideBackground {
  if (background?.type === 'image' && background.imageUrl) {
    return {
      overlay: DEFAULT_IMAGE_OVERLAY,
      representativeColor: '#101417',
      type: 'image',
      url: background.imageUrl,
    }
  }

  if (background?.type === 'solid' && background.solidColor) {
    const color = normalizeHexColor(background.solidColor)
    return {
      color,
      overlay: DEFAULT_IMAGE_OVERLAY,
      representativeColor: color,
      type: 'solid',
    }
  }

  if (background?.type === 'gradient' && background.gradientConfig) {
    const config = normalizeGradientConfig(background.gradientConfig)
    return {
      config,
      overlay: DEFAULT_IMAGE_OVERLAY,
      representativeColor: averageHexColors(config.stops),
      type: 'gradient',
    }
  }

  if (slide.bg_type === 'image' && background?.imageUrl) {
    return {
      overlay: DEFAULT_IMAGE_OVERLAY,
      representativeColor: '#101417',
      type: 'image',
      url: background.imageUrl,
    }
  }

  const suggestedBackground = colorSuggestionToBackground(slide)

  if (suggestedBackground) {
    return suggestedBackground
  }

  if (slide.type === 'cover') {
    const config = normalizeGradientConfig({
      angle: 145,
      stops: ['#101417', '#1C2028'],
      type: 'linear',
    })

    return {
      config,
      overlay: DEFAULT_IMAGE_OVERLAY,
      representativeColor: averageHexColors(config.stops),
      type: 'gradient',
    }
  }

  if (slide.type === 'cta') {
    const config = normalizeGradientConfig({
      angle: 135,
      stops: ['#212631', '#101417'],
      type: 'linear',
    })

    return {
      config,
      overlay: DEFAULT_IMAGE_OVERLAY,
      representativeColor: averageHexColors(config.stops),
      type: 'gradient',
    }
  }

  const color = slide.slide_number % 2 === 0 ? '#212631' : '#101417'
  return {
    color,
    overlay: DEFAULT_IMAGE_OVERLAY,
    representativeColor: color,
    type: 'solid',
  }
}
