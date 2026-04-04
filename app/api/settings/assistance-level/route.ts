import { NextResponse } from 'next/server'
import type { AssistanceLevel } from '@/lib/product'
import { getActiveWorkspaceContext } from '@/lib/workspace/server'

function isAssistanceLevel(value: unknown): value is AssistanceLevel {
  return value === 'guided' || value === 'balanced' || value === 'expert'
}

export async function POST(req: Request) {
  try {
    let context

    try {
      context = await getActiveWorkspaceContext()
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!context.workspace) return NextResponse.json({ error: 'No workspace' }, { status: 401 })

    const body = (await req.json()) as { assistance_level?: unknown }

    if (!isAssistanceLevel(body.assistance_level)) {
      return NextResponse.json({ error: 'Invalid assistance level' }, { status: 400 })
    }

    const nextAssistanceLevel =
      body.assistance_level === 'guided'
        ? 'minimal'
        : body.assistance_level === 'expert'
          ? 'full'
          : 'balanced'

    const { error } = await context.supabase
      .from('workspace_config')
      .upsert(
        {
          assistance_level: nextAssistanceLevel,
          workspace_id: context.workspace.id,
        },
        { onConflict: 'workspace_id' }
      )

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Assistance level error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save assistance level' },
      { status: 500 }
    )
  }
}
