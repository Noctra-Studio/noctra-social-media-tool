'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Maximize2 } from 'lucide-react'
import Image from 'next/image'

import { landingContent, type LandingLocale } from '@/components/landing/content'

import { SocialPlatformMark } from '@/components/ui/SocialPlatformMark'
import type { Platform } from '@/lib/product'

type GalleryImage = {
  src: string
  alt: string
  label: string
  platform: Platform
}

const GALLERY_IMAGES: GalleryImage[] = [
  {
    src: '/images/instagram-example.png',
    alt: 'Instagram UHD Carousel Example',
    label: 'Instagram UHD',
    platform: 'instagram',
  },
  {
    src: '/images/x-example.png',
    alt: 'X Thread and Visual Post Example',
    label: '𝕏 Thread',
    platform: 'x',
  },
  {
    src: '/images/linkedin-example.png',
    alt: 'LinkedIn PDF Document Example',
    label: 'LinkedIn PDF',
    platform: 'linkedin',
  },
]

function getPlatformName(platform: Platform) {
  if (platform === 'instagram') return 'Instagram'
  if (platform === 'x') return 'X (Twitter)'
  return 'LinkedIn'
}

export function ExampleGallery({ locale }: { locale: LandingLocale }) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const { gallery } = landingContent.exampleOutputs

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedImage(null)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  return (
    <div className="mt-24 px-6 sm:mt-32 sm:px-8 lg:px-10">
      {/* Gallery Heading */}
      <div className="mb-16">
        <h3 
          className="text-3xl font-medium text-[#E0E5EB] lg:text-4xl"
          style={{ fontFamily: 'var(--font-brand-display)' }}
        >
          {gallery.heading[locale]}
        </h3>
        <p className="mt-4 max-w-2xl text-lg text-[#8D95A6]">
          {gallery.subheading[locale]}
        </p>
      </div>

      <div className="-mx-6 overflow-x-auto pb-4 sm:mx-0 sm:overflow-visible sm:pb-0">
        <div className="flex snap-x snap-mandatory gap-4 px-6 sm:grid sm:grid-cols-1 sm:gap-6 sm:px-0 md:grid-cols-3 md:gap-8">
        {GALLERY_IMAGES.map((img) => (
          <motion.div
            key={img.src}
            whileHover={{ y: -8 }}
            className="group relative w-[88vw] max-w-[30rem] shrink-0 snap-center cursor-pointer sm:w-auto sm:max-w-none sm:snap-none"
            onClick={() => setSelectedImage(img)}
          >
            <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-3 transition-all hover:border-white/25 sm:p-2">
              {/* Image Wrapper */}
              <div className="relative aspect-[16/10] overflow-hidden rounded-[24px] border border-white/6 bg-[#0C1015]">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 639px) 88vw, (max-width: 1023px) 50vw, 33vw"
                  className="object-contain p-3 transition-transform duration-700 group-hover:scale-[1.03] sm:p-4"
                />
                
                {/* Overlay on Hover */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
                    <Maximize2 className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Label below the card */}
            <div className="mt-4 flex items-start justify-between gap-3 px-1.5">
              <div className="flex items-center gap-3">
                <SocialPlatformMark platform={img.platform} className="h-6 w-6 text-xs" />
                <div>
                  <span className="block text-sm font-semibold uppercase tracking-widest text-[#4E576A] transition-colors group-hover:text-[#E0E5EB]">
                    {getPlatformName(img.platform)}
                  </span>
                  <span className="mt-1 block text-xs text-[#8D95A6]">
                    {locale === 'es' ? 'Desliza o toca para ampliar' : 'Swipe or tap to expand'}
                  </span>
                </div>
              </div>

              <div className="hidden rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#8D95A6] sm:block">
                {img.label}
              </div>
            </div>
          </motion.div>
        ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />

            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setSelectedImage(null)}
              className="absolute right-4 top-4 z-[110] flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-[#E0E5EB] transition-colors hover:bg-white/20 hover:text-white sm:right-6 sm:top-6 sm:h-12 sm:w-12"
            >
              <X className="h-6 w-6" />
            </motion.button>

            {/* HD Image Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0C1015] shadow-2xl sm:rounded-[32px]"
            >
              <div className="relative flex max-h-[82vh] min-h-[220px] items-center justify-center p-3 sm:p-5">
                <Image
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  width={1920}
                  height={1080}
                  className="max-h-[75vh] h-auto w-full object-contain"
                  priority
                />
              </div>
              
              {/* HD Indicator Tag */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-[11px] font-semibold text-[#E0E5EB] backdrop-blur-md sm:bottom-6 sm:left-6 sm:px-4 sm:text-xs">
                <Search className="h-4 w-4 text-[#462D6E]" />
                <span>
                  {locale === 'es' ? 'Visualizacion ampliada' : 'Expanded preview'}
                </span>
              </div>

              <div className="absolute bottom-4 right-4 rounded-full border border-white/10 bg-[#101417]/90 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8D95A6] sm:bottom-6 sm:right-6">
                {getPlatformName(selectedImage.platform)}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
