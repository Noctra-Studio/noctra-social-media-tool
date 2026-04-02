import type { Platform } from '@/lib/product'
import {
  inferPostFormat,
  isRecord,
  readInstagramSlides,
  readLinkedInSlides,
  readOptionalString,
  readString,
  readXThreadTweets,
  type ExportMetadata,
  type PostFormat,
} from '@/lib/social-content'

export type SupportedPostType =
  | 'single_post'
  | 'carousel'
  | 'thread'
  | 'article'
  | 'slides'

export type ImageSource = 'unsplash' | 'pexels' | 'upload'

export type StoredThreadItem = {
  id: string
  media_source?: ImageSource | null
  media_url?: string | null
  text: string
}

export type StoredArticleData = {
  body_markdown: string
  cover_image?: string | null
  cover_image_source?: ImageSource | null
  subtitle: string
  title: string
}

export type StoredCarouselSlide = {
  caption?: string | null
  id: string
  image_source?: ImageSource | null
  image_url?: string | null
}

export type StoredSlidesData = {
  body: string
  id: string
  image_source?: ImageSource | null
  image_url?: string | null
  title: string
}

export type StructuredPostFields = {
  article_data: StoredArticleData | null
  carousel_slides: StoredCarouselSlide[] | null
  image_url: string | null
  post_type: SupportedPostType
  slides_data: StoredSlidesData[] | null
  thread_items: StoredThreadItem[] | null
}

type PostMutationPayload = StructuredPostFields & Record<string, unknown>

export type StructuredPostRecordInput = {
  content: Record<string, unknown>
  export_metadata?: ExportMetadata | Record<string, unknown> | null
  format?: PostFormat | null
  platform: Platform
}

function isImageSource(value: unknown): value is ImageSource {
  return value === 'unsplash' || value === 'pexels' || value === 'upload'
}

function readImageSource(value: unknown): ImageSource | null {
  return isImageSource(value) ? value : null
}

export function resolveExternalImageSource(id: string | null | undefined): ImageSource {
  return id?.startsWith('pexels_') ? 'pexels' : 'unsplash'
}

export function getSupportedPostType(
  platform: Platform,
  content: Record<string, unknown>,
  format?: PostFormat | null
): SupportedPostType {
  const inferredFormat = inferPostFormat(platform, content, format)

  if (platform === 'instagram') {
    return inferredFormat === 'carousel' ? 'carousel' : 'single_post'
  }

  if (platform === 'x') {
    if (inferredFormat === 'thread') {
      return 'thread'
    }

    if (inferredFormat === 'article') {
      return 'article'
    }

    return 'single_post'
  }

  return inferredFormat === 'document' || inferredFormat === 'carousel'
    ? 'slides'
    : 'single_post'
}

function buildThreadItems(content: Record<string, unknown>) {
  const tweets = readXThreadTweets(content.tweets ?? content.thread)

  return tweets.map((tweet, index) => ({
    id: tweet.id ?? `tweet-${tweet.number || index + 1}`,
    media_source: readImageSource(tweet.media_source),
    media_url: readOptionalString(tweet.media_url),
    text: tweet.content,
  }))
}

function buildArticleData(content: Record<string, unknown>): StoredArticleData {
  return {
    body_markdown: readString(content.body),
    cover_image: readOptionalString(content.cover_image),
    cover_image_source: readImageSource(content.cover_image_source),
    subtitle: readString(content.subtitle),
    title: readString(content.title),
  }
}

function buildCarouselSlides(
  content: Record<string, unknown>,
  exportMetadata?: ExportMetadata | Record<string, unknown> | null
) {
  const slides = readInstagramSlides(content.slides)
  const backgrounds = Array.isArray((exportMetadata as ExportMetadata | undefined)?.slide_backgrounds)
    ? ((exportMetadata as ExportMetadata).slide_backgrounds ?? [])
    : []
  const backgroundBySlide = new Map(
    backgrounds.map((background) => [background.slide_number, background])
  )

  return slides.map((slide, index) => {
    const background = backgroundBySlide.get(slide.slide_number)
    const backgroundRecord = isRecord(background)
      ? (background as Record<string, unknown>)
      : {}

    return {
      caption: readOptionalString(slide.headline) ?? readOptionalString(slide.body),
      id: `slide-${slide.slide_number || index + 1}`,
      image_source: readImageSource(backgroundRecord.image_source),
      image_url: readOptionalString(background?.image_url),
    }
  })
}

function buildSlidesData(content: Record<string, unknown>) {
  const slides = readLinkedInSlides(content.slides)

  return slides.map((slide, index) => ({
    body: slide.content ?? slide.message ?? slide.subtitle ?? '',
    id: slide.id ?? `slide-${slide.number || index + 1}`,
    image_source: readImageSource(slide.image_source),
    image_url: readOptionalString(slide.image_url),
    title:
      slide.title ??
      slide.headline ??
      (Number.isFinite(slide.number) ? `Slide ${slide.number}` : `Slide ${index + 1}`),
  }))
}

export function buildStructuredPostFields(record: StructuredPostRecordInput): StructuredPostFields {
  const postType = getSupportedPostType(record.platform, record.content, record.format)

  if (postType === 'thread') {
    const threadItems = buildThreadItems(record.content)

    return {
      article_data: null,
      carousel_slides: null,
      image_url: threadItems.find((item) => item.media_url)?.media_url ?? null,
      post_type: postType,
      slides_data: null,
      thread_items: threadItems,
    }
  }

  if (postType === 'article') {
    const articleData = buildArticleData(record.content)

    return {
      article_data: articleData,
      carousel_slides: null,
      image_url: articleData.cover_image ?? null,
      post_type: postType,
      slides_data: null,
      thread_items: null,
    }
  }

  if (postType === 'carousel') {
    const carouselSlides = buildCarouselSlides(record.content, record.export_metadata)

    return {
      article_data: null,
      carousel_slides: carouselSlides,
      image_url: carouselSlides.find((slide) => slide.image_url)?.image_url ?? null,
      post_type: postType,
      slides_data: null,
      thread_items: null,
    }
  }

  if (postType === 'slides') {
    const slidesData = buildSlidesData(record.content)

    return {
      article_data: null,
      carousel_slides: null,
      image_url: slidesData.find((slide) => slide.image_url)?.image_url ?? null,
      post_type: postType,
      slides_data: slidesData,
      thread_items: null,
    }
  }

  return {
    article_data: null,
    carousel_slides: null,
    image_url: readOptionalString(record.content.image_url) ?? null,
    post_type: postType,
    slides_data: null,
    thread_items: null,
  }
}

export function omitStructuredPostFields<T extends PostMutationPayload>(payload: T) {
  const {
    article_data,
    carousel_slides,
    post_type,
    slides_data,
    thread_items,
    ...legacyPayload
  } = payload

  return legacyPayload
}

export function isMissingStructuredPostColumnError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }

  return 'code' in error && (error as { code?: string }).code === '42703'
}
