"use client";

import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import type { LinkedInCarouselSlide } from '@/lib/social-content'

export type LinkedInPdfGeneratorHandle = {
  generatePdf: () => Promise<Blob>
}

type LinkedInPdfGeneratorProps = {
  slides: LinkedInCarouselSlide[]
}

function PdfLogoMark({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1.5" y="1.5" width="21" height="21" rx="5" fill="white" />
      <path d="M15.9 6.2a6.8 6.8 0 1 0 0 11.6A5.5 5.5 0 1 1 15.9 6.2Z" fill="#101417" />
    </svg>
  )
}

export const LinkedInPdfGenerator = forwardRef<LinkedInPdfGeneratorHandle, LinkedInPdfGeneratorProps>(
  function LinkedInPdfGenerator({ slides }, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const totalSlides = slides.length

    const slideTemplates = useMemo(
      () =>
        slides.map((slide, index) => {
          if (slide.type === 'cover') {
            return (
              <section
                key={`linkedin-pdf-slide-${slide.number}`}
                data-pdf-slide
                className="flex h-[1123px] w-[794px] flex-col justify-between overflow-hidden px-[72px] py-[72px] text-[#E0E5EB]"
                style={{ background: 'linear-gradient(135deg, #101417 0%, #212631 100%)' }}
              >
                <div className="flex items-start justify-between">
                  <PdfLogoMark className="h-8 w-8" />
                </div>
                <div className="space-y-6">
                  <p
                    className="max-w-[560px] text-[56px] leading-[1.02] font-semibold text-[#E0E5EB]"
                    style={{ fontFamily: 'var(--font-brand-display)' }}
                  >
                    {slide.title}
                  </p>
                  <p className="max-w-[500px] text-[28px] leading-[1.45] text-[#4E576A]">
                    {slide.subtitle}
                  </p>
                </div>
                <div className="flex items-end justify-between text-[18px] text-[#4E576A]">
                  <p>noctra.studio</p>
                  <p>{index + 1}/{totalSlides}</p>
                </div>
              </section>
            )
          }

          if (slide.type === 'cta') {
            return (
              <section
                key={`linkedin-pdf-slide-${slide.number}`}
                data-pdf-slide
                className="flex h-[1123px] w-[794px] flex-col items-center justify-center overflow-hidden px-[88px] py-[88px] text-center"
                style={{ background: '#212631' }}
              >
                <div className="space-y-6">
                  <p
                    className="text-[40px] leading-[1.15] font-semibold text-[#E0E5EB]"
                    style={{ fontFamily: 'var(--font-brand-display)' }}
                  >
                    {slide.message}
                  </p>
                  <p className="text-[28px] font-medium text-[#462D6E]">{slide.handle}</p>
                </div>
                <p className="absolute bottom-[72px] text-[18px] text-[#4E576A]">
                  Ingenieria de Claridad - noctra.studio
                </p>
              </section>
            )
          }

          return (
            <section
              key={`linkedin-pdf-slide-${slide.number}`}
              data-pdf-slide
              className="relative flex h-[1123px] w-[794px] flex-col overflow-hidden px-[72px] py-[72px]"
              style={{ background: '#101417' }}
            >
              <div className="inline-flex w-fit rounded-full bg-[#212631] px-4 py-2 text-[16px] text-[#4E576A]">
                Slide {slide.number}/{totalSlides}
              </div>

              <div className="mt-10 max-w-[560px] space-y-8">
                <p
                  className="text-[44px] leading-[1.08] font-semibold text-[#E0E5EB]"
                  style={{ fontFamily: 'var(--font-brand-display)' }}
                >
                  {slide.headline}
                </p>
                <p className="text-[26px] leading-[1.6] text-[#E0E5EB]">{slide.content}</p>
              </div>

              {slide.stat_or_example ? (
                <div className="mt-12 max-w-[520px] border-l-[6px] border-[#462D6E] bg-[#212631] px-6 py-5 text-[24px] leading-[1.55] text-[#E0E5EB]">
                  {slide.stat_or_example}
                </div>
              ) : null}

              <PdfLogoMark className="absolute right-[72px] bottom-[72px] h-5 w-5 opacity-30" />
            </section>
          )
        }),
      [slides, totalSlides]
    )

    useImperativeHandle(ref, () => ({
      async generatePdf() {
        const container = containerRef.current

        if (!container) {
          throw new Error('PDF generator is not ready yet')
        }

        const slideNodes = Array.from(container.querySelectorAll<HTMLElement>('[data-pdf-slide]'))

        if (slideNodes.length === 0) {
          throw new Error('No slides were rendered for PDF export')
        }

        const pdf = new jsPDF({
          format: 'a4',
          orientation: 'portrait',
          unit: 'mm',
        })

        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()

        for (const [index, node] of slideNodes.entries()) {
          const canvas = await html2canvas(node, {
            backgroundColor: null,
            scale: 2,
            useCORS: true,
          })

          const imageData = canvas.toDataURL('image/png')

          if (index > 0) {
            pdf.addPage()
          }

          pdf.addImage(imageData, 'PNG', 0, 0, pageWidth, pageHeight)
        }

        return pdf.output('blob')
      },
    }))

    return (
      <div
        ref={containerRef}
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', top: 0 }}
      >
        {slideTemplates}
      </div>
    )
  }
)
