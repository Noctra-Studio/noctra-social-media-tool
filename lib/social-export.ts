import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type { Platform } from '@/lib/product'
import {
  ensureHashtags,
  formatExportDate,
  joinHashtags,
  plainTextFromMarkdown,
  readInstagramSlides,
  readLinkedInSlides,
  readString,
  readStringArray,
  readXThreadTweets,
  type SlideBackgroundSelection,
  type PostFormat,
} from '@/lib/social-content'
import type { CarouselEditorSlide } from '@/lib/instagram-carousel-editor'
import {
  getLogoVariantForResolvedBackground,
  gradientConfigToCss,
  resolveSlideBackground,
} from '@/lib/carousel-backgrounds'

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function exportInstagramPackage(args: {
  content: Record<string, unknown>
  exportMetadata?: Record<string, unknown> | null
  format: PostFormat
  imageMetadata?: {
    url: string
    photographer: string
    overlay: any
  } | null
  blobs?: Blob[] | null
}) {
  const { content, exportMetadata, format } = args
  const zip = new JSZip()
  const date = formatExportDate()
  const root = zip.folder(`instagram-export-${date}`)

  if (!root) {
    throw new Error('No fue posible preparar el ZIP de Instagram')
  }

  // Removed caption and guide files for a clean image-only UHD export
  
  if (format === 'carousel') {
    const slides = readInstagramSlides(content.slides)

    slides.forEach((slide, i) => {
      const indexLabel = String(slide.slide_number).padStart(2, '0')
      const bgSelections = exportMetadata?.slide_backgrounds as SlideBackgroundSelection[] | undefined
      const editedSlides = exportMetadata?.edited_carousel_slides as CarouselEditorSlide[] | undefined
      const editedSlide = editedSlides?.find((item) => item.originalData.slide_number === slide.slide_number)
      
      const blob = args.blobs?.[i]
      if (blob) {
        zip.file(`slide-${indexLabel}-${slide.type}.png`, blob)
      } else if (editedSlide?.previewDataURL) {
        const pngBase64 = editedSlide.previewDataURL.split(',')[1]
        if (pngBase64) {
          zip.file(`slide-${indexLabel}-${slide.type}.png`, pngBase64, { base64: true })
        }
      }
    })
  } else {
    // Single image format - handled by handleExport passing blobs
    if (args.blobs?.[0]) {
      zip.file(`post-instagram.png`, args.blobs[0])
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, `instagram-export-${date}.zip`)
}

export async function exportLinkedInPackage(args: {
  content: Record<string, unknown>
  format: PostFormat
  pdfBlob?: Blob | null
  blobs?: Blob[] | null
  imageMetadata?: {
    url: string
    photographer: string
    overlay: any
  } | null
}) {
  const { content, format, pdfBlob, blobs } = args
  const zip = new JSZip()
  const date = formatExportDate()

  if (format === 'document' || format === 'carousel') {
    zip.file(
      'post-caption.txt',
      [
        readString(content.post_caption),
        '',
        joinHashtags(ensureHashtags(readStringArray(content.hashtags))),
      ].filter(Boolean).join('\n')
    )

    if (pdfBlob) {
      zip.file('carousel.pdf', pdfBlob)
    }
  } else {
    // Single post (text or image)
    zip.file(
      'post-content.txt',
      [
        readString(content.caption),
        '',
        joinHashtags(ensureHashtags(readStringArray(content.hashtags))),
      ].filter(Boolean).join('\n')
    )

    if (blobs?.[0]) {
      zip.file('post-linkedin.png', blobs[0])
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, `linkedin-export-${date}.zip`)
}

export async function exportXPackage(args: {
  content: Record<string, unknown>
  format: PostFormat
  idea: string
  blobs?: Blob[] | null
  imageMetadata?: {
    url: string
    photographer: string
    overlay: any
  } | null
}) {
  const { content, format, idea, blobs } = args
  const date = formatExportDate()
  const zip = new JSZip()

  let textContent = ''
  let filename = `x-post-${date}.txt`

  if (format === 'article') {
    textContent = [
      `TITULO: ${readString(content.title)}`,
      `SUBTITULO: ${readString(content.subtitle)}`,
      '',
      plainTextFromMarkdown(readString(content.body)),
    ].join('\n')
    filename = `x-article-${date}.txt`
  } else if (format === 'thread') {
    const tweets = readXThreadTweets(content.tweets ?? content.thread)
    const total = tweets.length
    textContent = tweets.map((tweet) => `[${tweet.number}/${total}]\n${tweet.content}`).join('\n\n')
    filename = `x-thread-${date}.txt`
  } else {
    textContent = readString(content.tweet)
    filename = `x-tweet-${date}.txt`
  }

  // If we have an image, we MUST export as ZIP to bundle text + image
  if (blobs?.[0]) {
    zip.file(filename, textContent)
    zip.file('post-x.png', blobs[0])
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    saveAs(zipBlob, `x-export-${date}.zip`)
  } else {
    // Fallback to direct text download if no image
    downloadTextFile(filename, textContent)
  }
}

export function supportsZipExport(platform: Platform) {
  return platform === 'instagram' || platform === 'linkedin'
}

export function getLinkedInSlideCount(content: Record<string, unknown>) {
  return readLinkedInSlides(content.slides).length
}
