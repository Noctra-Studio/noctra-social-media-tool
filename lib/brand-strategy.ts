import type { Platform } from '@/lib/product'

export const pillarColorOptions = ['#101417', '#212631', '#462D6E', '#4E576A'] as const

export const languageLevelOptions = ['non-technical', 'mixed', 'technical'] as const

export type PillarColor = (typeof pillarColorOptions)[number]
export type LanguageLevel = (typeof languageLevelOptions)[number]

export type BrandPillar = {
  color: string | null
  description: string | null
  id: string
  name: string
  post_count: number | null
  sort_order: number | null
}

export type PlatformAudience = {
  audience_description: string | null
  desired_outcomes: string[] | null
  id: string
  language_level: LanguageLevel | null
  pain_points: string[] | null
  platform: Platform
  updated_at: string | null
}

export type StrategyResponse = {
  audiences: PlatformAudience[]
  pillars: BrandPillar[]
}

export function sanitizeStrategyText(value: string | null | undefined) {
  return value?.trim() || ''
}

export function sanitizeStringArray(value: string[] | null | undefined) {
  return (value || []).map((item) => item.trim()).filter(Boolean)
}

export function normalizePillarColor(value: string | null | undefined) {
  const candidate = value?.trim().toUpperCase()

  if (!candidate) {
    return pillarColorOptions[0]
  }

  return pillarColorOptions.find((option) => option.toUpperCase() === candidate) || pillarColorOptions[0]
}

export function getLanguageLevelLabel(level: LanguageLevel | null | undefined) {
  switch (level) {
    case 'technical':
      return 'Técnico'
    case 'non-technical':
      return 'No técnico'
    case 'mixed':
    default:
      return 'Mixto'
  }
}

export function getAudiencePrompt(audience: PlatformAudience | null, platform: Platform) {
  if (!audience) {
    return `AUDIENCIA EN ${platform.toUpperCase()}:
Quiénes son: no definida todavía
Problemas que tienen: none
Lo que buscan lograr: none
Nivel técnico: mixed`
  }

  return `AUDIENCIA EN ${platform.toUpperCase()}:
Quiénes son: ${sanitizeStrategyText(audience.audience_description) || 'no definida todavía'}
Problemas que tienen: ${sanitizeStringArray(audience.pain_points).join(', ') || 'none'}
Lo que buscan lograr: ${sanitizeStringArray(audience.desired_outcomes).join(', ') || 'none'}
Nivel técnico: ${audience.language_level || 'mixed'}`
}

export function getPillarPrompt(pillar: BrandPillar | null) {
  if (!pillar) {
    return 'PILAR DE CONTENIDO ACTIVO: Sin pilar asignado'
  }

  return `PILAR DE CONTENIDO ACTIVO: ${pillar.name}
Descripción del pilar: ${sanitizeStrategyText(pillar.description) || 'Sin descripción'}`
}
