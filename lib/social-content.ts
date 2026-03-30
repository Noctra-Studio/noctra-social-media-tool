import type { Platform } from '@/lib/product'

export type InstagramFormat = 'single' | 'carousel'
export type XFormat = 'tweet' | 'thread' | 'article'
export type LinkedInFormat = 'text' | 'image' | 'carousel' | 'document'
export type PostFormat = InstagramFormat | XFormat | LinkedInFormat

export type InstagramAudioSuggestion = {
  mood: string
  search_query: string
  style: string
  why: string
}

export type InstagramCarouselSlide = {
  body: string
  design_note: string
  headline: string
  slide_number: number
  type: 'cover' | 'content' | 'cta'
  visual_direction: string
}

export type XThreadTweet = {
  char_count: number
  content: string
  number: number
}

export type XHookStrength = 'strong' | 'medium' | 'weak'

export type LinkedInCarouselSlide = {
  content?: string
  handle?: string
  headline?: string
  message?: string
  number: number
  stat_or_example?: string | null
  subtitle?: string
  title?: string
  type: 'cover' | 'content' | 'cta'
}

export type ExportMetadata = {
  audio_suggestions?: InstagramAudioSuggestion[]
  hook_strength?: XHookStrength
  include_cover?: boolean
  include_cta?: boolean
  pdf_generated?: boolean
  read_time_minutes?: number
  slide_count?: number
  thread_count?: number
  tweet_count?: number
  word_count?: number
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
      label: 'Publicacion unica',
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
      label: 'Tweet unico',
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
      label: 'Solo texto',
      description: 'Texto puro para feed, con saltos de linea y lectura limpia.',
    },
    {
      value: 'image',
      label: 'Imagen + texto',
      description: 'Post de texto con direccion visual lista para buscar imagen.',
    },
    {
      value: 'document',
      label: 'Carrusel / Documento',
      description: 'PDF de 5-15 paginas pensado para swipe-through en LinkedIn.',
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

export function readInstagramAudioSuggestions(value: unknown): InstagramAudioSuggestion[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null
      }

      const style = readString(item.style)
      const mood = readString(item.mood)
      const search_query = readString(item.search_query)
      const why = readString(item.why)

      if (!style || !mood || !search_query || !why) {
        return null
      }

      return { mood, search_query, style, why }
    })
    .filter((item): item is InstagramAudioSuggestion => item !== null)
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

      return {
        body,
        design_note,
        headline,
        slide_number,
        type,
        visual_direction,
      }
    })
    .filter((item): item is InstagramCarouselSlide => item !== null)
}

export function readXThreadTweets(value: unknown): XThreadTweet[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item, index) => {
      if (typeof item === 'string') {
        return {
          char_count: item.length,
          content: item,
          number: index + 1,
        }
      }

      if (!isRecord(item)) {
        return null
      }

      const char_count = typeof item.char_count === 'number' ? item.char_count : readString(item.content).length
      const content = readString(item.content)
      const number = typeof item.number === 'number' ? item.number : index + 1

      if (!content) {
        return null
      }

      return {
        char_count,
        content,
        number,
      }
    })
    .filter((item): item is XThreadTweet => item !== null)
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
