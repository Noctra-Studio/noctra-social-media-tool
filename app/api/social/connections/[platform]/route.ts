import { NextResponse } from 'next/server'
import { isSocialMetricPlatform } from '@/lib/social/platforms'
import { requireActiveWorkspaceRouteContext } from '@/lib/workspace/route'

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ platform: string }> }
) {
  const { platform } = await context.params

  if (!isSocialMetricPlatform(platform)) {
    return NextResponse.json({ error: 'Unsupported social platform.' }, { status: 400 })
  }

  try {
    const workspaceContext = await requireActiveWorkspaceRouteContext()

    if ('response' in workspaceContext) {
      return workspaceContext.response
    }

    const { error } = await workspaceContext.admin
      .from('social_connections')
      .delete()
      .eq('workspace_id', workspaceContext.workspaceId)
      .eq('platform', platform)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to disconnect social connection', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'No fue posible desconectar la cuenta social.',
      },
      { status: 500 }
    )
  }
}
