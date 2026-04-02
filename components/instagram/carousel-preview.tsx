"use client";

import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, useRef, type CSSProperties, type ChangeEvent, type FormEvent } from 'react'
import { Bookmark, ChevronLeft, ChevronRight, Info, ImageIcon, Loader2, Palette, Pencil, Plus, Search, Square, Upload, Heart, MessageCircle, Send, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { InstagramCarouselSlide, SlideBackgroundSelection } from '@/lib/social-content'
import { getEditedSlidePreview, type CarouselEditorSlide } from '@/lib/instagram-carousel-editor'
import {
  BRAND_COLOR_SWATCHES,
  BRAND_GRADIENT_SUGGESTIONS,
  gradientConfigToCss,
  normalizeGradientConfig,
  resolveSlideBackground,
  getLogoVariantForResolvedBackground,
  type CarouselGradientConfig,
} from '@/lib/carousel-backgrounds'
import { ColorPicker } from '@/components/editor/color-picker'
import { getRecentColors, getSavedGradients, saveGradient, saveRecentColor } from '@/lib/editor-preferences'

type SlideBackgroundType = 'image' | 'gradient' | 'solid'

type UnsplashPhoto = {
  id: string
  url: string
  thumb_url: string
  photographer: string
  unsplash_link: string
}

export type SlideBackgroundState = {
  type: SlideBackgroundType
  gradientConfig?: CarouselGradientConfig
  imageUrl?: string
  imageThumb?: string
  photographer?: string
  solidColor?: string
  unsplashResults?: UnsplashPhoto[]
  showInlineSearch?: boolean
  filters?: {
    brightness?: number
    contrast?: number
    saturate?: number
    sepia?: number
    grayscale?: number
  }
}

type CarouselPreviewProps = {
  angle?: string
  editedSlides?: CarouselEditorSlide[]
  initialBackgrounds?: SlideBackgroundSelection[]
  onOpenDetailEditor: (activeIndex: number) => void
  slides: InstagramCarouselSlide[]
  onBackgroundChange?: (backgrounds: SlideBackgroundSelection[]) => void
  onUpdateSlide?: (slideNumber: number, updates: Partial<InstagramCarouselSlide>) => void
}

export type SlideTemplateProps = {
  angle?: string
  background: SlideBackgroundState
  isPreview: boolean
  slide: InstagramCarouselSlide
  totalSlides: number
}

type ResolvedBackground = {
  accentColor: string
  baseBackground: string
  imageUrl?: string
  logoVariant: 'dark' | 'light'
  overlay: string
  thumbnailBackground: string
}

const SLIDE_SIZE = 1080
const DESIGN_PREVIEW_WIDTH = 375
const DEFAULT_PREVIEW_SCALE = DESIGN_PREVIEW_WIDTH / SLIDE_SIZE
const SCALE_MULTIPLIER = SLIDE_SIZE / DESIGN_PREVIEW_WIDTH
const NOISE_TEXTURE = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/></filter><rect width="160" height="160" filter="url(#n)" opacity=".8"/></svg>'
)}")`

const BACKGROUND_TYPES = [
  { id: 'image', icon: ImageIcon, label: 'Foto' },
  { id: 'gradient', icon: Palette, label: 'Grad' },
  { id: 'solid', icon: Square, label: 'Solid' },
] as const satisfies ReadonlyArray<{
  id: SlideBackgroundType
  icon: typeof ImageIcon
  label: string
}>

const slideVariants = {
  center: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: 'easeOut' as const },
  },
  enter: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? 20 : -20,
    transition: { duration: 0.2, ease: 'easeOut' as const },
  }),
  exit: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? -20 : 20,
    transition: { duration: 0.2, ease: 'easeOut' as const },
  }),
}

export function toCanvasPx(value: number) {
  return value * SCALE_MULTIPLIER
}

function clampLines(lines: number): CSSProperties {
  return {
    display: '-webkit-box',
    overflow: 'hidden',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: lines,
  }
}

function sanitizeSlideText(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  return value
    .replace(/```[\s\S]*?```/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) {
        return false
      }

      if (/(design_note|bg_reasoning)\s*:/i.test(line)) {
        return false
      }

      if (/^\s*[{\[]/.test(line) || /^[}\]],?$/.test(line)) {
        return false
      }

      if (/^"[^"]+"\s*:\s*.+,?$/.test(line)) {
        return false
      }

      return true
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getInitialBackground(slide: InstagramCarouselSlide): SlideBackgroundState {
  const resolved = resolveSlideBackground(slide)

  if (resolved.type === 'gradient') {
    return { gradientConfig: resolved.config, type: 'gradient' }
  }

  if (resolved.type === 'image') {
    return { type: 'image' }
  }

  return { solidColor: resolved.color, type: 'solid' }
}

function serializeGradientConfig(config?: CarouselGradientConfig) {
  if (!config) {
    return ''
  }

  return JSON.stringify(normalizeGradientConfig(config))
}

function serializeFilters(filters?: SlideBackgroundState['filters']) {
  if (!filters) {
    return ''
  }

  return JSON.stringify({
    brightness: filters.brightness ?? null,
    contrast: filters.contrast ?? null,
    grayscale: filters.grayscale ?? null,
    saturate: filters.saturate ?? null,
    sepia: filters.sepia ?? null,
  })
}

function areBackgroundStatesEqual(a?: SlideBackgroundState, b?: SlideBackgroundState) {
  if (!a && !b) {
    return true
  }

  if (!a || !b) {
    return false
  }

  return (
    a.type === b.type &&
    a.imageUrl === b.imageUrl &&
    a.imageThumb === b.imageThumb &&
    a.photographer === b.photographer &&
    a.solidColor === b.solidColor &&
    serializeGradientConfig(a.gradientConfig) === serializeGradientConfig(b.gradientConfig) &&
    serializeFilters(a.filters) === serializeFilters(b.filters)
  )
}

function areBackgroundMapsEqual(
  a: Record<number, SlideBackgroundState>,
  b: Record<number, SlideBackgroundState>
) {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)

  if (aKeys.length !== bKeys.length) {
    return false
  }

  return aKeys.every((key) => {
    const slideNumber = Number(key)
    return areBackgroundStatesEqual(a[slideNumber], b[slideNumber])
  })
}

function toBackgroundSelection(
  slide: InstagramCarouselSlide,
  background: SlideBackgroundState
): SlideBackgroundSelection {
  return {
    slide_number: slide.slide_number,
    bg_type: background.type,
    gradient_config: background.gradientConfig,
    image_url: background.imageUrl,
    photographer: background.photographer,
    solid_color: background.solidColor,
    filters: background.filters,
  }
}

function serializeBackgroundSelections(selections: SlideBackgroundSelection[]) {
  return JSON.stringify(
    selections.map((selection) => ({
      bg_type: selection.bg_type,
      filters: selection.filters
        ? {
            brightness: selection.filters.brightness ?? null,
            contrast: selection.filters.contrast ?? null,
            grayscale: selection.filters.grayscale ?? null,
            saturate: selection.filters.saturate ?? null,
            sepia: selection.filters.sepia ?? null,
          }
        : null,
      gradient_config: selection.gradient_config ? normalizeGradientConfig(selection.gradient_config) : null,
      image_url: selection.image_url ?? null,
      photographer: selection.photographer ?? null,
      slide_number: selection.slide_number,
      solid_color: selection.solid_color ?? null,
    }))
  )
}

function getResolvedBackground(slide: InstagramCarouselSlide, background: SlideBackgroundState): ResolvedBackground {
  const resolved = resolveSlideBackground(slide, background as any)
  const baseBackground =
    resolved.type === 'gradient'
      ? gradientConfigToCss(resolved.config)
      : resolved.type === 'solid'
        ? resolved.color
        : '#101417'

  return {
    accentColor: '#462D6E',
    baseBackground,
    imageUrl: resolved.type === 'image' ? resolved.url : undefined,
    logoVariant: getLogoVariantForResolvedBackground(resolved),
    overlay: resolved.overlay,
    thumbnailBackground: baseBackground,
  }
}

function getCounterLabel(slideNumber: number, totalSlides: number) {
  return `${String(slideNumber).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}`
}

function SlideBackdrop({ background, slide }: Pick<SlideTemplateProps, 'background' | 'slide'>) {
  const resolved = getResolvedBackground(slide, background)
  const filters = background.filters || {}
  const filterStyle = [
    filters.brightness !== undefined ? `brightness(${filters.brightness}%)` : '',
    filters.contrast !== undefined ? `contrast(${filters.contrast}%)` : '',
    filters.saturate !== undefined ? `saturate(${filters.saturate}%)` : '',
    filters.sepia !== undefined ? `sepia(${filters.sepia}%)` : '',
    filters.grayscale !== undefined ? `grayscale(${filters.grayscale}%)` : '',
  ].filter(Boolean).join(' ')

  return (
    <>
      <div className="absolute inset-0" style={{ background: resolved.baseBackground }} />
      {resolved.imageUrl ? (
        <>
          <Image
            src={resolved.imageUrl}
            alt=""
            fill
            sizes="1080px"
            className="object-cover"
            style={{ filter: filterStyle || undefined }}
          />
          <div className="absolute inset-0" style={{ background: resolved.overlay }} />
        </>
      ) : null}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: NOISE_TEXTURE,
          backgroundSize: `${toCanvasPx(72)}px ${toCanvasPx(72)}px`,
          opacity: 0.03,
        }}
      />
    </>
  )
}

function CoverSlide({ angle, background, slide }: SlideTemplateProps) {
  const resolved = getResolvedBackground(slide, background)
  const eyebrow = sanitizeSlideText(angle)?.toUpperCase()
  const headline = sanitizeSlideText(slide.headline)
  const subtitle = sanitizeSlideText(slide.body)

  return (
    <div className="relative h-[1080px] w-[1080px] overflow-hidden">
      <SlideBackdrop background={background} slide={slide} />

      <div
        className="relative z-10 flex h-full flex-col"
        style={{ padding: toCanvasPx(32) }}
      >
        <div className="flex-1" />

        <div style={{ display: 'flex', flexDirection: slide.text_order === 'body-first' ? 'column-reverse' : 'column', gap: toCanvasPx(8) }}>
          <div>
            {eyebrow ? (
              <span
                className="inline-block"
                style={{
                  marginBottom: toCanvasPx(10),
                  borderRadius: toCanvasPx(4),
                  background: resolved.accentColor,
                  color: '#E0E5EB',
                  fontFamily: 'var(--font-inter)',
                  fontSize: toCanvasPx(10),
                  fontWeight: 500,
                  letterSpacing: '0.15em',
                  padding: `${toCanvasPx(3)}px ${toCanvasPx(8)}px`,
                }}
              >
                {eyebrow}
              </span>
            ) : null}

            <h3
              style={{
                ...clampLines(3),
                color: '#E0E5EB',
                fontFamily: 'var(--font-brand-display)',
                fontSize: toCanvasPx(28),
                fontWeight: 900,
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                maxWidth: '84%',
                textShadow: resolved.imageUrl ? '0 12px 36px rgba(0, 0, 0, 0.42)' : 'none',
                margin: 0,
              }}
            >
              {headline}
            </h3>
          </div>

          {subtitle ? (
            <p
              style={{
                ...clampLines(2),
                color: 'rgba(224, 229, 235, 0.6)',
                fontFamily: 'var(--font-inter)',
                fontSize: toCanvasPx(13),
                fontWeight: 400,
                lineHeight: 1.45,
                maxWidth: '72%',
                margin: 0,
              }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>

        <div
          style={{
            background: resolved.accentColor,
            height: toCanvasPx(2),
            marginTop: toCanvasPx(16),
            width: toCanvasPx(32),
          }}
        />

        <div
          className="absolute inset-x-0 z-10 flex items-center justify-between"
          style={{
            bottom: toCanvasPx(16),
            paddingLeft: toCanvasPx(32),
            paddingRight: toCanvasPx(32),
          }}
        >
          <span
            style={{
              color: '#4E576A',
              fontFamily: 'var(--font-inter)',
              fontSize: toCanvasPx(10),
              fontWeight: 400,
            }}
          >
            noctra.studio
          </span>
          <Image
            src={`/brand/favicon-${resolved.logoVariant}.svg`}
            alt=""
            width={Math.round(toCanvasPx(20))}
            height={Math.round(toCanvasPx(20))}
            style={{ opacity: 0.6 }}
          />
        </div>
      </div>
    </div>
  )
}

function ContentSlide({ background, slide, totalSlides }: SlideTemplateProps) {
  const resolved = getResolvedBackground(slide, background)
  const headline = sanitizeSlideText(slide.headline)
  const body = sanitizeSlideText(slide.body)
  const stat = sanitizeSlideText(slide.stat_or_example)
  const template = slide.suggested_template || 'editorial'

  // Dynamic Font Scaling Logic (Simplified for CSS)
  const getHeadlineSize = (text: string) => {
    const len = text.length
    if (len > 80) return toCanvasPx(12)
    if (len > 60) return toCanvasPx(14)
    if (len > 40) return toCanvasPx(16)
    if (len > 25) return toCanvasPx(18)
    return toCanvasPx(24)
  }

  const getBodySize = (text: string) => {
    const len = text.length
    if (len > 150) return toCanvasPx(8)
    if (len > 100) return toCanvasPx(10)
    if (len > 60) return toCanvasPx(11)
    return toCanvasPx(13)
  }

  const renderTemplate = () => {
    switch (template) {
      case 'bold-statement':
        return (
          <div className="flex h-full flex-col items-center justify-center text-center p-12">
            <h3
              style={{
                ...clampLines(4),
                color: '#E0E5EB',
                fontFamily: 'var(--font-brand-display)',
                fontSize: getHeadlineSize(headline) * 1.5,
                fontWeight: 900,
                lineHeight: 1.1,
                textTransform: 'uppercase',
                letterSpacing: '-0.04em',
                textShadow: resolved.imageUrl ? '0 20px 40px rgba(0,0,0,0.5)' : 'none',
                margin: 0,
                width: '100%',
              }}
            >
              {headline}
            </h3>
          </div>
        )
      case 'split':
        return (
          <div className="flex h-full flex-col">
            <div className="flex-1 flex flex-col justify-end pb-8">
               <h3 style={{ ...clampLines(3), fontSize: getHeadlineSize(headline), fontWeight: 800, color: '#E0E5EB', lineHeight: 1.2, margin: 0 }}>{headline}</h3>
            </div>
            <div className="flex-1 bg-white/5 rounded-t-2xl p-8 backdrop-blur-sm overflow-hidden">
               <p style={{ ...clampLines(5), fontSize: getBodySize(body), lineHeight: 1.6, color: 'rgba(224,229,235,0.8)', margin: 0 }}>{body}</p>
            </div>
          </div>
        )
      case 'list':
        return (
          <div className="flex h-full flex-col justify-center gap-6 overflow-hidden">
            <h3 style={{ ...clampLines(2), fontSize: getHeadlineSize(headline), fontWeight: 700, color: resolved.accentColor, margin: 0 }}>{headline}</h3>
            <div className="space-y-4">
              {body.split('.').filter(s => s.trim()).slice(0, 4).map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ fontSize: toCanvasPx(10) }}>{i+1}</div>
                  <p style={{ ...clampLines(2), fontSize: getBodySize(item), color: '#E0E5EB', lineHeight: 1.4, margin: 0 }}>{item.trim()}</p>
                </div>
              ))}
            </div>
          </div>
        )
      case 'stat-hero':
        return (
          <div className="flex h-full flex-col items-center justify-center text-center overflow-hidden">
            <div style={{ fontSize: toCanvasPx(64), fontWeight: 900, color: resolved.accentColor, lineHeight: 1 }}>{stat || "50%"}</div>
            <h3 style={{ ...clampLines(2), fontSize: getHeadlineSize(headline), fontWeight: 700, color: '#E0E5EB', marginTop: toCanvasPx(12), margin: 0 }}>{headline}</h3>
            <p style={{ ...clampLines(3), fontSize: getBodySize(body), color: 'rgba(224,229,235,0.6)', marginTop: toCanvasPx(8), margin: 0 }}>{body} / {stat}</p>
          </div>
        )
      case 'minimal-quote':
        return (
          <div className="flex h-full flex-col justify-center items-center text-center p-16 overflow-hidden">
            <span style={{ fontSize: toCanvasPx(48), color: resolved.accentColor, opacity: 0.5, lineHeight: 1 }}>"</span>
            <h3 style={{ ...clampLines(4), fontSize: getHeadlineSize(headline), fontStyle: 'italic', color: '#E0E5EB', lineHeight: 1.6, maxWidth: '80%', margin: 0 }}>{headline}</h3>
            <div style={{ height: 1, width: toCanvasPx(40), background: resolved.accentColor, margin: `${toCanvasPx(12)}px 0` }} />
            <p style={{ fontSize: toCanvasPx(10), textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(224,229,235,0.5)', margin: 0 }}>@noctra.studio</p>
          </div>
        )
      case 'editorial':
      default:
        return (
          <div className="flex h-full flex-col justify-center overflow-hidden">
            <h3
              style={{
                ...clampLines(3),
                color: '#E0E5EB',
                fontFamily: 'var(--font-brand-display)',
                fontSize: getHeadlineSize(headline) * 1.2,
                fontWeight: 700,
                lineHeight: 1.2,
                marginBottom: toCanvasPx(12),
                margin: 0,
              }}
            >
              {headline}
            </h3>
            <p
              style={{
                ...clampLines(5),
                color: 'rgba(224, 229, 235, 0.7)',
                fontFamily: 'var(--font-inter)',
                fontSize: getBodySize(body),
                lineHeight: 1.6,
                maxWidth: '92%',
                margin: 0,
              }}
            >
              {body}
            </p>
          </div>
        )
    }
  }

  return (
    <div className="relative h-[1080px] w-[1080px] overflow-hidden">
      <SlideBackdrop background={background} slide={slide} />
      <div className="relative z-10 h-full flex flex-col" style={{ padding: toCanvasPx(32) }}>
        <div className="flex justify-between items-center mb-8">
           <span style={{ fontSize: toCanvasPx(10), color: 'rgba(224,229,235,0.4)', fontWeight: 500, letterSpacing: '0.1em' }}>
              {getCounterLabel(slide.slide_number, totalSlides)}
           </span>
           <div style={{ width: toCanvasPx(40), height: 1, background: 'rgba(224,229,235,0.1)' }} />
        </div>
        
        <div className="flex-1 min-h-0">
           {renderTemplate()}
        </div>

        <div className="flex justify-end mt-4">
           <Image
             src={`/brand/favicon-${resolved.logoVariant}.svg`}
             alt=""
             width={Math.round(toCanvasPx(20))}
             height={Math.round(toCanvasPx(20))}
             style={{ opacity: 0.4 }}
           />
        </div>
      </div>
    </div>
  )
}


function CTASlide({ background, slide }: SlideTemplateProps) {
  const resolved = getResolvedBackground(slide, background)
  const message = sanitizeSlideText(slide.headline) || sanitizeSlideText(slide.body)

  return (
    <div className="relative h-[1080px] w-[1080px] overflow-hidden">
      <SlideBackdrop background={background} slide={slide} />

      <div
        className="relative z-10 flex h-full flex-col items-center justify-center text-center"
        style={{ padding: toCanvasPx(28) }}
      >
        <span
          className="absolute left-1/2"
          style={{
            color: resolved.accentColor,
            fontFamily: 'var(--font-inter)',
            fontSize: toCanvasPx(14),
            top: toCanvasPx(16),
            transform: 'translateX(-50%)',
          }}
        >
          ✦
        </span>

        <h3
          style={{
            ...clampLines(3),
            color: '#E0E5EB',
            fontFamily: 'var(--font-brand-display)',
            fontSize: toCanvasPx(20),
            fontWeight: 700,
            lineHeight: 1.3,
            maxWidth: '74%',
            textShadow: resolved.imageUrl ? '0 10px 28px rgba(0, 0, 0, 0.38)' : 'none',
          }}
        >
          {message}
        </h3>

        <div
          style={{
            background: resolved.accentColor,
            height: toCanvasPx(1),
            margin: `${toCanvasPx(14)}px auto 0`,
            width: toCanvasPx(24),
          }}
        />

        <p
          style={{
            color: resolved.accentColor,
            fontFamily: 'var(--font-inter)',
            fontSize: toCanvasPx(12),
            fontWeight: 500,
            letterSpacing: '0.05em',
            marginTop: toCanvasPx(14),
          }}
        >
          @NoctraStudio
        </p>

        <div
          className="absolute inset-x-0"
          style={{
            bottom: toCanvasPx(14),
            paddingLeft: toCanvasPx(28),
            paddingRight: toCanvasPx(28),
          }}
        >
          <p
            style={{
              color: '#4E576A',
              fontFamily: 'var(--font-inter)',
              fontSize: toCanvasPx(10),
              fontWeight: 400,
              letterSpacing: '0.08em',
              textAlign: 'center',
            }}
          >
            Ingeniería de Claridad
          </p>

          <div
            className="absolute"
            style={{
              bottom: 0,
              right: toCanvasPx(28),
            }}
          >
            <Image
              src={`/brand/favicon-${resolved.logoVariant}.svg`}
              alt=""
              width={Math.round(toCanvasPx(18))}
              height={Math.round(toCanvasPx(18))}
              style={{ opacity: 0.5 }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export function SlideCanvas(props: SlideTemplateProps) {
  if (props.slide.type === 'cover') {
    return <CoverSlide {...props} />
  }

  if (props.slide.type === 'cta') {
    return <CTASlide {...props} />
  }

  return <ContentSlide {...props} />
}

function SlideThumbnail({
  background,
  editedPreview,
  isSelected,
  onClick,
  slide,
}: {
  background: SlideBackgroundState
  editedPreview: string | null
  isSelected: boolean
  onClick: () => void
  slide: InstagramCarouselSlide
}) {
  const resolved = getResolvedBackground(slide, background)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-11 aspect-square overflow-hidden rounded-[6px] border-2 transition-all ${
        isSelected ? 'border-[#E0E5EB] opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
      }`}
    >
      {editedPreview ? (
        <Image src={editedPreview} alt="" fill unoptimized sizes="44px" className="object-cover" />
      ) : (
        <div className="absolute inset-0" style={{ background: resolved.thumbnailBackground }} />
      )}
      {!editedPreview && resolved.imageUrl ? (
        <>
          <Image
            src={resolved.imageUrl}
            alt=""
            fill
            sizes="44px"
            className="object-cover"
          />
          <div className="absolute inset-0" style={{ background: resolved.overlay }} />
        </>
      ) : null}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: NOISE_TEXTURE,
          backgroundSize: '20px 20px',
          opacity: 0.03,
        }}
      />
    </button>
  )
}

export function InstagramCarouselPreview({
  angle,
  editedSlides,
  initialBackgrounds = [],
  onOpenDetailEditor,
  slides,
  onBackgroundChange,
  onUpdateSlide,
}: CarouselPreviewProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [slideBackgrounds, setSlideBackgrounds] = useState<Record<number, SlideBackgroundState>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<UnsplashPhoto[]>([])
  const [recentColors, setRecentColors] = useState<string[]>([])
  const [savedGradients, setSavedGradients] = useState<CarouselGradientConfig[]>([])
  const [dynamicScale, setDynamicScale] = useState(DEFAULT_PREVIEW_SCALE)
  const containerRef = useRef<HTMLDivElement>(null)
  const onBackgroundChangeRef = useRef(onBackgroundChange)
  const lastBackgroundSelectionSignatureRef = useRef<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width
        if (width > 0) {
          setDynamicScale(width / SLIDE_SIZE)
        }
      }
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const currentSlide = slides[activeIndex] ?? null
  const totalSlides = slides.length

  useEffect(() => {
    setRecentColors(getRecentColors())
    setSavedGradients(getSavedGradients())
  }, [])

  useEffect(() => {
    onBackgroundChangeRef.current = onBackgroundChange
  }, [onBackgroundChange])

  useEffect(() => {
    const nextBackgrounds: Record<number, SlideBackgroundState> = {}
    slides.forEach((slide) => {
      const selection = initialBackgrounds.find((item) => item.slide_number === slide.slide_number)
      nextBackgrounds[slide.slide_number] = selection
        ? {
            type: selection.bg_type as any,
            gradientConfig: selection.gradient_config,
            imageUrl: selection.image_url,
            imageThumb: selection.image_url,
            photographer: selection.photographer,
            solidColor: selection.solid_color,
            filters: selection.filters,
          }
        : getInitialBackground(slide)
    })

    setSlideBackgrounds((prev) => (
      areBackgroundMapsEqual(prev, nextBackgrounds) ? prev : nextBackgrounds
    ))
  }, [initialBackgrounds, slides])

  useEffect(() => {
    const handleBackgroundChange = onBackgroundChangeRef.current

    if (!handleBackgroundChange) return

    const selections: SlideBackgroundSelection[] = slides.map((slide) => {
      const background = slideBackgrounds[slide.slide_number] ?? getInitialBackground(slide)
      return toBackgroundSelection(slide, background)
    })
    const nextSignature = serializeBackgroundSelections(selections)

    if (lastBackgroundSelectionSignatureRef.current === nextSignature) {
      return
    }

    lastBackgroundSelectionSignatureRef.current = nextSignature
    handleBackgroundChange(selections)
  }, [slideBackgrounds, slides])

  const currentBg = currentSlide ? slideBackgrounds[currentSlide.slide_number] ?? getInitialBackground(currentSlide) : null

  const previewQuickColors = [
    ...BRAND_COLOR_SWATCHES,
    ...recentColors.filter((color) => !BRAND_COLOR_SWATCHES.includes(color as any)).slice(0, 3),
  ]
  const previewGradientSuggestions = [...BRAND_GRADIENT_SUGGESTIONS.map((item) => item.config), ...savedGradients.slice(0, 2)]

  const updateCurrentBackground = (updater: (background: SlideBackgroundState) => SlideBackgroundState) => {
    if (!currentSlide) return
    setSlideBackgrounds((prev) => ({
      ...prev,
      [currentSlide.slide_number]: updater(prev[currentSlide.slide_number] ?? getInitialBackground(currentSlide)),
    }))
  }

  const handlePreviewBackgroundUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.readAsDataURL(file)
    })
    updateCurrentBackground((bg) => ({ ...bg, imageUrl: dataUrl, type: 'image' }))
  }

  if (!currentSlide || !currentBg) return null

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="mx-auto w-full max-w-[399px]">
        <div className="relative flex w-full flex-col overflow-hidden rounded-[42px] border border-white/10 bg-black p-3 shadow-2xl">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-zinc-800 overflow-hidden ring-1 ring-white/10">
                <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-zinc-500">NS</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-white">noctrastudio</span>
                <span className="text-[10px] text-zinc-500">Málaga, Spain</span>
              </div>
            </div>
            <MoreHorizontal className="h-4 w-4 text-white" />
          </div>

          <div 
            ref={containerRef}
            className="flex aspect-square items-center justify-center bg-black overflow-hidden relative"
          >
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={activeIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute origin-top-left"
                style={{
                  height: SLIDE_SIZE,
                  transform: `scale(${dynamicScale})`,
                  transformOrigin: 'top left',
                  width: SLIDE_SIZE,
                }}
              >
                <SlideCanvas
                  angle={angle}
                  background={currentBg}
                  isPreview
                  slide={currentSlide}
                  totalSlides={totalSlides}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="px-4 py-3">
             <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Heart className="h-6 w-6 text-white" />
                <MessageCircle className="h-6 w-6 text-white" />
                <Send className="h-6 w-6 text-white" />
              </div>
              <div className="flex gap-1">
                {slides.map((_, i) => (
                  <div key={i} className={cn("h-1.5 w-1.5 rounded-full transition-all", i === activeIndex ? 'bg-blue-500 scale-110' : 'bg-zinc-600 opacity-50')} />
                ))}
              </div>
              <Bookmark className="h-6 w-6 text-white" />
            </div>
            <div className="mt-2.5">
              <p className="text-[13px] font-semibold text-white">1,248 likes</p>
              <div className="mt-1 flex items-start gap-1 text-[13px] leading-snug">
                <span className="font-semibold text-white">noctrastudio</span>
                <span className="text-zinc-200 line-clamp-2">
                  {sanitizeSlideText(currentSlide.headline)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

       <div className="mx-auto w-full max-w-[399px] flex flex-col gap-4">
        <div className="flex h-[52px] items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {slides.map((slide, index) => (
            <SlideThumbnail
              key={slide.slide_number}
              background={slideBackgrounds[slide.slide_number] ?? getInitialBackground(slide)}
              editedPreview={getEditedSlidePreview(editedSlides, slide.slide_number)}
              isSelected={index === activeIndex}
              onClick={() => {
                setDirection(index > activeIndex ? 1 : -1)
                setActiveIndex(index)
              }}
              slide={slide}
            />
          ))}
        </div>

        <button
          onClick={() => onOpenDetailEditor(activeIndex)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white transition-all hover:bg-white/10"
        >
          <Pencil className="h-4 w-4" />
          Editar en detalle
        </button>

        <div className="rounded-2xl border border-white/10 bg-[#161b24] p-4 shadow-lg space-y-4">
           <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#4E576A]">Fondo</span>
            <div className="flex rounded-lg border border-white/5 bg-black/20 p-1">
              {BACKGROUND_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => updateCurrentBackground((bg) => ({ ...bg, type: type.id as any }))}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1 text-[10px] font-medium transition-all",
                    currentBg.type === type.id ? "bg-[#212631] text-white ring-1 ring-white/10" : "text-[#4E576A] hover:text-zinc-300"
                  )}
                >
                  <type.icon className="h-3 w-3" />
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="min-h-[60px]">
            {currentBg.type === 'image' && (
               <div className="space-y-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                   <button 
                    onClick={() => updateCurrentBackground(bg => ({ ...bg, showInlineSearch: !bg.showInlineSearch }))}
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-dashed border-[#4E576A] text-[#4E576A]"
                   >
                     <Search className="h-4 w-4" />
                   </button>
                   <label className="flex h-12 w-12 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-dashed border-[#4E576A] text-[#4E576A]">
                     <Upload className="h-4 w-4" />
                     <input type="file" className="hidden" onChange={(e) => void handlePreviewBackgroundUpload(e)} />
                   </label>
                </div>

                <div className="space-y-3 rounded-xl bg-black/20 p-3 border border-white/5">
                  <span className="text-[10px] font-semibold uppercase text-zinc-500 tracking-wider">Filtros</span>
                  <div className="space-y-2">
                    {[
                      { key: 'brightness', label: 'Brillo', min: 0, max: 200, default: 100 },
                      { key: 'contrast', label: 'Contraste', min: 0, max: 200, default: 100 },
                      { key: 'saturate', label: 'Saturación', min: 0, max: 200, default: 100 },
                    ].map((f) => (
                      <div key={f.key} className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-zinc-400">{f.label}</span>
                          <span className="text-white">{(currentBg.filters as any)?.[f.key] ?? f.default}%</span>
                        </div>
                        <input 
                          type="range" min={f.min} max={f.max}
                          value={(currentBg.filters as any)?.[f.key] ?? f.default}
                          onChange={(e) => updateCurrentBackground(bg => ({
                            ...bg, filters: { ...(bg.filters || {}), [f.key]: parseInt(e.target.value) }
                          }))}
                          className="h-1 w-full bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#462D6E]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {currentBg.type === 'gradient' && (
              <div className="grid grid-cols-2 gap-3">
                 <ColorPicker 
                  label="Color 1" 
                  value={currentBg.gradientConfig?.stops[0] || '#101417'} 
                  onChange={(hex) => updateCurrentBackground(bg => ({
                    ...bg, gradientConfig: normalizeGradientConfig({ ...bg.gradientConfig!, stops: [hex, bg.gradientConfig?.stops[1] || '#1C2028'] })
                  }))}
                 />
                 <ColorPicker 
                  label="Color 2" 
                  value={currentBg.gradientConfig?.stops[1] || '#1C2028'} 
                  onChange={(hex) => updateCurrentBackground(bg => ({
                    ...bg, gradientConfig: normalizeGradientConfig({ ...bg.gradientConfig!, stops: [bg.gradientConfig?.stops[0] || '#101417', hex] })
                  }))}
                 />
              </div>
            )}

            {currentBg.type === 'solid' && (
              <div className="grid grid-cols-4 gap-2">
                {previewQuickColors.slice(0, 8).map((color) => (
                  <button
                    key={color}
                    onClick={() => updateCurrentBackground(bg => ({ ...bg, type: 'solid', solidColor: color }))}
                    className={cn("h-10 rounded-lg border", currentBg.solidColor === color ? "border-white" : "border-white/10")}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#161b24] p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#4E576A]">Distribución</span>
            <div className="flex rounded-lg border border-white/5 bg-black/20 p-1">
              {['headline-first', 'body-first'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => onUpdateSlide?.(currentSlide.slide_number, { text_order: opt as any })}
                  className={cn("px-3 py-1 text-[10px] font-medium rounded-md", (currentSlide.text_order || 'headline-first') === opt ? "bg-[#212631] text-white ring-1 ring-white/10" : "text-[#4E576A]")}
                >
                  {opt === 'headline-first' ? 'Títulos up' : 'Cuerpo up'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
