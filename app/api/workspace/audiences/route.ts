import { NextResponse } from 'next/server'
import { z } from 'zod'
import { languageLevelOptions } from '@/lib/brand-strategy'
import { platforms } from '@/lib/product'
import { requireActiveWorkspaceRouteContext } from '@/lib/workspace/route'

const audienceSchema = z.object({
  audience_description: z.string().optional(),
  desired_outcomes: z.array(z.string()).max(10).optional(),
  language_level: z.enum(languageLevelOptions).optional(),
  pain_points: z.array(z.string()).max(10).optional(),
  platform: z.enum(platforms),
})

const audiencesBodySchema = z.object({
  audiences: z.array(audienceSchema).max(3),
})

function normalizeText(value: string | undefined, maxLength: number) {
  const normalized = value?.trim().replace(/\s+/g, ' ') || ''
  return normalized.slice(0, maxLength)
}

function normalizeTagList(values: string[] | undefined, maxItems: number) {
  if (!values) {
    return ''
  }

  const nextValues: string[] = []
  const seen = new Set<string>()

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
    nextValues.push(normalized)
  }

  return nextValues.slice(0, maxItems).join('\n')
}

function splitTagText(value: string | null | undefined) {
  return (value || '')
    .split(/\n+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export async function GET() {
  try {
    const context = await requireActiveWorkspaceRouteContext()

    if ('response' in context) {
      return context.response
    }

    const { data, error } = await context.admin
      .from('platform_audiences')
      .select(
        'id, platform, audience_description, pain_points, desired_outcomes, language_level'
      )
      .eq('workspace_id', context.workspaceId)

    if (error) {
      throw error
    }

    return NextResponse.json({
      audiences: (data ?? []).map((audience) => ({
        ...audience,
        desired_outcomes: splitTagText(audience.desired_outcomes),
        pain_points: splitTagText(audience.pain_points),
      })),
    })
  } catch (error) {
    console.error('Workspace audiences load failed', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'No fue posible cargar las audiencias.',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireActiveWorkspaceRouteContext()

    if ('response' in context) {
      return context.response
    }

    const parsedBody = audiencesBodySchema.safeParse(await request.json())

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid audiences payload', details: parsedBody.error.flatten() },
        { status: 400 }
      )
    }

    const audiences = parsedBody.data.audiences
      .map((audience) => ({
        audience_description: normalizeText(audience.audience_description, 320),
        desired_outcomes: normalizeTagList(audience.desired_outcomes, 10),
        language_level: audience.language_level ?? 'mixed',
        pain_points: normalizeTagList(audience.pain_points, 10),
        platform: audience.platform,
      }))
      .filter(
        (audience) =>
          audience.audience_description ||
          audience.desired_outcomes ||
          audience.pain_points
      )

    const { error: deleteError } = await context.admin
      .from('platform_audiences')
      .delete()
      .eq('workspace_id', context.workspaceId)

    if (deleteError) {
      throw deleteError
    }

    if (audiences.length === 0) {
      return NextResponse.json({ audiences: [], success: true })
    }

    const { data, error } = await context.admin
      .from('platform_audiences')
      .insert(
        audiences.map((audience) => ({
          ...audience,
          user_id: context.user.id,
          workspace_id: context.workspaceId,
        }))
      )
      .select(
        'id, platform, audience_description, pain_points, desired_outcomes, language_level'
      )

    if (error) {
      throw error
    }

    return NextResponse.json({
      audiences: (data ?? []).map((audience) => ({
        ...audience,
        desired_outcomes: splitTagText(audience.desired_outcomes),
        pain_points: splitTagText(audience.pain_points),
      })),
      success: true,
    })
  } catch (error) {
    console.error('Workspace audiences save failed', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'No fue posible guardar las audiencias.',
      },
      { status: 500 }
    )
  }
}
