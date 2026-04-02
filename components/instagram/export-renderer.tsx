"use client"

import { forwardRef, useImperativeHandle, useRef } from "react"
import { SlideCanvas, type SlideBackgroundState } from "./carousel-preview"
import { renderSlidesBatch } from "@/lib/export/render-post"
import type { InstagramCarouselSlide } from "@/lib/social-content"

interface ExportRendererProps {
  slides: InstagramCarouselSlide[]
  backgrounds: SlideBackgroundState[]
}

export interface ExportRendererHandle {
  renderAll: () => Promise<Blob[]>
}

export const ExportRenderer = forwardRef<ExportRendererHandle, ExportRendererProps>(
  ({ slides, backgrounds }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)

    useImperativeHandle(ref, () => ({
      renderAll: async () => {
        if (!containerRef.current) return []
        
        // Wait a bit for images to load if any
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const slideElements = Array.from(
          containerRef.current.querySelectorAll("[data-export-slide]")
        ) as HTMLElement[]
        
        return renderSlidesBatch(slideElements)
      }
    }))

    return (
      <div 
        className="fixed opacity-0 pointer-events-none" 
        style={{ top: '-10000px', left: '-10000px', width: '20000px' }}
      >
        <div ref={containerRef} className="flex flex-col">
          {slides.map((slide, i) => (
            <div 
              key={i} 
              data-export-slide={i}
              className="w-[1080px] h-[1080px] overflow-hidden"
              style={{ position: 'relative' }}
            >
              <SlideCanvas 
                slide={slide} 
                background={backgrounds[i]} 
                totalSlides={slides.length}
                isPreview={false}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }
)

ExportRenderer.displayName = "ExportRenderer"
