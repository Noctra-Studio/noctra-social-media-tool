'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WorkspaceContext as WorkspaceContextValue } from '@/types/workspace'

type WorkspaceProviderValue = {
  isLoading: boolean
  reloadWorkspaces: (preferredId?: string) => Promise<void>
  switchWorkspace: (id: string) => Promise<void>
  workspace: WorkspaceContextValue | null
  workspaces: WorkspaceContextValue[]
}

const WorkspaceCtx = createContext<WorkspaceProviderValue | null>(null)

type WorkspaceMemberRow = {
  role: WorkspaceContextValue['role']
  workspace: WorkspaceContextValue['workspace'] | WorkspaceContextValue['workspace'][] | null
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), [])
  const [workspace, setWorkspace] = useState<WorkspaceContextValue | null>(null)
  const [workspaces, setWorkspaces] = useState<WorkspaceContextValue[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void loadWorkspaces()
  }, [])

  function normalizeWorkspace(
    workspace: WorkspaceMemberRow['workspace']
  ): WorkspaceContextValue['workspace'] | null {
    if (Array.isArray(workspace)) {
      return workspace[0] ?? null
    }

    return workspace ?? null
  }

  async function loadWorkspaceConfig(ctx: WorkspaceContextValue) {
    const { data: config } = await supabase
      .from('workspace_config')
      .select('*')
      .eq('workspace_id', ctx.workspace.id)
      .maybeSingle()

    setWorkspace({ ...ctx, config: (config as WorkspaceContextValue['config']) ?? null })
  }

  async function loadWorkspaces(preferredId?: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setIsLoading(false)
      return
    }

    const { data: members } = await supabase
      .from('workspace_members')
      .select(
        `
          role,
          workspace:workspaces(
            id, slug, name, plan, status
          )
        `
      )
      .eq('user_id', user.id)

    const contexts = (((members as unknown as WorkspaceMemberRow[] | null) ?? []).map((member) => {
      const workspace = normalizeWorkspace(member.workspace)

      return workspace
        ? {
            config: null,
            role: member.role,
            workspace,
          }
        : null
    }) as Array<WorkspaceContextValue | null>).filter(
      (item): item is WorkspaceContextValue => item !== null
    )

    setWorkspaces(contexts)

    const { data: profile } = await supabase
      .from('profiles')
      .select('current_workspace_id')
      .eq('id', user.id)
      .maybeSingle()

    const activeId = preferredId ?? profile?.current_workspace_id ?? contexts[0]?.workspace.id
    const active = contexts.find((ctx) => ctx.workspace.id === activeId) ?? contexts[0] ?? null

    if (active) {
      await loadWorkspaceConfig(active)
    } else {
      setWorkspace(null)
    }

    setIsLoading(false)
  }

  async function reloadWorkspaces(preferredId?: string) {
    setIsLoading(true)
    await loadWorkspaces(preferredId)
  }

  async function switchWorkspace(id: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return
    }

    await supabase.from('profiles').update({ current_workspace_id: id }).eq('id', user.id)

    await loadWorkspaces(id)
  }

  return (
    <WorkspaceCtx.Provider value={{ isLoading, reloadWorkspaces, switchWorkspace, workspace, workspaces }}>
      {children}
    </WorkspaceCtx.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceCtx)

  if (!ctx) {
    throw new Error('useWorkspace must be used inside WorkspaceProvider')
  }

  return ctx
}
