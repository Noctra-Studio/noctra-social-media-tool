"use client";

import Image from 'next/image'
import { useEffect, useState, useRef, type ChangeEvent, type FormEvent } from 'react'
import { Bookmark, Heart, MessageCircle, Send, MoreHorizontal, Pencil, Search, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InstagramCarouselSlide, SlideBackgroundSelection } from '@/lib/social-content'
import {
  BRAND_COLOR_SWATCHES,
  BRAND_GRADIENT_SUGGESTIONS,
  gradientConfigToCss,
  normalizeGradientConfig,
  type CarouselGradientConfig,
} from '@/lib/carousel-backgrounds'
import { ColorPicker } from '@/components/editor/color-picker'
import { getRecentColors, getSavedGradients, saveRecentColor } from '@/lib/editor-preferences'

// Types to match SlideCanvas expectations
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
  filters?: {
    brightness?: number
    contrast?: number
    saturate?: number
    sepia?: number
    grayscale?: number
  }
}

const SLIDE_SIZE = 1080
// Default scale as fallback
const DEFAULT_PREVIEW_SCALE = 375 / SLIDE_SIZE

interface InstagramPostPreviewProps {
  slide: InstagramCarouselSlide
  background?: SlideBackgroundSelection
  onBackgroundChange?: (background: SlideBackgroundSelection) => void
  onOpenDetailEditor?: () => void
  onUpdateSlide?: (updates: Partial<InstagramCarouselSlide>) => void
  isVerified?: boolean
  audioName?: string
}

const BACKGROUND_TYPES = [
  { icon: (props: any) => <Image src="/icons/image.svg" width={16} height={16} alt="" {...props} />, id: 'image', label: 'Imagen' },
  { icon: (props: any) => <div className="h-3 w-3 rounded-full bg-gradient-to-tr from-[#FF0080] to-[#7928CA]" {...props} />, id: 'gradient', label: 'Gradiente' },
  { icon: (props: any) => <div className="h-3 w-3 rounded-full bg-[#101417]" {...props} />, id: 'solid', label: 'Sólido' },
] as const

import { SlideCanvas } from './carousel-preview' 

export function InstagramPostPreview({
  slide,
  background,
  onBackgroundChange,
  onOpenDetailEditor,
  onUpdateSlide,
  isVerified = true,
  audioName = "A.R. Rahman, Alma Ferovic, Arjun Chandy · Tu...",
}: InstagramPostPreviewProps) {
  const [recentColors, setRecentColors] = useState<string[]>([])
  const [savedGradients, setSavedGradients] = useState<CarouselGradientConfig[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<UnsplashPhoto[]>([])
  const [dynamicScale, setDynamicScale] = useState(DEFAULT_PREVIEW_SCALE)
  const containerRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    setRecentColors(getRecentColors())
    setSavedGradients(getSavedGradients())
  }, [])

  // Map incoming snake_case selection to camelCase local state for the canvas
  const backgroundToState = (bg?: SlideBackgroundSelection): SlideBackgroundState => {
    return {
      type: (bg?.bg_type || slide.bg_type || 'solid') as SlideBackgroundType,
      solidColor: bg?.solid_color || slide.color_suggestion || '#101417',
      imageUrl: bg?.image_url,
      gradientConfig: bg?.gradient_config,
      photographer: bg?.photographer,
      filters: bg?.filters,
    }
  }

  const currentBgState = backgroundToState(background)

  const updateBackground = (updater: (bg: SlideBackgroundSelection) => SlideBackgroundSelection) => {
    if (onBackgroundChange) {
      const currentSnakeBg: SlideBackgroundSelection = {
        slide_number: slide.slide_number,
        bg_type: currentBgState.type as any,
        solid_color: currentBgState.solidColor,
        image_url: currentBgState.imageUrl,
        gradient_config: currentBgState.gradientConfig,
        photographer: currentBgState.photographer,
      }
      onBackgroundChange(updater(currentSnakeBg))
    }
  }

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      updateBackground((bg) => ({
        ...bg,
        image_url: dataUrl,
        bg_type: 'image',
      }))
    }
    reader.readAsDataURL(file)
  }

  const previewQuickColors = [
    ...BRAND_COLOR_SWATCHES,
    ...recentColors.filter((color) => !BRAND_COLOR_SWATCHES.includes(color as any)).slice(0, 3),
  ]
  const previewGradientSuggestions = [...BRAND_GRADIENT_SUGGESTIONS.map((item) => item.config), ...savedGradients.slice(0, 2)]

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="mx-auto w-full max-w-[399px]">
        <div className="relative flex w-full flex-col overflow-hidden rounded-[42px] border border-white/10 bg-black p-3 shadow-[0_24px_80px_rgba(0,0,0,0.45),inset_0_0_0_1px_rgba(255,255,255,0.05)]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-zinc-800 overflow-hidden ring-1 ring-white/10">
                <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-zinc-500">NS</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-[13px] font-semibold text-white">noctrastudio</span>
                  {isVerified && (
                    <svg viewBox="0 0 24 24" aria-label="Verified account" className="h-3 w-3 text-[#0095f6] fill-current">
                      <g><path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.97-.81-3.99s-2.6-1.27-3.99-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.98-.2-4 .81s-1.27 2.6-.81 4c-1.31.67-2.19 1.91-2.19 3.34s.88 2.67 2.19 3.34c-.46 1.39-.2 2.97.81 3.99s2.6 1.27 3.99.81c.66 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.97.2 3.99-.81s1.27-2.6.81-3.99c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.35-6.2 6.78z"></path></g>
                    </svg>
                  )}
                </div>
                {audioName ? (
                  <div className="flex items-center gap-1 overflow-hidden max-w-[180px]">
                    <svg viewBox="0 0 24 24" className="h-[9px] w-[9px] text-white fill-current flex-shrink-0">
                      <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44a.994.994 0 01-1.06 0l-7.9-4.44c-.32-.17-.53-.5-.53-.88V7.5c0-.38.21-.71.53-.88l7.9-4.44a.994.994 0 011.06 0l7.9 4.44c.32.17.53.5.53.88v9z" opacity=".2"/>
                      <path d="M12 21a1 1 0 01-.52-.14l-7.9-4.44A1 1 0 013 15.55V7.45a1 1 0 01.58-.91l7.9-4.44a1 1 0 011.05 0l7.9 4.44a1 1 0 01.57.91v8.1a1 1 0 01-.58.91l-7.9 4.44A1 1 0 0112 21zm-6.9-6.32l6.9 3.88 6.9-3.88V8.32l-6.9-3.88L5.1 8.32v6.36z"/>
                      <path d="M12 17.5a1 1 0 01-1-1v-6.5a1 1 0 011-1h.5a1 1 0 011 1v6.5a1 1 0 01-1 1H12z"/>
                    </svg>
                    <span className="text-[10px] text-white truncate animate-marquee whitespace-nowrap">{audioName}</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-zinc-500">Málaga, Spain</span>
                )}
              </div>
            </div>
            <MoreHorizontal className="h-4 w-4 text-white" />
          </div>

          <div 
            ref={containerRef}
            className="flex aspect-square items-center justify-center bg-black overflow-hidden relative"
          >
            <div 
              className="absolute origin-top-left"
              style={{
                height: SLIDE_SIZE,
                transform: `scale(${dynamicScale})`,
                transformOrigin: 'top left',
                width: SLIDE_SIZE,
              }}
            >
              <SlideCanvas
                angle="0"
                background={currentBgState}
                isPreview
                slide={slide}
                totalSlides={1}
              />
            </div>
          </div>

          {/* Interaction Bar */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Heart className="h-6 w-6 text-white hover:text-red-500 cursor-pointer transition-colors" />
                <MessageCircle className="h-6 w-6 text-white hover:text-zinc-400 cursor-pointer transition-colors" />
                <Send className="h-6 w-6 text-white hover:text-zinc-400 cursor-pointer transition-colors" />
              </div>
              <Bookmark className="h-6 w-6 text-white hover:text-zinc-400 cursor-pointer transition-colors" />
            </div>
            
            <div className="mt-2.5">
              <p className="text-[13px] font-semibold text-white">1,248 likes</p>
              <div className="mt-1 flex items-start gap-1 text-[13px] leading-snug">
                <span className="font-semibold text-white">noctrastudio</span>
                <span className="text-zinc-200 line-clamp-2">Optimiza tu presencia digital con Noctra...</span>
              </div>
              <p className="mt-1 text-[10px] uppercase text-zinc-500">Hace 4 horas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[399px] flex flex-col gap-4">
        <button
          onClick={onOpenDetailEditor}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white transition-all hover:bg-white/10"
        >
          <Pencil className="h-4 w-4" />
          Personalizar diseño completo
        </button>

        <div className="rounded-2xl border border-white/10 bg-[#161b24] p-4 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#4E576A]">Fondo</span>
            <div className="flex rounded-lg border border-white/5 bg-black/20 p-1">
              {BACKGROUND_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => updateBackground((bg) => ({ ...bg, bg_type: type.id as any }))}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1 text-[10px] font-medium transition-all",
                    currentBgState.type === type.id ? "bg-[#212631] text-white ring-1 ring-white/10" : "text-[#4E576A] hover:text-zinc-300"
                  )}
                >
                  <type.icon />
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-[60px]">
            {currentBgState.type === 'image' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                   <button 
                    onClick={() => {}} 
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-dashed border-[#4E576A] text-[#4E576A] transition-colors hover:border-white/20 hover:text-white"
                   >
                     <Search className="h-4 w-4" />
                   </button>
                   <label className="flex h-12 w-12 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-dashed border-[#4E576A] text-[#4E576A] transition-colors hover:border-white/20 hover:text-white">
                     <Upload className="h-4 w-4" />
                     <input type="file" className="hidden" onChange={handleUpload} />
                   </label>
                </div>

                {/* Filters Section */}
                <div className="space-y-3 rounded-xl bg-black/20 p-3 border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase text-zinc-500 tracking-wider">Filtros</span>
                    <button 
                      onClick={() => updateBackground(bg => ({ ...bg, filters: undefined }))}
                      className="text-[9px] text-[#462D6E] hover:underline"
                    >
                      Resetear
                    </button>
                  </div>
                  <div className="space-y-2">
                    {[
                      { key: 'brightness', label: 'Brillo', min: 0, max: 200, default: 100 },
                      { key: 'contrast', label: 'Contraste', min: 0, max: 200, default: 100 },
                      { key: 'saturate', label: 'Saturación', min: 0, max: 200, default: 100 },
                    ].map((f) => (
                      <div key={f.key} className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-zinc-400">{f.label}</span>
                          <span className="text-white">{(currentBgState.filters as any)?.[f.key] ?? f.default}%</span>
                        </div>
                        <input 
                          type="range"
                          min={f.min}
                          max={f.max}
                          value={(currentBgState.filters as any)?.[f.key] ?? f.default}
                          onChange={(e) => {
                            const val = parseInt(e.target.value)
                            updateBackground(bg => ({
                              ...bg,
                              filters: { ...(bg.filters || {}), [f.key]: val }
                            }))
                          }}
                          className="h-1 w-full bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#462D6E]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentBgState.type === 'gradient' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                   <ColorPicker 
                    label="Color 1" 
                    value={currentBgState.gradientConfig?.stops[0] || '#101417'} 
                    onChange={(hex) => updateBackground(bg => ({
                      ...bg,
                      gradient_config: normalizeGradientConfig({ ...bg.gradient_config!, stops: [hex, bg.gradient_config?.stops[1] || '#1C2028'] })
                    }))}
                   />
                   <ColorPicker 
                    label="Color 2" 
                    value={currentBgState.gradientConfig?.stops[1] || '#1C2028'} 
                    onChange={(hex) => updateBackground(bg => ({
                      ...bg,
                      gradient_config: normalizeGradientConfig({ ...bg.gradient_config!, stops: [bg.gradient_config?.stops[0] || '#101417', hex] })
                    }))}
                   />
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {previewGradientSuggestions.map((grad, i) => (
                    <button
                      key={i}
                      onClick={() => updateBackground(bg => ({ ...bg, bg_type: 'gradient', gradient_config: grad }))}
                      className="h-10 w-16 shrink-0 rounded-lg border border-white/10 transition-transform hover:scale-105"
                      style={{ background: gradientConfigToCss(grad) }}
                    />
                  ))}
                </div>
              </div>
            )}

            {currentBgState.type === 'solid' && (
              <div className="grid grid-cols-4 gap-2">
                {previewQuickColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateBackground(bg => ({ ...bg, bg_type: 'solid', solid_color: color }))}
                    className={cn(
                      "h-10 rounded-lg border transition-transform hover:scale-105",
                      currentBgState.solidColor === color ? "border-white" : "border-white/10"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Text Order Section */}
        <div className="rounded-2xl border border-white/10 bg-[#161b24] p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#4E576A]">Distribución</span>
            <div className="flex rounded-lg border border-white/5 bg-black/20 p-1">
              {[
                { id: 'headline-first', label: 'Títulos up' },
                { id: 'body-first', label: 'Cuerpo up' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onUpdateSlide?.({ text_order: opt.id as any })}
                  className={cn(
                    "px-3 py-1 text-[10px] font-medium transition-all rounded-md",
                    (slide.text_order || 'headline-first') === opt.id 
                      ? "bg-[#212631] text-white ring-1 ring-white/10" 
                      : "text-[#4E576A] hover:text-zinc-300"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
