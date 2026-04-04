import { z } from 'zod'

export const accessRequestStatuses = ['pending', 'approved', 'rejected', 'waitlisted'] as const
export const platformValues = ['instagram', 'linkedin', 'x'] as const
export const referralSourceValues = [
  'instagram',
  'linkedin',
  'recommendation',
  'web_search',
  'other',
] as const
export const monthlyBudgetValues = [
  'lt_500',
  '500_2000',
  '2000_5000',
  'gt_5000',
  'prefer_not_to_say',
] as const
export const workspacePlanValues = ['free', 'starter', 'pro', 'agency', 'enterprise'] as const

const websiteSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value ?? '')
  .refine((value) => value === '' || z.string().url().safeParse(value).success, {
    message: 'Ingresa una URL válida',
  })

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined))

export const accessRequestSchema = z.object({
  full_name: z.string().trim().min(2, 'Nombre requerido').max(120, 'Nombre demasiado largo'),
  email: z.string().trim().email('Email inválido').max(180, 'Email demasiado largo'),
  company_name: z
    .string()
    .trim()
    .min(1, 'Empresa requerida')
    .max(160, 'Empresa demasiado larga'),
  website_url: websiteSchema,
  platforms: z
    .array(z.enum(platformValues))
    .default(['instagram']),
  goal: z
    .string()
    .trim()
    .min(1, 'Cuéntanos un poco sobre tu proyecto')
    .max(1500, 'Mantén la respuesta en menos de 1500 caracteres'),
  referral_source: z.enum(referralSourceValues).optional(),
  monthly_budget: z.enum(monthlyBudgetValues).optional(),
})

export const approveAccessRequestSchema = z.object({
  request_id: z.string().uuid('Solicitud inválida'),
  workspace_name: z
    .string()
    .trim()
    .min(2, 'Nombre de workspace requerido')
    .max(120, 'Nombre demasiado largo'),
  workspace_slug: z
    .string()
    .trim()
    .min(2, 'Slug requerido')
    .max(80, 'Slug demasiado largo')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Usa solo minúsculas, números y guiones'),
  plan: z.enum(workspacePlanValues),
  review_notes: optionalTrimmedString,
})

export const reviewAccessRequestSchema = z.object({
  request_id: z.string().uuid('Solicitud inválida'),
  status: z.enum(['rejected', 'waitlisted']),
  review_notes: optionalTrimmedString,
})

export type AccessRequestFormData = z.output<typeof accessRequestSchema>
export type AccessRequestFormValues = z.input<typeof accessRequestSchema>
export type AccessRequestStatus = (typeof accessRequestStatuses)[number]
export type ApproveAccessRequestInput = z.infer<typeof approveAccessRequestSchema>
export type ReviewAccessRequestInput = z.infer<typeof reviewAccessRequestSchema>
export type WorkspacePlan = (typeof workspacePlanValues)[number]
