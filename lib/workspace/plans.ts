export type WorkspacePlanCode =
  | 'free'
  | 'starter'
  | 'pro'
  | 'agency'
  | 'enterprise'
  | (string & {})

export type WorkspacePlanTier = 'founder' | 'studio' | 'agency' | 'enterprise'
export type WorkspacePlanLocale = 'es' | 'en'

type PlanMetadata = {
  badge: Record<WorkspacePlanLocale, string>
  description: Record<WorkspacePlanLocale, string>
  maxBrands: number | null
}

const PLAN_METADATA: Record<WorkspacePlanTier, PlanMetadata> = {
  agency: {
    badge: { en: 'Agency', es: 'Agencia' },
    description: {
      en: 'Designed for agencies operating multiple brands.',
      es: 'Pensado para agencias que operan varias marcas.',
    },
    maxBrands: 10,
  },
  enterprise: {
    badge: { en: 'Enterprise', es: 'Enterprise' },
    description: {
      en: 'Custom capacity and operations for larger teams.',
      es: 'Capacidad y operación personalizada para equipos grandes.',
    },
    maxBrands: null,
  },
  founder: {
    badge: { en: 'Founder', es: 'Fundador' },
    description: {
      en: 'Ideal for a single brand with a focused publishing system.',
      es: 'Ideal para una sola marca con un sistema de publicación enfocado.',
    },
    maxBrands: 1,
  },
  studio: {
    badge: { en: 'Studio', es: 'Estudio' },
    description: {
      en: 'Built for small teams that need a handful of brands.',
      es: 'Hecho para equipos pequeños que necesitan varias marcas.',
    },
    maxBrands: 3,
  },
}

export function normalizeWorkspacePlan(plan: WorkspacePlanCode | null | undefined): WorkspacePlanTier {
  const normalized = plan?.trim().toLowerCase()

  switch (normalized) {
    case 'agency':
      return 'agency'
    case 'enterprise':
      return 'enterprise'
    case 'pro':
    case 'studio':
      return 'studio'
    case 'free':
    case 'starter':
    case 'founder':
    default:
      return 'founder'
  }
}

export function getWorkspacePlanLabel(
  plan: WorkspacePlanCode | null | undefined,
  locale: WorkspacePlanLocale = 'es'
) {
  return PLAN_METADATA[normalizeWorkspacePlan(plan)].badge[locale]
}

export function getWorkspacePlanDescription(
  plan: WorkspacePlanCode | null | undefined,
  locale: WorkspacePlanLocale = 'es'
) {
  return PLAN_METADATA[normalizeWorkspacePlan(plan)].description[locale]
}

export function getWorkspaceLimit(
  plan: WorkspacePlanCode | null | undefined,
  override: number | null | undefined
) {
  if (typeof override === 'number' && Number.isFinite(override) && override > 0) {
    return override
  }

  return PLAN_METADATA[normalizeWorkspacePlan(plan)].maxBrands
}

export function formatWorkspaceLimit(limit: number | null, locale: WorkspacePlanLocale = 'es') {
  if (limit == null) {
    return locale === 'es' ? 'Capacidad personalizada' : 'Custom capacity'
  }

  return locale === 'es'
    ? `${limit} ${limit === 1 ? 'marca' : 'marcas'}`
    : `${limit} ${limit === 1 ? 'brand' : 'brands'}`
}
