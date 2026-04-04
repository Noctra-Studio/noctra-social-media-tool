import { NextResponse } from 'next/server'
import { z } from 'zod'
import { pillarColorOptions } from '@/lib/brand-strategy'
import { requireActiveWorkspaceRouteContext } from '@/lib/workspace/route'

const pillarSchema = z.object({
  color: z.string().optional(),
  description: z.string().optional(),
  name: z.string(),
})

const pillarsBodySchema = z.object({
  pillars: z.array(pillarSchema).max(4),
})

function normalizeText(value: string | undefined, maxLength: number) {
  const normalized = value?.trim().replace(/\s+/g, ' ') || ''
  return normalized.slice(0, maxLength)
}

export async function GET() {
  try {
    const context = await requireActiveWorkspaceRouteContext()

    if ('response' in context) {
      return context.response
    }

    const { data, error } = await context.admin
      .from('brand_pillars')
      .select('id, name, description, color, sort_order')
      .eq('workspace_id', context.workspaceId)
      .order('sort_order', { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json({ pillars: data ?? [] })
  } catch (error) {
    console.error('Workspace pillars load failed', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'No fue posible cargar los pilares.',
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

    const parsedBody = pillarsBodySchema.safeParse(await request.json())

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid pillars payload', details: parsedBody.error.flatten() },
        { status: 400 }
      )
    }

    const pillars = parsedBody.data.pillars
      .map((pillar, index) => ({
        color:
          pillarColorOptions.find(
            (candidate) => candidate.toUpperCase() === (pillar.color || '').toUpperCase()
          ) ?? pillarColorOptions[index % pillarColorOptions.length],
        description: normalizeText(pillar.description, 240),
        name: normalizeText(pillar.name, 72),
        sort_order: index,
      }))
      .filter((pillar) => pillar.name)

    const { error: deleteError } = await context.admin
      .from('brand_pillars')
      .delete()
      .eq('workspace_id', context.workspaceId)

    if (deleteError) {
      throw deleteError
    }

    if (pillars.length === 0) {
      return NextResponse.json({ pillars: [], success: true })
    }

    const { data, error } = await context.admin
      .from('brand_pillars')
      .insert(
        pillars.map((pillar) => ({
          ...pillar,
          user_id: context.user.id,
          workspace_id: context.workspaceId,
        }))
      )
      .select('id, name, description, color, sort_order')

    if (error) {
      throw error
    }

    return NextResponse.json({
      pillars: data ?? [],
      success: true,
    })
  } catch (error) {
    console.error('Workspace pillars save failed', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'No fue posible guardar los pilares.',
      },
      { status: 500 }
    )
  }
}
