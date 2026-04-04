import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireActiveWorkspaceRouteContext } from '@/lib/workspace/route'

const dismissSchema = z.object({
  id: z.string().uuid(),
})

export async function POST(req: Request) {
  try {
    const workspaceContext = await requireActiveWorkspaceRouteContext()

    if ('response' in workspaceContext) {
      return workspaceContext.response
    }

    const { workspaceId, admin } = workspaceContext
    const parsed = dismissSchema.safeParse(await req.json())

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid insight id.' }, { status: 400 })
    }

    const { error } = await admin
      .from('ai_insights')
      .update({ is_active: false })
      .eq('id', parsed.data.id)
      .eq('workspace_id', workspaceId)

    if (error) {
      throw error
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Dismiss insight failed:', error)
    const msg = error instanceof Error ? error.message : 'Failed to dismiss insight'

    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
