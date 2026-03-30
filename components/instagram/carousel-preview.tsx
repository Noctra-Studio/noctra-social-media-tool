"use client";

import Image from 'next/image'
import { useEffect, useMemo, useState, useRef } from 'react'
import { ChevronLeft, ChevronRight, Info, ImageIcon, Palette, Square, Search, Plus, Loader2 } from 'lucide-react'
import type { InstagramCarouselSlide, SlideBackgroundSelection } from '@/lib/social-content'

type UnsplashPhoto = {
  id: string
  url: string
  thumb_url: string
  photographer: string
  unsplash_link: string
}

type SlideBackgroundState = {
  type: 'image' | 'gradient' | 'solid' | 'searching' | 'none'
  imageUrl?: string
  imageThumb?: string
  photographer?: string
  gradientStyle?: 'brand_dark' | 'brand_navy' | 'brand_subtle'
  solidColor?: '#101417' | '#212631'
  unsplashResults?: UnsplashPhoto[]
  showInlineSearch?: boolean
}

type CarouselPreviewProps = {
  onSearchUnsplash: (query: string) => void
  slides: InstagramCarouselSlide[]
  onBackgroundChange?: (backgrounds: SlideBackgroundSelection[]) => void
}

const GRADIENTS = {
  brand_dark: 'linear-gradient(135deg, #101417 0%, #1a1f28 100%)',
  brand_navy: 'linear-gradient(135deg, #212631 0%, #1a1f28 100%)',
  brand_subtle: 'linear-gradient(135deg, #101417 0%, #212631 100%)',
} as const

const SOLIDS = {
  midnight: '#101417',
  navy: '#212631',
} as const

export function InstagramCarouselPreview({ onSearchUnsplash, slides, onBackgroundChange }: CarouselPreviewProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [slideBackgrounds, setSlideBackgrounds] = useState<Record<number, SlideBackgroundState>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<UnsplashPhoto[]>([])
  
  const currentSlide = slides[activeIndex] ?? null
  const totalSlides = slides.length

  // Initialize backgrounds on load
  useEffect(() => {
    const initialBackgrounds: Record<number, SlideBackgroundState> = {}
    
    slides.forEach((slide) => {
      initialBackgrounds[slide.slide_number] = {
        type: slide.bg_type,
        gradientStyle: slide.gradient_style ?? undefined,
        solidColor: slide.slide_number % 2 !== 0 ? '#101417' : '#212631',
      }
    })
    
    setSlideBackgrounds(initialBackgrounds)

    // Parallel Unsplash search for 'image' slides
    const imageSlides = slides.filter(s => s.bg_type === 'image' && s.unsplash_query)
    
    Promise.allSettled(
      imageSlides.map(async (slide) => {
        try {
          const res = await fetch('/api/visual/search', {
            method: 'POST',
            body: JSON.stringify({
              keywords: [slide.unsplash_query],
              platform: 'instagram',
              count: 4
            })
          })
          const data = await res.json()
          if (data.photos?.length > 0) {
            const first = data.photos[0]
            setSlideBackgrounds(prev => ({
              ...prev,
              [slide.slide_number]: {
                ...prev[slide.slide_number],
                type: 'image',
                imageUrl: first.url,
                imageThumb: first.thumb_url,
                photographer: first.photographer,
                unsplashResults: data.photos
              }
            }))
          } else {
            // Fallback to gradient if no results
            setSlideBackgrounds(prev => ({
              ...prev,
              [slide.slide_number]: {
                ...prev[slide.slide_number],
                type: 'gradient',
                gradientStyle: 'brand_dark'
              }
            }))
          }
        } catch (err) {
          console.error('Failed to auto-search Unsplash:', err)
        }
      })
    )
  }, [slides])

  // Sync with parent whenever backgrounds change
  useEffect(() => {
    if (!onBackgroundChange) return
    const selections: SlideBackgroundSelection[] = Object.entries(slideBackgrounds).map(([num, bg]) => ({
      slide_number: Number(num),
      bg_type: bg.type === 'searching' || bg.type === 'none' ? 'solid' : bg.type,
      image_url: bg.imageUrl,
      photographer: bg.photographer,
      gradient_style: bg.gradientStyle,
      solid_color: bg.solidColor,
    }))
    onBackgroundChange(selections)
  }, [slideBackgrounds, onBackgroundChange])

  const currentBg = slideBackgrounds[currentSlide?.slide_number ?? -1]

  const backgroundStyle = useMemo(() => {
    if (!currentBg) return { background: '#101417' }
    
    if (currentBg.type === 'image' && currentBg.imageUrl) {
      return {
        backgroundImage: `linear-gradient(to bottom, rgba(10,12,15,0.55) 0%, rgba(10,12,15,0.35) 40%, rgba(10,12,15,0.70) 100%), url(${currentBg.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    }
    
    if (currentBg.type === 'gradient' && currentBg.gradientStyle) {
      return { background: GRADIENTS[currentBg.gradientStyle] || GRADIENTS.brand_dark }
    }
    
    if (currentBg.type === 'solid') {
      return { background: currentBg.solidColor || '#101417' }
    }
    
    return { background: '#101417' }
  }, [currentBg])

  const logoVariant = useMemo(() => {
    // Brand consistency: defaults to light (white) logo for dark backgrounds
    return 'light'
  }, [])

  const handleInlineSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim() || !currentSlide) return
    
    setIsSearching(true)
    try {
      const res = await fetch('/api/visual/search', {
        method: 'POST',
        body: JSON.stringify({
          keywords: [searchQuery],
          platform: 'instagram',
          count: 8
        })
      })
      const data = await res.json()
      setSearchResults(data.photos || [])
    } catch (err) {
      console.error('Manual search failed:', err)
    } finally {
      setIsSearching(false)
    }
  }

  if (!currentSlide || !currentBg) return null

  const isCover = currentSlide.type === 'cover'
  const isCta = currentSlide.type === 'cta'

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="mx-auto w-full max-w-[375px]">
        {/* PHONE MOCKUP */}
        <div className="relative flex h-[510px] w-full flex-col overflow-hidden rounded-[42px] border border-white/10 bg-black p-3 shadow-[0_24px_80px_rgba(0,0,0,0.45),inset_0_0_0_1px_rgba(255,255,255,0.05)]">
          {/* NOTCH */}
          <div className="absolute inset-x-0 top-0 flex justify-center py-3 z-10">
            <div className="h-1.5 w-20 rounded-full bg-white/10" />
          </div>

          {/* SLIDE CONTENT AREA */}
          <div
            className="relative mt-6 flex-1 overflow-hidden rounded-[16px] transition-all duration-500"
            style={backgroundStyle}
          >
            <div className="relative flex h-full flex-col p-5">
              {/* TOP ROW */}
              <div className="flex items-center justify-between">
                <div>
                  {!isCover && (
                    <div className="flex items-center rounded-full border border-white/8 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-[#4E576A]">
                      {String(currentSlide.slide_number).padStart(2, '0')}
                    </div>
                  )}
                </div>
                <div className="font-sans text-[11px] text-[#4E576A]">
                  {currentSlide.slide_number}/{totalSlides}
                </div>
              </div>

              {/* MIDDLE AREA */}
              <div className={`flex flex-1 flex-col ${isCover ? 'justify-center items-start' : isCta ? 'justify-center items-center' : 'justify-start pt-12'}`}>
                <h3 
                  className={`${isCover ? 'text-[26px]' : isCta ? 'text-[20px] text-center' : 'text-[22px] mt-4'} font-bold leading-[1.2] text-[#E0E5EB] line-clamp-2`}
                  style={{ 
                    fontFamily: 'var(--font-brand-display)', 
                    fontWeight: 700, 
                    letterSpacing: '-0.02em',
                    textShadow: currentBg.type === 'image' ? '0 1px 3px rgba(0,0,0,0.5)' : 'none'
                  }}
                >
                  {currentSlide.headline}
                </h3>

                <div className={`${isCta ? 'text-center mt-2' : 'mt-2'}`}>
                  {isCover ? (
                    <p className="text-sm leading-relaxed text-[#B5BDCA] line-clamp-2 font-normal">
                      {currentSlide.body}
                    </p>
                  ) : isCta ? (
                    <p className="text-[13px] font-medium text-[#462D6E]">@NoctraStudio</p>
                  ) : (
                    <p className="text-[13px] leading-[1.6] text-[#c8cdd6] line-clamp-4 font-normal">
                      {currentSlide.body}
                    </p>
                  )}
                </div>

                {!isCover && !isCta && currentSlide.stat_or_example && (
                  <div className="mt-4 overflow-hidden rounded-r-md border-l-[3px] border-[#462D6E] bg-[#462D6E]/15 p-2.5">
                    <p className="text-[13px] font-medium leading-relaxed text-[#E0E5EB]">
                      {currentSlide.stat_or_example}
                    </p>
                  </div>
                )}
              </div>

              {/* BOTTOM ROW */}
              <div className="absolute bottom-[12px] left-0 w-full px-5 flex items-center justify-between">
                <div>
                  {isCta && (
                    <p className="text-[11px] text-[#4E576A] font-normal">
                      Ingeniería de Claridad — noctra.studio
                    </p>
                  )}
                </div>
                <div className="opacity-75">
                  <Image src={`/brand/favicon-${logoVariant}.svg`} alt="Noctra" width={24} height={24} priority />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BACKGROUND PICKER CONTROL BAR */}
        <div className="mt-0 w-full rounded-b-[12px] border-x border-b border-[#2a3040] bg-[#1a1f28] p-3.5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 group relative">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4E576A]">Fondo</span>
              <div className="cursor-help text-[#4E576A] hover:text-[#E0E5EB] transition-colors">
                <Info className="h-3 w-3" />
              </div>
              {/* TOOLTIP */}
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-[180px] rounded-lg bg-[#212631] p-2.5 text-[11px] leading-relaxed text-[#B5BDCA] border border-white/10 shadow-xl z-20">
                La IA sugirió {currentSlide.bg_type === 'image' ? 'foto' : currentSlide.bg_type === 'gradient' ? 'gradiente' : 'sólido'} porque: {currentSlide.bg_reasoning}
              </div>
            </div>

            {/* TYPE SELECTOR */}
            <div className="flex bg-black/20 p-0.5 rounded-lg border border-white/5">
              {[
                { id: 'image', icon: ImageIcon, label: 'Foto' },
                { id: 'gradient', icon: Palette, label: 'Grad' },
                { id: 'solid', icon: Square, label: 'Solid' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSlideBackgrounds(prev => ({
                    ...prev,
                    [currentSlide.slide_number]: { ...prev[currentSlide.slide_number], type: t.id as any }
                  }))}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                    currentBg.type === t.id 
                      ? 'bg-[#212631] text-[#E0E5EB] border border-[#4E576A]' 
                      : 'text-[#4E576A] hover:text-[#B5BDCA]'
                  }`}
                >
                  <t.icon className="h-3 w-3" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* DYNAMIC CONTENT BASED ON TYPE */}
          <div className="min-h-[52px]">
            {currentBg.type === 'image' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {currentBg.unsplashResults?.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => setSlideBackgrounds(prev => ({
                        ...prev,
                        [currentSlide.slide_number]: {
                          ...prev[currentSlide.slide_number],
                          imageUrl: photo.url,
                          imageThumb: photo.thumb_url,
                          photographer: photo.photographer
                        }
                      }))}
                      className={`relative flex-shrink-0 h-[52px] w-[52px] rounded-md overflow-hidden transition-all ${
                        currentBg.imageUrl === photo.url ? 'ring-2 ring-[#E0E5EB] scale-95' : 'hover:brightness-110'
                      }`}
                    >
                      <Image src={photo.thumb_url} alt="Unsplash" fill className="object-cover" />
                    </button>
                  ))}
                  <button 
                    onClick={() => setSlideBackgrounds(prev => ({
                      ...prev,
                      [currentSlide.slide_number]: { ...prev[currentSlide.slide_number], showInlineSearch: !prev[currentSlide.slide_number].showInlineSearch }
                    }))}
                    className="flex-shrink-0 h-[52px] w-[52px] rounded-md border border-dashed border-[#4E576A] flex flex-col items-center justify-center text-[#4E576A] hover:text-[#E0E5EB] hover:border-[#E0E5EB] transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-[8px] font-bold mt-0.5">BUSCAR</span>
                  </button>
                </div>

                {currentBg.showInlineSearch && (
                  <form onSubmit={handleInlineSearch} className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar otra foto..."
                        className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-3 pr-10 text-xs text-[#E0E5EB] placeholder:text-[#4E576A] focus:outline-none focus:border-[#462D6E]/50"
                      />
                      <button type="submit" disabled={isSearching} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#4E576A] hover:text-[#E0E5EB]">
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </button>
                    </div>

                    {searchResults.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-3 p-2 bg-black/20 rounded-lg border border-white/5 max-h-[120px] overflow-y-auto">
                        {searchResults.map((photo) => (
                          <button
                            key={photo.id}
                            onClick={() => {
                              setSlideBackgrounds(prev => ({
                                ...prev,
                                [currentSlide.slide_number]: {
                                  ...prev[currentSlide.slide_number],
                                  imageUrl: photo.url,
                                  imageThumb: photo.thumb_url,
                                  photographer: photo.photographer,
                                  unsplashResults: [photo, ...(prev[currentSlide.slide_number].unsplashResults || []).slice(0, 3)]
                                }
                              }))
                              setSearchResults([])
                              setSlideBackgrounds(prev => ({ ...prev, [currentSlide.slide_number]: { ...prev[currentSlide.slide_number], showInlineSearch: false } }))
                            }}
                            className="relative aspect-square rounded-md overflow-hidden hover:brightness-110"
                          >
                            <Image src={photo.thumb_url} alt="Search result" fill className="object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </form>
                )}
              </div>
            )}

            {currentBg.type === 'gradient' && (
              <div className="flex gap-3">
                {(Object.keys(GRADIENTS) as Array<keyof typeof GRADIENTS>).map((style) => (
                  <button
                    key={style}
                    onClick={() => setSlideBackgrounds(prev => ({
                      ...prev,
                      [currentSlide.slide_number]: { ...prev[currentSlide.slide_number], gradientStyle: style }
                    }))}
                    className={`h-[52px] w-[80px] rounded-md transition-all ${
                      currentBg.gradientStyle === style ? 'ring-2 ring-[#E0E5EB] scale-95' : 'hover:brightness-110'
                    }`}
                    style={{ background: GRADIENTS[style] }}
                  />
                ))}
              </div>
            )}

            {currentBg.type === 'solid' && (
              <div className="flex gap-3">
                {(Object.entries(SOLIDS) as [string, typeof SOLIDS[keyof typeof SOLIDS]][]).map(([key, color]) => (
                  <button
                    key={key}
                    onClick={() => setSlideBackgrounds(prev => ({
                      ...prev,
                      [currentSlide.slide_number]: { 
                        ...prev[currentSlide.slide_number], 
                        type: 'solid',
                        solidColor: color 
                      }
                    }))}
                    className={`h-[52px] w-[52px] rounded-md transition-all ${
                      currentBg.solidColor === color ? 'ring-2 ring-[#E0E5EB] scale-95' : 'hover:brightness-110'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NAVIGATION DOTS */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setActiveIndex((curr) => (curr === 0 ? totalSlides - 1 : curr - 1))}
          className="p-2 rounded-full border border-white/10 hover:bg-white/5 text-[#4E576A] hover:text-[#E0E5EB]"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex gap-1.5 h-1.5 items-center">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`transition-all duration-300 ${
                i === activeIndex ? 'w-5 h-full rounded-full bg-[#E0E5EB]' : 'w-1.5 h-full rounded-full bg-[#4E576A]'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setActiveIndex((curr) => (curr === totalSlides - 1 ? 0 : curr + 1))}
          className="p-2 rounded-full border border-white/10 hover:bg-white/5 text-[#4E576A] hover:text-[#E0E5EB]"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
