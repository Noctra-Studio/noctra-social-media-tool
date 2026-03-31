"use client";

import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, type CSSProperties, type ChangeEvent, type FormEvent } from 'react'
import { Bookmark, ChevronLeft, ChevronRight, Info, ImageIcon, Loader2, Palette, Pencil, Plus, Search, Square, Upload } from 'lucide-react'
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

type SlideBackgroundState = {
  type: SlideBackgroundType
  gradientConfig?: CarouselGradientConfig
  imageUrl?: string
  imageThumb?: string
  photographer?: string
  solidColor?: string
  unsplashResults?: UnsplashPhoto[]
  showInlineSearch?: boolean
}

type CarouselPreviewProps = {
  angle?: string
  editedSlides?: CarouselEditorSlide[]
  initialBackgrounds?: SlideBackgroundSelection[]
  onOpenDetailEditor: (activeIndex: number) => void
  slides: InstagramCarouselSlide[]
  onBackgroundChange?: (backgrounds: SlideBackgroundSelection[]) => void
}

type SlideTemplateProps = {
  angle?: string
  background: SlideBackgroundState
  isPreview: true
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
const PREVIEW_SCALE = 0.347
const SCALE_MULTIPLIER = 1 / PREVIEW_SCALE
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

function toCanvasPx(value: number) {
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

function getResolvedBackground(slide: InstagramCarouselSlide, background: SlideBackgroundState): ResolvedBackground {
  const resolved = resolveSlideBackground(slide, background)
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
            }}
          >
            {headline}
          </h3>

          {subtitle ? (
            <p
              style={{
                ...clampLines(2),
                marginTop: toCanvasPx(8),
                color: 'rgba(224, 229, 235, 0.6)',
                fontFamily: 'var(--font-inter)',
                fontSize: toCanvasPx(13),
                fontWeight: 400,
                lineHeight: 1.45,
                maxWidth: '72%',
              }}
            >
              {subtitle}
            </p>
          ) : null}

          <div
            style={{
              background: resolved.accentColor,
              height: toCanvasPx(2),
              marginTop: toCanvasPx(16),
              width: toCanvasPx(32),
            }}
          />
        </div>

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

  return (
    <div className="relative h-[1080px] w-[1080px] overflow-hidden">
      <SlideBackdrop background={background} slide={slide} />

      <div
        className="relative z-10 h-full"
        style={{ padding: toCanvasPx(24) }}
      >
        <div className="flex items-center justify-between">
          <span
            style={{
              color: '#4E576A',
              fontFamily: 'var(--font-inter)',
              fontSize: toCanvasPx(10),
              fontWeight: 500,
              letterSpacing: '0.1em',
            }}
          >
            {getCounterLabel(slide.slide_number, totalSlides)}
          </span>
          <div
            style={{
              alignSelf: 'center',
              background: '#2A3040',
              height: toCanvasPx(1),
              width: toCanvasPx(40),
            }}
          />
        </div>

        <div style={{ marginTop: toCanvasPx(20) }}>
          <h3
            style={{
              ...clampLines(2),
              color: '#E0E5EB',
              fontFamily: 'var(--font-brand-display)',
              fontSize: toCanvasPx(20),
              fontWeight: 700,
              letterSpacing: '-0.01em',
              lineHeight: 1.25,
              maxWidth: '86%',
              textShadow: resolved.imageUrl ? '0 10px 28px rgba(0, 0, 0, 0.38)' : 'none',
            }}
          >
            {headline}
          </h3>

          <p
            style={{
              ...clampLines(5),
              marginTop: toCanvasPx(12),
              color: 'rgba(224, 229, 235, 0.75)',
              fontFamily: 'var(--font-inter)',
              fontSize: toCanvasPx(12),
              fontWeight: 400,
              lineHeight: 1.65,
              maxWidth: '88%',
            }}
          >
            {body}
          </p>

          {stat ? (
            <div
              style={{
                background: 'rgba(70, 45, 110, 0.12)',
                borderLeft: `${toCanvasPx(2)}px solid ${resolved.accentColor}`,
                borderRadius: `0 ${toCanvasPx(6)}px ${toCanvasPx(6)}px 0`,
                marginTop: toCanvasPx(14),
                maxWidth: '84%',
                padding: `${toCanvasPx(8)}px ${toCanvasPx(12)}px`,
              }}
            >
              <p
                style={{
                  color: '#E0E5EB',
                  fontFamily: 'var(--font-inter)',
                  fontSize: toCanvasPx(11),
                  fontWeight: 500,
                  lineHeight: 1.5,
                }}
              >
                {stat}
              </p>
            </div>
          ) : null}
        </div>

        <div
          className="absolute inset-x-0 flex justify-end"
          style={{
            bottom: toCanvasPx(14),
            paddingLeft: toCanvasPx(24),
            paddingRight: toCanvasPx(24),
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

function SlideCanvas(props: SlideTemplateProps) {
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

      {slide.type === 'cover' ? (
        <div
          className="absolute rounded-full"
          style={{
            background: '#462D6E',
            bottom: 7,
            height: 2,
            left: 7,
            width: 16,
          }}
        />
      ) : null}

      {slide.type === 'content' ? (
        <div
          className="absolute"
          style={{
            background: '#2A3040',
            height: 1,
            right: 6,
            top: 7,
            width: 12,
          }}
        />
      ) : null}

      {slide.type === 'cta' ? (
        <div
          className="absolute left-1/2"
          style={{
            background: '#462D6E',
            height: 1,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 12,
          }}
        />
      ) : null}
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
}: CarouselPreviewProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [slideBackgrounds, setSlideBackgrounds] = useState<Record<number, SlideBackgroundState>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<UnsplashPhoto[]>([])
  const [recentColors, setRecentColors] = useState<string[]>([])
  const [savedGradients, setSavedGradients] = useState<CarouselGradientConfig[]>([])

  const currentSlide = slides[activeIndex] ?? null
  const totalSlides = slides.length

  useEffect(() => {
    if (activeIndex < slides.length) {
      return
    }

    setActiveIndex(Math.max(slides.length - 1, 0))
  }, [activeIndex, slides.length])

  useEffect(() => {
    setRecentColors(getRecentColors())
    setSavedGradients(getSavedGradients())
  }, [])

  useEffect(() => {
    let isMounted = true
    const nextBackgrounds: Record<number, SlideBackgroundState> = {}

    slides.forEach((slide) => {
      const selection = initialBackgrounds.find((item) => item.slide_number === slide.slide_number)

      nextBackgrounds[slide.slide_number] = selection
        ? {
            type: selection.bg_type,
            gradientConfig: selection.gradient_config
              ? normalizeGradientConfig(selection.gradient_config)
              : selection.gradient_style === 'brand_navy'
                ? BRAND_GRADIENT_SUGGESTIONS[1]?.config
                : selection.gradient_style === 'brand_subtle'
                  ? BRAND_GRADIENT_SUGGESTIONS[2]?.config
                  : selection.gradient_style === 'brand_dark'
                    ? BRAND_GRADIENT_SUGGESTIONS[0]?.config
                    : undefined,
            imageUrl: selection.image_url,
            imageThumb: selection.image_url,
            photographer: selection.photographer,
            solidColor: selection.solid_color,
          }
        : getInitialBackground(slide)
    })

    setSlideBackgrounds(nextBackgrounds)

    const imageSlides = slides.filter((slide) => slide.bg_type === 'image' && slide.unsplash_query)

    void Promise.allSettled(
      imageSlides.map(async (slide) => {
        try {
          const res = await fetch('/api/visual/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              keywords: [slide.unsplash_query],
              platform: 'instagram',
              count: 4,
            }),
          })
          const data = (await res.json()) as { photos?: UnsplashPhoto[] }

          if (!isMounted) {
            return
          }

          if (data.photos?.length) {
            const [first] = data.photos

            setSlideBackgrounds((prev) => ({
              ...prev,
              [slide.slide_number]: {
                ...prev[slide.slide_number],
                type: prev[slide.slide_number]?.type === 'image' ? 'image' : prev[slide.slide_number]?.type ?? 'image',
                imageUrl: first.url,
                imageThumb: first.thumb_url,
                photographer: first.photographer,
                unsplashResults: data.photos,
              },
            }))
          }
        } catch (error) {
          console.error('Failed to auto-search Unsplash:', error)
        }
      })
    )

    return () => {
      isMounted = false
    }
  }, [initialBackgrounds, slides])

  useEffect(() => {
    if (!onBackgroundChange) {
      return
    }

    const selections: SlideBackgroundSelection[] = slides.map((slide) => {
      const background = slideBackgrounds[slide.slide_number] ?? getInitialBackground(slide)

      return {
        slide_number: slide.slide_number,
        bg_type: background.type,
        gradient_config: background.gradientConfig,
        image_url: background.imageUrl,
        photographer: background.photographer,
        solid_color: background.solidColor,
      }
    })

    onBackgroundChange(selections)
  }, [onBackgroundChange, slideBackgrounds, slides])

  const currentBg = currentSlide ? slideBackgrounds[currentSlide.slide_number] ?? getInitialBackground(currentSlide) : null

  const handleInlineSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!searchQuery.trim() || !currentSlide) {
      return
    }

    setIsSearching(true)

    try {
      const res = await fetch('/api/visual/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: [searchQuery],
          platform: 'instagram',
          count: 8,
        }),
      })
      const data = (await res.json()) as { photos?: UnsplashPhoto[] }

      setSearchResults(data.photos ?? [])
    } catch (error) {
      console.error('Manual search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const goToSlide = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= slides.length || nextIndex === activeIndex) {
      return
    }

    setDirection(nextIndex > activeIndex ? 1 : -1)
    setActiveIndex(nextIndex)
  }

  const handleOpenDetailEditor = () => {
    if (!currentSlide) {
      return
    }

    onOpenDetailEditor(activeIndex)
  }

  const updateCurrentBackground = (updater: (background: SlideBackgroundState) => SlideBackgroundState) => {
    if (!currentSlide) {
      return
    }

    setSlideBackgrounds((prev) => {
      const current = prev[currentSlide.slide_number] ?? getInitialBackground(currentSlide)
      return {
        ...prev,
        [currentSlide.slide_number]: updater(current),
      }
    })
  }

  const handlePreviewBackgroundUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })

    updateCurrentBackground((background) => ({
      ...background,
      imageThumb: dataUrl,
      imageUrl: dataUrl,
      type: 'image',
    }))
  }

  if (!currentSlide || !currentBg) {
    return null
  }

  const editedPreview = getEditedSlidePreview(editedSlides, currentSlide.slide_number)
  const previewQuickColors = [
    ...BRAND_COLOR_SWATCHES,
    ...recentColors.filter((color) => !BRAND_COLOR_SWATCHES.includes(color as (typeof BRAND_COLOR_SWATCHES)[number])).slice(0, 3),
  ]
  const previewGradientSuggestions = [...BRAND_GRADIENT_SUGGESTIONS.map((item) => item.config), ...savedGradients.slice(0, 2)]

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="mx-auto w-full max-w-[399px]">
        <div className="relative flex w-full flex-col overflow-hidden rounded-[42px] border border-white/10 bg-black p-3 shadow-[0_24px_80px_rgba(0,0,0,0.45),inset_0_0_0_1px_rgba(255,255,255,0.05)]">
          <div className="absolute inset-x-0 top-0 z-10 flex justify-center py-3">
            <div className="h-1.5 w-20 rounded-full bg-white/10" />
          </div>

          <div className="mt-6 flex min-h-[430px] items-center justify-center rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(70,45,110,0.18),transparent_44%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]">
            <div className="relative h-[375px] w-[375px] overflow-hidden rounded-[22px] bg-[#101417] shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={currentSlide.slide_number}
                  custom={direction}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  variants={slideVariants}
                  className="absolute inset-0"
                >
                  {editedPreview ? (
                    <Image src={editedPreview} alt="" fill unoptimized sizes="375px" className="object-cover" />
                  ) : (
                    <div
                      className="origin-top-left"
                      style={{
                        height: SLIDE_SIZE,
                        transform: `scale(${PREVIEW_SCALE})`,
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
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => goToSlide(activeIndex - 1)}
          disabled={activeIndex === 0}
          className={`flex h-8 w-8 items-center justify-center rounded-full border border-[#2A3040] backdrop-blur-[4px] transition-all ${
            activeIndex === 0
              ? 'cursor-default bg-[rgba(33,38,49,0.8)] opacity-30'
              : 'bg-[rgba(33,38,49,0.8)] text-[#E0E5EB] hover:border-[#4E576A] hover:bg-[#212631]'
          }`}
        >
          <ChevronLeft className="h-4 w-4 text-[#E0E5EB]" />
        </button>

        <div className="flex items-center gap-1.5">
          {slides.map((slide, index) => (
            <button
              key={slide.slide_number}
              type="button"
              onClick={() => goToSlide(index)}
              className={`transition-all duration-200 ${
                index === activeIndex
                  ? 'h-[6px] w-6 rounded-[3px] bg-[#E0E5EB]'
                  : 'h-[6px] w-[6px] rounded-full bg-[#2A3040] hover:bg-[#4E576A]'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => goToSlide(activeIndex + 1)}
          disabled={activeIndex === totalSlides - 1}
          className={`flex h-8 w-8 items-center justify-center rounded-full border border-[#2A3040] backdrop-blur-[4px] transition-all ${
            activeIndex === totalSlides - 1
              ? 'cursor-default bg-[rgba(33,38,49,0.8)] opacity-30'
              : 'bg-[rgba(33,38,49,0.8)] text-[#E0E5EB] hover:border-[#4E576A] hover:bg-[#212631]'
          }`}
        >
          <ChevronRight className="h-4 w-4 text-[#E0E5EB]" />
        </button>
      </div>

      <div className="flex h-[52px] max-w-full items-center gap-1.5 overflow-x-auto pb-1">
        {slides.map((slide, index) => (
          <SlideThumbnail
            key={slide.slide_number}
            background={slideBackgrounds[slide.slide_number] ?? getInitialBackground(slide)}
            editedPreview={getEditedSlidePreview(editedSlides, slide.slide_number)}
            isSelected={index === activeIndex}
            onClick={() => goToSlide(index)}
            slide={slide}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={handleOpenDetailEditor}
        className="inline-flex items-center gap-2 rounded-lg border border-[#2A3040] px-4 py-2 text-[13px] font-medium text-[#4E576A] transition-colors hover:border-[#4E576A] hover:text-[#E0E5EB]"
      >
        <Pencil className="h-3.5 w-3.5" />
        Editar en detalle →
      </button>

      <div className="mx-auto w-full max-w-[399px]">
        <div className="rounded-[18px] border border-[#2A3040] bg-[#161b24] p-3.5 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <div className="group relative flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4E576A]">Fondo</span>
              <div className="cursor-help text-[#4E576A] transition-colors hover:text-[#E0E5EB]">
                <Info className="h-3 w-3" />
              </div>
              <div className="absolute bottom-full left-0 z-20 mb-2 hidden w-[180px] rounded-lg border border-white/10 bg-[#212631] p-2.5 text-[11px] leading-relaxed text-[#B5BDCA] shadow-xl group-hover:block">
                La IA sugirió {currentSlide.bg_type === 'image' ? 'foto' : currentSlide.bg_type === 'gradient' ? 'gradiente' : 'sólido'} porque: {currentSlide.bg_reasoning}
              </div>
            </div>

            <div className="flex rounded-lg border border-white/5 bg-black/20 p-0.5">
              {BACKGROUND_TYPES.map((backgroundType) => (
                <button
                  key={backgroundType.id}
                  type="button"
                  onClick={() => {
                    updateCurrentBackground((background) => {
                      if (backgroundType.id === 'gradient') {
                        return {
                          ...background,
                          gradientConfig: normalizeGradientConfig(
                            background.gradientConfig ?? BRAND_GRADIENT_SUGGESTIONS[0]?.config
                          ),
                          type: 'gradient',
                        }
                      }

                      if (backgroundType.id === 'solid') {
                        return {
                          ...background,
                          solidColor: background.solidColor ?? '#101417',
                          type: 'solid',
                        }
                      }

                      return {
                        ...background,
                        type: 'image',
                      }
                    })
                  }}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-medium transition-all ${
                    currentBg.type === backgroundType.id
                      ? 'border border-[#4E576A] bg-[#212631] text-[#E0E5EB]'
                      : 'text-[#4E576A] hover:text-[#B5BDCA]'
                  }`}
                >
                  <backgroundType.icon className="h-3 w-3" />
                  {backgroundType.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-[52px]">
            {currentBg.type === 'image' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {currentBg.unsplashResults?.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => {
                        updateCurrentBackground((background) => ({
                          ...background,
                          imageUrl: photo.url,
                          imageThumb: photo.thumb_url,
                          photographer: photo.photographer,
                          type: 'image',
                        }))
                      }}
                      className={`relative h-[52px] w-[52px] flex-shrink-0 overflow-hidden rounded-md transition-all ${
                        currentBg.imageUrl === photo.url ? 'scale-95 ring-2 ring-[#E0E5EB]' : 'hover:brightness-110'
                      }`}
                    >
                      <Image src={photo.thumb_url} alt="" fill sizes="52px" className="object-cover" />
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      updateCurrentBackground((background) => ({
                        ...background,
                        showInlineSearch: !background.showInlineSearch,
                      }))
                    }}
                    className="flex h-[52px] w-[52px] flex-shrink-0 flex-col items-center justify-center rounded-md border border-dashed border-[#4E576A] text-[#4E576A] transition-colors hover:border-[#E0E5EB] hover:text-[#E0E5EB]"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="mt-0.5 text-[8px] font-bold">BUSCAR</span>
                  </button>

                  <label className="flex h-[52px] w-[52px] cursor-pointer flex-shrink-0 flex-col items-center justify-center rounded-md border border-dashed border-[#4E576A] text-[#4E576A] transition-colors hover:border-[#E0E5EB] hover:text-[#E0E5EB]">
                    <Upload className="h-4 w-4" />
                    <span className="mt-0.5 text-[8px] font-bold">SUBIR</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(event) => { void handlePreviewBackgroundUpload(event) }} />
                  </label>
                </div>

                {currentBg.showInlineSearch ? (
                  <form onSubmit={handleInlineSearch} className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Buscar otra foto..."
                        className="w-full rounded-lg border border-white/10 bg-black/40 py-2 pl-3 pr-10 text-xs text-[#E0E5EB] placeholder:text-[#4E576A] focus:border-[#462D6E]/50 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={isSearching}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#4E576A] hover:text-[#E0E5EB]"
                      >
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </button>
                    </div>

                    {searchResults.length ? (
                      <div className="mt-3 grid max-h-[120px] grid-cols-4 gap-2 overflow-y-auto rounded-lg border border-white/5 bg-black/20 p-2">
                        {searchResults.map((photo) => (
                          <button
                            key={photo.id}
                            type="button"
                            onClick={() => {
                              updateCurrentBackground((background) => ({
                                ...background,
                                imageUrl: photo.url,
                                imageThumb: photo.thumb_url,
                                photographer: photo.photographer,
                                type: 'image',
                                unsplashResults: [photo, ...(background.unsplashResults ?? []).slice(0, 3)],
                              }))
                              setSearchResults([])
                              updateCurrentBackground((background) => ({
                                ...background,
                                showInlineSearch: false,
                              }))
                            }}
                            className="relative aspect-square overflow-hidden rounded-md hover:brightness-110"
                          >
                            <Image src={photo.thumb_url} alt="" fill sizes="64px" className="object-cover" />
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </form>
                ) : null}
              </div>
            ) : null}

            {currentBg.type === 'gradient' ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {(['linear', 'radial'] as const).map((gradientType) => (
                    <button
                      key={gradientType}
                      type="button"
                      onClick={() =>
                        updateCurrentBackground((background) => ({
                          ...background,
                          gradientConfig: normalizeGradientConfig({
                            angle: background.gradientConfig?.angle ?? 145,
                            stops: background.gradientConfig?.stops ?? ['#101417', '#1C2028'],
                            type: gradientType,
                          }),
                          type: 'gradient',
                        }))
                      }
                      className={`rounded-xl border px-3 py-2 text-xs transition-colors ${
                        (currentBg.gradientConfig?.type ?? 'linear') === gradientType
                          ? 'border-[#4E576A] bg-[#212631] text-[#E0E5EB]'
                          : 'border-white/8 text-[#8D95A6] hover:border-[#4E576A] hover:text-[#E0E5EB]'
                      }`}
                    >
                      {gradientType === 'linear' ? 'Linear' : 'Radial'}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <ColorPicker
                    label="Color stop 1"
                    value={currentBg.gradientConfig?.stops[0] ?? '#101417'}
                    onChange={(hex) => {
                      setRecentColors(saveRecentColor(hex))
                      updateCurrentBackground((background) => ({
                        ...background,
                        gradientConfig: normalizeGradientConfig({
                          angle: background.gradientConfig?.angle ?? 145,
                          stops: [hex, background.gradientConfig?.stops?.[1] ?? '#1C2028', background.gradientConfig?.stops?.[2]].filter(Boolean) as string[],
                          type: background.gradientConfig?.type ?? 'linear',
                        }),
                        type: 'gradient',
                      }))
                    }}
                  />
                  <ColorPicker
                    label="Color stop 2"
                    value={currentBg.gradientConfig?.stops[1] ?? '#1C2028'}
                    onChange={(hex) => {
                      setRecentColors(saveRecentColor(hex))
                      updateCurrentBackground((background) => ({
                        ...background,
                        gradientConfig: normalizeGradientConfig({
                          angle: background.gradientConfig?.angle ?? 145,
                          stops: [background.gradientConfig?.stops?.[0] ?? '#101417', hex, background.gradientConfig?.stops?.[2]].filter(Boolean) as string[],
                          type: background.gradientConfig?.type ?? 'linear',
                        }),
                        type: 'gradient',
                      }))
                    }}
                  />
                </div>

                {(currentBg.gradientConfig?.type ?? 'linear') === 'linear' ? (
                  <label className="space-y-1 text-xs text-[#8D95A6]">
                    <span>Ángulo {Math.round(currentBg.gradientConfig?.angle ?? 145)}°</span>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      step={1}
                      value={currentBg.gradientConfig?.angle ?? 145}
                      onChange={(event) =>
                        updateCurrentBackground((background) => ({
                          ...background,
                          gradientConfig: normalizeGradientConfig({
                            angle: Number(event.target.value),
                            stops: background.gradientConfig?.stops ?? ['#101417', '#1C2028'],
                            type: 'linear',
                          }),
                          type: 'gradient',
                        }))
                      }
                      className="w-full"
                    />
                  </label>
                ) : null}

                <div className="flex items-center justify-between rounded-xl border border-white/8 bg-black/15 p-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8D95A6]">Sugeridos:</p>
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                      {previewGradientSuggestions.map((gradientConfig, index) => (
                        <button
                          key={`${gradientConfig.type}-${gradientConfig.angle}-${gradientConfig.stops.join('-')}-${index}`}
                          type="button"
                          onClick={() =>
                            updateCurrentBackground((background) => ({
                              ...background,
                              gradientConfig: normalizeGradientConfig(gradientConfig),
                              type: 'gradient',
                            }))
                          }
                          className="h-[52px] w-[74px] flex-shrink-0 rounded-md border border-white/8 transition-transform hover:scale-[1.02]"
                          style={{ background: gradientConfigToCss(gradientConfig) }}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!currentBg.gradientConfig) {
                        return
                      }

                      setSavedGradients(saveGradient(currentBg.gradientConfig))
                    }}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 text-[#8D95A6] transition-colors hover:border-[#4E576A] hover:text-[#E0E5EB]"
                    aria-label="Guardar este gradiente"
                    title="Guardar este gradiente"
                  >
                    <Bookmark className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}

            {currentBg.type === 'solid' ? (
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8D95A6]">Quick picks</p>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {Array.from({ length: 8 }).map((_, index) => {
                      const color = previewQuickColors[index]

                      if (!color) {
                        return (
                          <div
                            key={`empty-${index}`}
                            className="h-11 rounded-xl border border-dashed border-white/10 bg-black/10"
                          />
                        )
                      }

                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            setRecentColors(saveRecentColor(color))
                            updateCurrentBackground((background) => ({
                              ...background,
                              solidColor: color,
                              type: 'solid',
                            }))
                          }}
                          className={`h-11 rounded-xl border transition-transform hover:scale-[1.02] ${
                            currentBg.solidColor === color ? 'border-[#E0E5EB]' : 'border-white/10'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      )
                    })}
                  </div>
                </div>

                <ColorPicker
                  label="O elige cualquier color →"
                  value={currentBg.solidColor ?? '#101417'}
                  onChange={(hex) => {
                    setRecentColors(saveRecentColor(hex))
                    updateCurrentBackground((background) => ({
                      ...background,
                      solidColor: hex,
                      type: 'solid',
                    }))
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
