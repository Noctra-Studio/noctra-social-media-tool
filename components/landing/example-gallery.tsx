'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Maximize2 } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

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
    <div className="mt-32 px-6 sm:px-8 lg:px-10">
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
        {GALLERY_IMAGES.map((img) => (
          <motion.div
            key={img.src}
            whileHover={{ y: -8 }}
            className="group relative cursor-pointer"
            onClick={() => setSelectedImage(img)}
          >
            <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.02] p-2 transition-all hover:border-white/25">
              {/* Image Wrapper */}
              <div className="relative aspect-[4/5] overflow-hidden rounded-[24px]">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
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
            <div className="mt-4 flex items-center gap-3 px-2">
              <SocialPlatformMark platform={img.platform} className="h-6 w-6 text-xs" />
              <span className="text-sm font-semibold uppercase tracking-widest text-[#4E576A] transition-colors group-hover:text-[#E0E5EB]">
                {img.platform === 'instagram' ? 'Instagram' : img.platform === 'x' ? 'X (Twitter)' : 'LinkedIn'}
              </span>
            </div>
          </motion.div>
        ))}
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
              className="absolute right-6 top-6 z-[110] flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-[#E0E5EB] transition-colors hover:bg-white/20 hover:text-white"
            >
              <X className="h-6 w-6" />
            </motion.button>

            {/* HD Image Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative aspect-auto max-h-full w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 shadow-2xl"
            >
              <Image
                src={selectedImage.src}
                alt={selectedImage.alt}
                width={1920}
                height={1080}
                className="h-auto w-full object-contain"
                priority
              />
              
              {/* HD Indicator Tag */}
              <div className="absolute bottom-6 left-6 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-[#E0E5EB] backdrop-blur-md border border-white/10">
                <Search className="h-4 w-4 text-[#462D6E]" />
                Visualización en HD
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
