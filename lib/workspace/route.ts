import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { requireRouteUser } from '@/lib/auth/require-route-user'
import { createAdminClient } from '@/lib/supabase'

type WorkspaceRouteSuccess = {
  admin: ReturnType<typeof createAdminClient>
  user: User
  workspaceId: string
}

type WorkspaceRouteFailure = {
  response: NextResponse
}

export async function requireActiveWorkspaceRouteContext(): Promise<
  WorkspaceRouteFailure | WorkspaceRouteSuccess
> {
  const { response, user } = await requireRouteUser()

  if (response || !user) {
    return {
      response: response ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const admin = createAdminClient()
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('current_workspace_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    throw profileError
  }

  const workspaceId = profile?.current_workspace_id?.trim()

  if (!workspaceId) {
    return {
      response: NextResponse.json(
        { error: 'No active workspace selected for this user.' },
        { status: 400 }
      ),
    }
  }

  const { data: membership, error: membershipError } = await admin
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (membershipError) {
    throw membershipError
  }

  if (!membership) {
    return {
      response: NextResponse.json(
        { error: 'You do not have access to the active workspace.' },
        { status: 403 }
      ),
    }
  }

  return {
    admin,
    user,
    workspaceId,
  }
}
