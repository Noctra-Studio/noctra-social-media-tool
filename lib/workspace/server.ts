import type { User } from '@supabase/supabase-js'
import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import type { WorkspaceConfig, WorkspaceContext } from '@/types/workspace'

type WorkspaceMemberRow = {
  role: WorkspaceContext['role']
  workspace: WorkspaceContext['workspace'] | WorkspaceContext['workspace'][] | null
}

type ProfileRow = {
  assistance_level?: string | null
  current_workspace_id?: string | null
  full_name?: string | null
  social_handles?: Record<string, string> | null
}

export type ActiveWorkspaceContext = {
  config: WorkspaceConfig | null
  profile: ProfileRow | null
  role: WorkspaceContext['role'] | null
  supabase: Awaited<ReturnType<typeof createClient>>
  user: User
  workspace: WorkspaceContext['workspace'] | null
  workspaces: WorkspaceContext[]
}

export async function getActiveWorkspaceContext(): Promise<ActiveWorkspaceContext> {
  const user = await getUser()
  const supabase = await createClient()

  const [{ data: profile, error: profileError }, { data: members, error: membersError }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('assistance_level, current_workspace_id, full_name, social_handles')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('workspace_members')
        .select(
          `
            role,
            workspace:workspaces(
              id, slug, name, plan, status
            )
          `
        )
        .eq('user_id', user.id),
    ])

  if (profileError) {
    throw profileError
  }

  if (membersError) {
    throw membersError
  }

  const normalizeWorkspace = (
    workspace: WorkspaceMemberRow['workspace']
  ): WorkspaceContext['workspace'] | null => {
    if (Array.isArray(workspace)) {
      return workspace[0] ?? null
    }

    return workspace ?? null
  }

  const workspaces = (((members as unknown as WorkspaceMemberRow[] | null) ?? []).map((member) => {
    const workspace = normalizeWorkspace(member.workspace)

    return workspace
      ? {
          config: null,
          role: member.role,
          workspace,
        }
      : null
  }) as Array<WorkspaceContext | null>).filter((item): item is WorkspaceContext => item !== null)

  const activeId = profile?.current_workspace_id ?? workspaces[0]?.workspace.id ?? null
  const activeEntry = workspaces.find((entry) => entry.workspace.id === activeId) ?? workspaces[0]

  if (!activeEntry) {
    return {
      config: null,
      profile: (profile as ProfileRow | null) ?? null,
      role: null,
      supabase,
      user,
      workspace: null,
      workspaces: [],
    }
  }

  if (!profile?.current_workspace_id || profile.current_workspace_id !== activeEntry.workspace.id) {
    await supabase
      .from('profiles')
      .update({ current_workspace_id: activeEntry.workspace.id })
      .eq('id', user.id)
  }

  const { data: config, error: configError } = await supabase
    .from('workspace_config')
    .select('*')
    .eq('workspace_id', activeEntry.workspace.id)
    .maybeSingle()

  if (configError) {
    throw configError
  }

  return {
    config: (config as WorkspaceConfig | null) ?? null,
    profile: (profile as ProfileRow | null) ?? null,
    role: activeEntry.role,
    supabase,
    user,
    workspace: activeEntry.workspace,
    workspaces,
  }
}
