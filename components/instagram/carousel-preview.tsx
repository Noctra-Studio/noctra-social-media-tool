"use client";

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { NoctraLogoMark } from '@/components/NoctraLogoMark'
import type { InstagramCarouselSlide } from '@/lib/social-content'

type CarouselPreviewProps = {
  onSearchUnsplash: (query: string) => void
  slides: InstagramCarouselSlide[]
}

function inferSlideBackground(designNote: string) {
  const lower = designNote.toLowerCase()

  if (lower.includes('#462d6e') || lower.includes('morado') || lower.includes('violeta')) {
    return 'linear-gradient(135deg, rgba(70,45,110,0.95) 0%, rgba(16,20,23,1) 100%)'
  }

  if (lower.includes('#212631') || lower.includes('gris')) {
    return 'linear-gradient(180deg, rgba(33,38,49,1) 0%, rgba(16,20,23,1) 100%)'
  }

  return '#101417'
}

export function InstagramCarouselPreview({ onSearchUnsplash, slides }: CarouselPreviewProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const currentSlide = slides[activeIndex] ?? null
  const totalSlides = slides.length

  const background = useMemo(
    () => inferSlideBackground(currentSlide?.design_note ?? ''),
    [currentSlide?.design_note]
  )

  if (!currentSlide) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="mx-auto w-full max-w-[440px]">
        <div className="relative mx-auto flex h-[470px] w-[375px] flex-col overflow-hidden rounded-[42px] border border-white/10 bg-black p-3 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div className="absolute inset-x-0 top-0 flex justify-center py-3">
            <div className="h-1.5 w-20 rounded-full bg-white/10" />
          </div>

          <div
            className="relative mt-6 flex-1 rounded-[30px] border border-white/6 p-7"
            style={{ background }}
          >
            <div className="absolute top-5 right-5 rounded-full border border-white/10 bg-black/15 px-2.5 py-1 text-[11px] text-[#4E576A]">
              {currentSlide.slide_number}/{totalSlides}
            </div>

            <div className="flex h-full flex-col justify-between">
              <div className="space-y-5">
                <p
                  className="max-w-[250px] text-left text-[24px] leading-[1.05] font-semibold text-[#E0E5EB]"
                  style={{ fontFamily: 'var(--font-brand-display)' }}
                >
                  {currentSlide.headline}
                </p>
                <p className="max-w-[250px] text-left text-sm leading-6 text-[#4E576A]">
                  {currentSlide.body}
                </p>
              </div>

              <div className="flex items-end justify-between">
                <div className="max-w-[220px] rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-[11px] leading-5 text-[#8D95A6]">
                  {currentSlide.design_note}
                </div>
                <NoctraLogoMark className="h-5 w-5 opacity-40" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setActiveIndex((current) => (current === 0 ? totalSlides - 1 : current - 1))}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/[0.06]"
          aria-label="Slide anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          {slides.map((slide, index) => (
            <button
              key={`${slide.type}-${slide.slide_number}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-2.5 rounded-full transition-all ${
                index === activeIndex ? 'w-8 bg-[#E0E5EB]' : 'w-2.5 bg-white/15'
              }`}
              aria-label={`Ir al slide ${slide.slide_number}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setActiveIndex((current) => (current === totalSlides - 1 ? 0 : current + 1))}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/[0.06]"
          aria-label="Slide siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-[24px] border border-white/10 bg-[#101417] p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-[#4E576A]">Imagen sugerida</p>
        <p className="mt-2 text-sm italic leading-6 text-[#B5BDCA]">
          Imagen sugerida: {currentSlide.visual_direction}
        </p>
        <button
          type="button"
          onClick={() => onSearchUnsplash(currentSlide.visual_direction)}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5"
        >
          Buscar en Unsplash
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
