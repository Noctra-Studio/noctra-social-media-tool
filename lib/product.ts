export const platforms = ['instagram', 'linkedin', 'x'] as const

export type Platform = (typeof platforms)[number]
export type AssistanceLevel = 'guided' | 'balanced' | 'expert'
export type ComposeMode = 'explore' | 'idea' | 'direct'

export type SuggestionCard = {
  ageLabel: string
  daysSinceLastPost: number | null
  ideaId: string | null
  ideaText: string | null
  platform: Platform
  reason: string
  suggestionType: 'develop_saved_idea' | 'fresh_prompt'
}

export type SuggestedIdea = {
  angle: string
  hook: string
  title: string
  why_now: string
}

export type AngleSuggestion = {
  hook: string
  one_liner: string
  type: string
}

export type GeneratedContent = {
  angle: string
  content: Record<string, unknown>
  export_metadata?: Record<string, unknown> | null
  format?:
    | 'single'
    | 'carousel'
    | 'tweet'
    | 'thread'
    | 'article'
    | 'text'
    | 'image'
    | 'document'
    | null
  platform: Platform
  pillar_id?: string | null
  post_id?: string | null
  raw: string
}

export function formatPlatformLabel(platform: Platform) {
  switch (platform) {
    case 'instagram':
      return 'Instagram'
    case 'linkedin':
      return 'LinkedIn'
    case 'x':
      return 'X'
    default:
      return platform
  }
}

export function getPlatformGuidance(platform: Platform) {
  switch (platform) {
    case 'instagram':
      return {
        bestFor: 'prueba social, procesos y contenido visual con CTA claro',
        title: 'Instagram premia claridad visual y hooks rápidos',
        rules: [
          'Abre con una frase que detenga el scroll.',
          'Mantén el caption directo y fácil de escanear.',
          'Cierra con CTA breve y 5-10 hashtags relevantes.',
        ],
      }
    case 'linkedin':
      return {
        bestFor: 'autoridad, aprendizaje aplicado y perspectiva de negocio',
        title: 'LinkedIn funciona mejor con ideas útiles y postura clara',
        rules: [
          'Construye una opinión o aprendizaje concreto.',
          'Usa párrafos cortos con aire entre ideas.',
          'Cierra conectando el insight con un resultado real.',
        ],
      }
    case 'x':
      return {
        bestFor: 'puntos de vista, observaciones rápidas y mini hilos',
        title: 'X exige síntesis, tensión y ritmo',
        rules: [
          'Empieza con una idea fuerte o incómoda.',
          'Si no cabe en un tweet, conviértelo en hilo.',
          'Evita relleno: cada línea debe aportar algo.',
        ],
      }
    default:
      return {
        bestFor: '',
        title: '',
        rules: [],
      }
  }
}

export function mapIdeaFilterToStatuses(filter: string) {
  switch (filter) {
    case 'drafted':
      return ['draft', 'drafted']
    case 'published':
      return ['published']
    case 'raw':
    default:
      return ['raw']
  }
}

export function getIdeaStatusLabel(status: string | null) {
  switch (status) {
    case 'draft':
    case 'drafted':
      return 'En borrador'
    case 'published':
      return 'Publicada'
    case 'scheduled':
      return 'Programada'
    case 'raw':
    default:
      return 'Sin desarrollar'
  }
}
