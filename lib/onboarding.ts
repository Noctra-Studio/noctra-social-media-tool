import {
  languageLevelOptions,
  pillarColorOptions,
  type LanguageLevel,
} from '@/lib/brand-strategy'
import { platforms, type Platform } from '@/lib/product'
import type { WorkspaceAssistanceLevel, WorkspaceConfig } from '@/types/workspace'

export type OnboardingMainGoal =
  | 'lead_generation'
  | 'thought_leadership'
  | 'community'
  | 'brand_awareness'
  | 'sales'
  | 'mixed'

export type OnboardingHashtagStyle = 'minimal' | 'curated' | 'aggressive'
export type OnboardingTextLength = 'short' | 'medium' | 'long' | 'varies'

export type OnboardingPillar = {
  color: string
  description: string
  name: string
}

export type PlatformAudienceDraft = {
  audience_description: string
  desired_outcomes: string[]
  language_level: LanguageLevel
  pain_points: string[]
}

export type OnboardingState = {
  always_include_cta: boolean
  assistance_level: WorkspaceAssistanceLevel
  audiences: Record<Platform, PlatformAudienceDraft>
  brand_description: string
  brand_name: string
  brand_values: string[]
  cta_style: string
  forbidden_words: string[]
  hashtag_style: OnboardingHashtagStyle
  industry: string
  logo_storage_path: string | null
  logo_url: string | null
  main_goal: OnboardingMainGoal | null
  onboarding_completed: boolean
  pillars: OnboardingPillar[]
  posting_frequency: Record<Platform, number>
  preferred_emojis: boolean
  reference_posts: string[]
  target_audience: string
  text_length_pref: OnboardingTextLength
  tone_of_voice: string
  use_hashtags: boolean
}

export const onboardingStepLabels = [
  'Marca',
  'Logo',
  'Voz',
  'Estrategia',
  'Asistencia',
  'Plataformas',
] as const

export const toneOfVoiceOptions = [
  'Profesional',
  'Casual y cercano',
  'Inspiracional',
  'Educativo',
  'Audaz y directo',
  'Empático',
  'Con humor',
] as const

export const mainGoalOptions: Array<{
  description: string
  icon: string
  label: string
  value: OnboardingMainGoal
}> = [
  {
    description: 'Priorizar contenido que abra conversaciones y pida acción.',
    icon: '🎯',
    label: 'Generar leads y consultas',
    value: 'lead_generation',
  },
  {
    description: 'Construir reputación y criterio visible en tu industria.',
    icon: '🏆',
    label: 'Construir autoridad en mi industria',
    value: 'thought_leadership',
  },
  {
    description: 'Fortalecer conexión, afinidad y diálogo con tu audiencia.',
    icon: '👥',
    label: 'Construir comunidad',
    value: 'community',
  },
  {
    description: 'Aumentar reconocimiento y consistencia de marca.',
    icon: '📢',
    label: 'Visibilidad y reconocimiento de marca',
    value: 'brand_awareness',
  },
  {
    description: 'Orientar la creación hacia conversiones y ventas.',
    icon: '💰',
    label: 'Ventas directas',
    value: 'sales',
  },
  {
    description: 'Balancear awareness, comunidad, autoridad y ventas.',
    icon: '⚡',
    label: 'Mezcla de todo lo anterior',
    value: 'mixed',
  },
]

export const assistanceOptions: Array<{
  badge?: string
  description: string
  icon: string
  label: string
  value: WorkspaceAssistanceLevel
}> = [
  {
    description: 'La IA sugiere temas e ideas. Tú escribes el post.',
    icon: '💡',
    label: 'Ideas solamente',
    value: 'minimal',
  },
  {
    badge: 'Recomendado',
    description: 'La IA genera posts completos. Tú revisas y ajustas antes de publicar.',
    icon: '✏️',
    label: 'Borradores listos para editar',
    value: 'balanced',
  },
  {
    description: 'La IA genera, sugiere imágenes y programa. Tú apruebas con un clic.',
    icon: '🚀',
    label: 'Contenido casi autónomo',
    value: 'full',
  },
]

export const hashtagStyleOptions: Array<{
  description: string
  label: string
  value: OnboardingHashtagStyle
}> = [
  {
    description: '1-3 hashtags bien elegidos.',
    label: 'Mínimos (1-3)',
    value: 'minimal',
  },
  {
    description: '5-8 hashtags curados según el post.',
    label: 'Seleccionados (5-8)',
    value: 'curated',
  },
  {
    description: '15 o más hashtags para empujar alcance.',
    label: 'Agresivos (15+)',
    value: 'aggressive',
  },
]

export const textLengthOptions: Array<{
  label: string
  value: OnboardingTextLength
}> = [
  { label: 'Corto (menos de 100 palabras)', value: 'short' },
  { label: 'Medio (100-250 palabras)', value: 'medium' },
  { label: 'Largo (250+)', value: 'long' },
  { label: 'Varía según plataforma', value: 'varies' },
]

export const industrySuggestions = [
  'Bienes raíces',
  'Tecnología',
  'Educación',
  'Salud',
  'Interiorismo',
  'Marketing',
  'Servicios profesionales',
  'E-commerce',
]

export const pillarPalette = [...pillarColorOptions]
export const platformAudienceLevels = [...languageLevelOptions]

export function createEmptyAudienceDraft(): PlatformAudienceDraft {
  return {
    audience_description: '',
    desired_outcomes: [],
    language_level: 'mixed',
    pain_points: [],
  }
}

export function createInitialOnboardingState(
  config: WorkspaceConfig | null | undefined
): OnboardingState {
  const postingFrequency = config?.posting_frequency || {}

  return {
    always_include_cta: config?.always_include_cta ?? true,
    assistance_level: config?.assistance_level ?? 'balanced',
    audiences: platforms.reduce<Record<Platform, PlatformAudienceDraft>>((accumulator, platform) => {
      accumulator[platform] = createEmptyAudienceDraft()
      return accumulator
    }, {} as Record<Platform, PlatformAudienceDraft>),
    brand_description: config?.brand_description ?? '',
    brand_name: config?.brand_name ?? '',
    brand_values: config?.brand_values ?? [],
    cta_style: config?.cta_style ?? '',
    forbidden_words: config?.forbidden_words ?? [],
    hashtag_style:
      config?.hashtag_style === 'aggressive' || config?.hashtag_style === 'minimal'
        ? config.hashtag_style
        : 'curated',
    industry: config?.industry ?? '',
    logo_storage_path: config?.logo_storage_path ?? null,
    logo_url: config?.logo_url ?? null,
    main_goal: (config?.main_goal as OnboardingMainGoal | null) ?? null,
    onboarding_completed: config?.onboarding_completed ?? false,
    pillars: [],
    posting_frequency: {
      instagram: postingFrequency.instagram ?? 4,
      linkedin: postingFrequency.linkedin ?? 2,
      x: postingFrequency.x ?? 5,
    },
    preferred_emojis: config?.preferred_emojis ?? true,
    reference_posts:
      config?.reference_posts && config.reference_posts.length > 0
        ? [...config.reference_posts.slice(0, 3), ...Array(Math.max(0, 3 - config.reference_posts.length)).fill('')]
        : ['', '', ''],
    target_audience: config?.target_audience ?? '',
    text_length_pref:
      config?.text_length_pref === 'short' ||
      config?.text_length_pref === 'medium' ||
      config?.text_length_pref === 'long'
        ? config.text_length_pref
        : 'varies',
    tone_of_voice: config?.tone_of_voice ?? '',
    use_hashtags: config?.use_hashtags ?? true,
  }
}

export function buildPillarDraft(index: number): OnboardingPillar {
  return {
    color: pillarPalette[index % pillarPalette.length],
    description: '',
    name: '',
  }
}

export function inferCurrentOnboardingStep(state: OnboardingState) {
  const hasBrandName = Boolean(state.brand_name.trim())
  const hasStepThreeData = Boolean(
    state.tone_of_voice.trim() ||
      state.brand_description.trim() ||
      state.brand_values.length ||
      state.forbidden_words.length ||
      state.reference_posts.some((post) => post.trim())
  )
  const validPillars = state.pillars.filter(
    (pillar) => pillar.name.trim() && pillar.description.trim()
  )
  const hasStepFourData = Boolean(
    state.industry.trim() ||
      state.target_audience.trim() ||
      state.main_goal ||
      validPillars.length >= 2
  )
  const hasAudienceData = Object.values(state.audiences).some(
    (audience) =>
      audience.audience_description.trim() ||
      audience.pain_points.length ||
      audience.desired_outcomes.length
  )

  if (!hasBrandName) {
    return 1
  }

  if (!state.logo_url && !hasStepThreeData && !hasStepFourData) {
    return 2
  }

  if (!state.tone_of_voice.trim() || !state.brand_description.trim()) {
    return 3
  }

  if (
    !state.industry.trim() ||
    !state.target_audience.trim() ||
    !state.main_goal ||
    validPillars.length < 2
  ) {
    return 4
  }

  if (!hasAudienceData && !state.onboarding_completed) {
    return 5
  }

  if (!state.onboarding_completed) {
    return 6
  }

  return 7
}
