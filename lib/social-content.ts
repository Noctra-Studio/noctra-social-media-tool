import type { Platform } from '@/lib/product'
import { normalizeGradientConfig, type CarouselGradientConfig } from '@/lib/carousel-backgrounds'
import type { ImageSource } from '@/lib/post-records'

export type InstagramFormat = 'single' | 'carousel'
export type XFormat = 'tweet' | 'thread' | 'article'
export type LinkedInFormat = 'text' | 'image' | 'carousel' | 'document'
export type PostFormat = InstagramFormat | XFormat | LinkedInFormat

export type InstagramCarouselPost = {
  caption: string
  hashtags: string[]
  slides: InstagramCarouselSlide[]
}

export type InstagramCarouselSlide = {
  body: string
  color_suggestion: string | null
  design_note: string
  headline: string
  slide_number: number
  type: 'cover' | 'content' | 'cta'
  visual_direction: string
  stat_or_example: string | null
  bg_type: 'image' | 'gradient' | 'solid'
  bg_reasoning: string
  unsplash_query: string | null
  gradient_style: 'brand_dark' | 'brand_navy' | 'brand_subtle' | null
  suggested_template: string | null
  text_order?: 'headline-first' | 'body-first'
}

export type XThreadTweet = {
  char_count: number
  content: string
  id?: string
  media_source?: ImageSource | null
  media_url?: string | null
  number: number
}

export type XHookStrength = 'strong' | 'medium' | 'weak'

export type LinkedInCarouselSlide = {
  content?: string
  handle?: string
  headline?: string
  id?: string
  image_source?: ImageSource | null
  image_url?: string | null
  message?: string
  number: number
  stat_or_example?: string | null
  subtitle?: string
  title?: string
  type: 'cover' | 'content' | 'cta'
}

export type SlideBackgroundSelection = {
  slide_number: number
  bg_type: 'image' | 'gradient' | 'solid'
  gradient_config?: CarouselGradientConfig
  image_source?: ImageSource | null
  image_url?: string
  photographer?: string
  gradient_style?: string
  solid_color?: string
  filters?: {
    brightness?: number
    contrast?: number
    saturate?: number
    sepia?: number
    grayscale?: number
  }
}

export type ExportMetadata = {
  hook_strength?: XHookStrength
  include_cover?: boolean
  include_cta?: boolean
  pdf_generated?: boolean
  read_time_minutes?: number
  slide_count?: number
  thread_count?: number
  tweet_count?: number
  word_count?: number
  slide_backgrounds?: SlideBackgroundSelection[]
}

export type SocialFormatOption = {
  description: string
  label: string
  value: PostFormat
}

export const defaultFormats = {
  instagram: 'single',
  linkedin: 'text',
  x: 'tweet',
} as const satisfies Record<Platform, PostFormat>

export const platformFormatOptions: Record<Platform, SocialFormatOption[]> = {
  instagram: [
    {
      value: 'single',
      label: 'Single post',
      description: '1 imagen + caption. Ideal para quotes, fotos, anuncios.',
    },
    {
      value: 'carousel',
      label: 'Carrusel',
      description: '3-10 slides. Ideal para tutoriales, listas, casos de estudio.',
    },
  ],
  x: [
    {
      value: 'tweet',
      label: 'Single post',
      description: '1 idea directa, con margen para editar antes de publicar.',
    },
    {
      value: 'thread',
      label: 'Hilo',
      description: '4-8 tweets con hook inicial y cierre que invite respuesta.',
    },
    {
      value: 'article',
      label: 'Articulo',
      description: 'Post largo con estructura editorial y lectura profunda.',
    },
  ],
  linkedin: [
    {
      value: 'text',
      label: 'Single post',
      description: 'Texto puro para feed, con saltos de linea y lectura limpia.',
    },
    {
      value: 'image',
      label: 'Single post + imagen',
      description: 'Post de texto con direccion visual lista para buscar imagen.',
    },
    {
      value: 'document',
      label: 'Slides',
      description: 'Presentacion de 5-15 paginas pensada para swipe-through en LinkedIn.',
    },
  ],
}

type GeneratedContentShape = Record<string, unknown>

export function getDefaultFormat(platform: Platform) {
  return defaultFormats[platform]
}

export function inferPostFormat(platform: Platform, content: GeneratedContentShape, format?: PostFormat | null) {
  if (format) {
    return format
  }

  if (platform === 'instagram') {
    return Array.isArray(content.slides) ? 'carousel' : 'single'
  }

  if (platform === 'x') {
    if (Array.isArray(content.tweets) || Array.isArray(content.thread)) {
      return 'thread'
    }

    if (typeof content.body === 'string' && typeof content.title === 'string') {
      return 'article'
    }

    return 'tweet'
  }

  if (Array.isArray(content.slides)) {
    return 'document'
  }

  if (typeof content.visual_direction === 'string' && content.visual_direction.trim()) {
    return 'image'
  }

  return 'text'
}

export function getFormatLabel(platform: Platform, format: PostFormat) {
  return (
    platformFormatOptions[platform].find((option) => option.value === format)?.label ??
    format
  )
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function readString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

export function readOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

export function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

export function readInstagramCarouselPost(data: unknown): InstagramCarouselPost {
  const item = data as Record<string, unknown>
  return {
    caption: readString(item.caption),
    hashtags: readStringArray(item.hashtags),
    slides: readInstagramSlides(item.slides),
  }
}

export function readInstagramSlides(value: unknown): InstagramCarouselSlide[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null
      }

      const body = readString(item.body)
      const design_note = readString(item.design_note)
      const headline = readString(item.headline)
      const slide_number = typeof item.slide_number === 'number' ? item.slide_number : NaN
      const type = item.type
      const visual_direction = readString(item.visual_direction)
      const stat_or_example = readOptionalString(item.stat_or_example)
      const bg_type = (readString(item.bg_type) as 'image' | 'gradient' | 'solid') || 'solid'
      const bg_reasoning = readString(item.bg_reasoning)
      const color_suggestion = readOptionalString(item.color_suggestion)
      const unsplash_query = readOptionalString(item.unsplash_query)
      const suggested_template = readOptionalString(item.suggested_template)
      const gradient_style = readOptionalString(item.gradient_style) as
        | 'brand_dark'
        | 'brand_navy'
        | 'brand_subtle'
        | null
      const gradient_config = isRecord(item.gradient_config)
        ? normalizeGradientConfig(item.gradient_config as Partial<CarouselGradientConfig>)
        : undefined

      if (
        !body ||
        !design_note ||
        !headline ||
        !Number.isFinite(slide_number) ||
        (type !== 'cover' && type !== 'content' && type !== 'cta') ||
        !visual_direction
      ) {
        return null
      }

      const slideType = type as InstagramCarouselSlide['type']

      return {
        body,
        design_note,
        headline,
        slide_number,
        type: slideType,
        visual_direction,
        stat_or_example,
        bg_type,
        bg_reasoning,
        color_suggestion,
        unsplash_query,
        suggested_template,
        gradient_style: gradient_config ? null : gradient_style,
      }
    })
    .filter((item): item is InstagramCarouselSlide => item !== null)
}

export function readXThreadTweets(value: unknown): XThreadTweet[] {
  if (!Array.isArray(value)) {
    return []
  }

  const tweets: XThreadTweet[] = []

  value.forEach((item, index) => {
    if (typeof item === 'string') {
      tweets.push({
        char_count: item.length,
        content: item,
        number: index + 1,
      })
      return
    }

    if (!isRecord(item)) {
      return
    }

    const char_count = typeof item.char_count === 'number' ? item.char_count : readString(item.content).length
    const content = readString(item.content)
    const id = readOptionalString(item.id) ?? undefined
    const media_source: ImageSource | null =
      item.media_source === 'unsplash' || item.media_source === 'pexels' || item.media_source === 'upload'
        ? item.media_source
        : null
    const media_url = readOptionalString(item.media_url)
    const number = typeof item.number === 'number' ? item.number : index + 1

    if (!content) {
      return
    }

    tweets.push({
      char_count,
      content,
      id,
      media_source,
      media_url,
      number,
    })
  })

  return tweets
}

export function readLinkedInSlides(value: unknown): LinkedInCarouselSlide[] {
  if (!Array.isArray(value)) {
    return []
  }

  const slides: LinkedInCarouselSlide[] = []

  value.forEach((item) => {
    if (!isRecord(item)) {
      return
    }

    const number = typeof item.number === 'number' ? item.number : NaN
    const type = item.type

    if (!Number.isFinite(number) || (type !== 'cover' && type !== 'content' && type !== 'cta')) {
      return
    }

    slides.push({
      content: readOptionalString(item.content) ?? undefined,
      handle: readOptionalString(item.handle) ?? undefined,
      headline: readOptionalString(item.headline) ?? undefined,
      id: readOptionalString(item.id) ?? undefined,
      image_source:
        item.image_source === 'unsplash' || item.image_source === 'pexels' || item.image_source === 'upload'
          ? item.image_source
          : null,
      image_url: readOptionalString(item.image_url) ?? undefined,
      message: readOptionalString(item.message) ?? undefined,
      number,
      stat_or_example: readOptionalString(item.stat_or_example),
      subtitle: readOptionalString(item.subtitle) ?? undefined,
      title: readOptionalString(item.title) ?? undefined,
      type,
    })
  })

  return slides
}

export function joinHashtags(hashtags: string[]) {
  return hashtags.join(' ')
}

export function ensureHashtags(hashtags: string[]) {
  return hashtags.map((tag) => (tag.startsWith('#') ? tag : `#${tag.replace(/^#+/, '')}`))
}

export function estimateReadTime(text: string, wordsPerMinute = 220) {
  const wordCount = text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

  if (wordCount === 0) {
    return 1
  }

  return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
}

export function formatExportDate(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

export function getCopyText(platform: Platform, format: PostFormat, content: GeneratedContentShape) {
  const hashtags = ensureHashtags(readStringArray(content.hashtags))
  const caption = readString(content.caption)

  if (platform === 'instagram') {
    if (format === 'carousel') {
      return [caption, joinHashtags(hashtags)].filter(Boolean).join('\n\n')
    }

    return [caption, joinHashtags(hashtags)].filter(Boolean).join('\n\n')
  }

  if (platform === 'x') {
    if (format === 'article') {
      const title = readString(content.title)
      const subtitle = readString(content.subtitle)
      const body = readString(content.body)

      return [title, subtitle, body].filter(Boolean).join('\n\n')
    }

    if (format === 'thread') {
      const tweets = readXThreadTweets(content.tweets ?? content.thread)
      return tweets.map((tweet) => tweet.content).join('\n\n')
    }

    return readString(content.tweet) || readString(content.caption)
  }

  if (format === 'document' || format === 'carousel') {
    const postCaption = readString(content.post_caption)
    return [postCaption, joinHashtags(hashtags)].filter(Boolean).join('\n\n')
  }

  return [caption, joinHashtags(hashtags)].filter(Boolean).join('\n\n')
}

export function getCaptionText(platform: Platform, format: PostFormat, content: GeneratedContentShape) {
  if (platform === 'x') {
    if (format === 'article') {
      return [readString(content.title), readString(content.subtitle), readString(content.body)]
        .filter(Boolean)
        .join('\n\n')
    }

    if (format === 'thread') {
      return readXThreadTweets(content.tweets ?? content.thread)
        .map((tweet) => tweet.content)
        .join('\n\n')
    }

    return readString(content.tweet) || readString(content.caption)
  }

  if (platform === 'linkedin' && (format === 'document' || format === 'carousel')) {
    return readString(content.post_caption)
  }

  return readString(content.caption)
}

export function getPreviewText(platform: Platform, format: PostFormat, content: GeneratedContentShape, maxLength = 100) {
  const raw = getCaptionText(platform, format, content).trim()

  if (!raw) {
    return 'Sin preview disponible.'
  }

  return raw.length > maxLength ? `${raw.slice(0, maxLength).trim()}...` : raw
}

export function getExportActionLabel(platform: Platform) {
  return platform === 'x' ? 'Exportar TXT' : 'Exportar ZIP'
}

export function toVisualSearchHref(query: string) {
  return `/visual?keywords=${encodeURIComponent(query)}`
}

export function plainTextFromMarkdown(markdown: string) {
  return markdown.replace(/\*\*(.*?)\*\*/g, '$1')
}

export function getXTweetColor(charCount: number) {
  if (charCount >= 270) {
    return '#ef4444'
  }

  if (charCount >= 240) {
    return '#fcd34d'
  }

  return '#4E576A'
}

export type BriefQuery = {
  query: string
  rationale: string
  priority: 1 | 2 | 3
}

export type VisualBrief = {
  queries: BriefQuery[]
  visual_brief: {
    mood: string
    composition: string
    color_palette: string
    subject_matter: string
    lighting: string
    avoid: string[]
  }
  mood_category_id: string
  ideal_image_description: string
  why_it_works: string
  per_slide_notes?: string
}

export type ScoredImage = {
  unsplashId: string
  url: string
  thumbUrl: string
  photographer: string
  scores: {
    total: number
    mood: number
    composition: number
    color: number
    subject: number
  }
  verdict: string
  best_for: 'cover' | 'content' | 'cta' | 'any'
  query_source: string
}

export type EfficacyReport = {
  efficacy_score: number
  grade: 'A+' | 'A' | 'B' | 'C' | 'D'
  verdict: string
  strengths: string[]
  risks: string[]
  optimization_tips: Array<{
    tip: string
    type: 'text' | 'overlay' | 'crop' | 'color' | 'placement'
  }>
  alternative_suggestion: {
    should_reconsider: boolean
    reason: string | null
    better_query: string | null
  }
}
