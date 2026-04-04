import type { AccessRequestStatus, WorkspacePlan } from '@/lib/early-access/schema'

export type AccessRequestRecord = {
  id: string
  email: string
  full_name: string
  company_name: string
  website_url: string | null
  platforms: string[]
  goal: string
  monthly_budget: string | null
  referral_source: string | null
  status: AccessRequestStatus
  reviewed_by: string | null
  review_notes: string | null
  workspace_id: string | null
  requested_at: string
  reviewed_at: string | null
}

export const platformOptions = [
  { label: 'Instagram', value: 'instagram' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'X', value: 'x' },
] as const

export const referralSourceOptions = [
  { label: 'Instagram', value: 'instagram' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'Recomendación', value: 'recommendation' },
  { label: 'Búsqueda web', value: 'web_search' },
  { label: 'Otro', value: 'other' },
] as const

export const monthlyBudgetOptions = [
  { label: '< $500', value: 'lt_500' },
  { label: '$500 - $2000', value: '500_2000' },
  { label: '$2000 - $5000', value: '2000_5000' },
  { label: '> $5000', value: 'gt_5000' },
  { label: 'Prefiero no decir', value: 'prefer_not_to_say' },
] as const

export const workspacePlanOptions: Array<{ label: string; value: WorkspacePlan }> = [
  { label: 'Fundador', value: 'free' },
  { label: 'Starter (legacy)', value: 'starter' },
  { label: 'Estudio', value: 'pro' },
  { label: 'Agencia', value: 'agency' },
  { label: 'Enterprise', value: 'enterprise' },
]

export const statusLabels: Record<AccessRequestStatus, string> = {
  approved: 'Aprobada',
  pending: 'Pendiente',
  rejected: 'Rechazada',
  waitlisted: 'Lista de espera',
}

export function getAppUrl(request?: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()

  if (configured) {
    return configured.replace(/\/$/, '')
  }

  if (request) {
    return new URL(request.url).origin
  }

  return 'http://localhost:3000'
}

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function formatPlatformList(platforms: string[]) {
  return platforms
    .map((platform) => platformOptions.find((option) => option.value === platform)?.label ?? platform)
    .join(', ')
}

export function humanizeReferralSource(value: string | null | undefined) {
  if (!value) return 'No indicado'

  return referralSourceOptions.find((option) => option.value === value)?.label ?? value
}

export function humanizeMonthlyBudget(value: string | null | undefined) {
  if (!value) return 'No indicado'

  return monthlyBudgetOptions.find((option) => option.value === value)?.label ?? value
}

export function toWorkspaceSlug(value: string) {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || 'workspace'
}
