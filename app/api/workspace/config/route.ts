import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireActiveWorkspaceRouteContext } from '@/lib/workspace/route'

const mainGoalSchema = z.enum([
  'brand_awareness',
  'lead_generation',
  'community',
  'sales',
  'thought_leadership',
  'mixed',
])

const assistanceLevelSchema = z.enum(['minimal', 'balanced', 'full'])
const hashtagStyleSchema = z.enum(['none', 'minimal', 'curated', 'aggressive'])
const textLengthSchema = z.enum(['short', 'medium', 'long', 'varies'])

const configPatchSchema = z.object({
  always_include_cta: z.boolean().optional(),
  assistance_level: assistanceLevelSchema.optional(),
  brand_description: z.union([z.string(), z.null()]).optional(),
  brand_name: z.union([z.string(), z.null()]).optional(),
  brand_values: z.array(z.string()).max(5).optional(),
  cta_style: z.union([z.string(), z.null()]).optional(),
  forbidden_words: z.array(z.string()).max(10).optional(),
  hashtag_style: hashtagStyleSchema.optional(),
  industry: z.union([z.string(), z.null()]).optional(),
  logo_storage_path: z.union([z.string(), z.null()]).optional(),
  logo_url: z.union([z.string(), z.null()]).optional(),
  main_goal: z.union([mainGoalSchema, z.null()]).optional(),
  onboarding_completed: z.boolean().optional(),
  posting_frequency: z
    .object({
      instagram: z.number().int().min(0).max(14).optional(),
      linkedin: z.number().int().min(0).max(14).optional(),
      x: z.number().int().min(0).max(14).optional(),
    })
    .optional(),
  preferred_emojis: z.boolean().optional(),
  reference_posts: z.array(z.string()).max(5).optional(),
  target_audience: z.union([z.string(), z.null()]).optional(),
  text_length_pref: textLengthSchema.optional(),
  tone_of_voice: z.union([z.string(), z.null()]).optional(),
  use_hashtags: z.boolean().optional(),
})

function normalizeText(value: string | null | undefined, maxLength: number) {
  if (value == null) {
    return null
  }

  const normalized = value.trim().replace(/\s+/g, ' ')
  return normalized ? normalized.slice(0, maxLength) : null
}

function normalizeMultilineText(value: string | null | undefined, maxLength: number) {
  if (value == null) {
    return null
  }

  const normalized = value.trim().replace(/\r\n/g, '\n')
  return normalized ? normalized.slice(0, maxLength) : null
}

function normalizeStringArray(values: string[] | undefined, maxItems: number, maxLength: number) {
  if (!values) {
    return undefined
  }

  const seen = new Set<string>()
  const nextValues: string[] = []

  for (const value of values) {
    const normalized = value.trim().replace(/\s+/g, ' ')

    if (!normalized) {
      continue
    }

    const fingerprint = normalized.toLocaleLowerCase('es')

    if (seen.has(fingerprint)) {
      continue
    }

    seen.add(fingerprint)
    nextValues.push(normalized.slice(0, maxLength))
  }

  return nextValues.slice(0, maxItems)
}

function stripUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Partial<T>
}

export async function PATCH(request: Request) {
  try {
    const context = await requireActiveWorkspaceRouteContext()

    if ('response' in context) {
      return context.response
    }

    const parsedBody = configPatchSchema.safeParse(await request.json())

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid workspace config payload', details: parsedBody.error.flatten() },
        { status: 400 }
      )
    }

    const payload = stripUndefined({
      always_include_cta: parsedBody.data.always_include_cta,
      assistance_level: parsedBody.data.assistance_level,
      brand_description:
        parsedBody.data.brand_description === undefined
          ? undefined
          : normalizeMultilineText(parsedBody.data.brand_description, 1200),
      brand_name:
        parsedBody.data.brand_name === undefined
          ? undefined
          : normalizeText(parsedBody.data.brand_name, 120),
      brand_values: normalizeStringArray(parsedBody.data.brand_values, 5, 40),
      cta_style:
        parsedBody.data.cta_style === undefined
          ? undefined
          : normalizeText(parsedBody.data.cta_style, 120),
      forbidden_words: normalizeStringArray(parsedBody.data.forbidden_words, 10, 40),
      hashtag_style: parsedBody.data.hashtag_style,
      industry:
        parsedBody.data.industry === undefined
          ? undefined
          : normalizeText(parsedBody.data.industry, 120),
      logo_storage_path: parsedBody.data.logo_storage_path,
      logo_url:
        parsedBody.data.logo_url === undefined
          ? undefined
          : normalizeMultilineText(parsedBody.data.logo_url, 2048),
      main_goal: parsedBody.data.main_goal,
      onboarding_completed: parsedBody.data.onboarding_completed,
      posting_frequency: parsedBody.data.posting_frequency,
      preferred_emojis: parsedBody.data.preferred_emojis,
      reference_posts: parsedBody.data.reference_posts?.map((post) => post.trim()).filter(Boolean),
      target_audience:
        parsedBody.data.target_audience === undefined
          ? undefined
          : normalizeMultilineText(parsedBody.data.target_audience, 1200),
      text_length_pref: parsedBody.data.text_length_pref,
      tone_of_voice:
        parsedBody.data.tone_of_voice === undefined
          ? undefined
          : normalizeText(parsedBody.data.tone_of_voice, 80),
      use_hashtags: parsedBody.data.use_hashtags,
    })

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'No changes provided.' }, { status: 400 })
    }

    const { data, error } = await context.admin
      .from('workspace_config')
      .upsert(
        {
          ...payload,
          workspace_id: context.workspaceId,
        },
        {
          onConflict: 'workspace_id',
        }
      )
      .select('*')
      .maybeSingle()

    if (error) {
      throw error
    }

    return NextResponse.json({
      config: data,
      success: true,
    })
  } catch (error) {
    console.error('Workspace config patch failed', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'No fue posible guardar la configuración del workspace.',
      },
      { status: 500 }
    )
  }
}
