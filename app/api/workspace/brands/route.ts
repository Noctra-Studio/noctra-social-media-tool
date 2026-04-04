import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRouteUser } from '@/lib/auth/require-route-user'
import { toWorkspaceSlug } from '@/lib/early-access/utils'
import { createAdminClient } from '@/lib/supabase'
import {
  formatWorkspaceLimit,
  getWorkspaceLimit,
  getWorkspacePlanLabel,
  normalizeWorkspacePlan,
} from '@/lib/workspace/plans'

const createBrandSchema = z.object({
  name: z.string().trim().min(2, 'Ingresa un nombre de marca válido.').max(120, 'El nombre es demasiado largo.'),
  slug: z
    .string()
    .trim()
    .max(80, 'El slug es demasiado largo.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Usa solo minúsculas, números y guiones.')
    .optional(),
})

type OwnedWorkspaceRow = {
  created_at: string
  id: string
  name: string
  plan: string
  slug: string
  status: string
}

async function buildSummary(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const [{ data: profile, error: profileError }, { data: memberships, error: membershipError }] =
    await Promise.all([
      admin
        .from('profiles')
        .select('current_workspace_id, workspace_limit_override')
        .eq('id', userId)
        .maybeSingle(),
      admin
        .from('workspace_members')
        .select(
          `
            role,
            workspace:workspaces(
              id, name, slug, plan, status
            )
          `
        )
        .eq('user_id', userId),
    ])

  if (profileError) {
    throw profileError
  }

  if (membershipError) {
    throw membershipError
  }

  const activeWorkspaceId = profile?.current_workspace_id ?? null
  const activeMembership = (memberships ?? []).find((membership) => {
    const workspace = Array.isArray(membership.workspace)
      ? membership.workspace[0]
      : membership.workspace

    return workspace?.id === activeWorkspaceId
  })

  const activeWorkspace = Array.isArray(activeMembership?.workspace)
    ? activeMembership?.workspace[0]
    : activeMembership?.workspace

  if (!activeWorkspace) {
    throw new Error('No active workspace selected for this user.')
  }

  const { data: ownedWorkspaces, error: ownedWorkspacesError } = await admin
    .from('workspaces')
    .select('id, name, slug, plan, status, created_at')
    .eq('owner_id', userId)
    .order('created_at', { ascending: true })

  if (ownedWorkspacesError) {
    throw ownedWorkspacesError
  }

  const normalizedPlan = normalizeWorkspacePlan(activeWorkspace.plan)
  const workspaceLimit = getWorkspaceLimit(activeWorkspace.plan, profile?.workspace_limit_override)
  const ownedCount = ownedWorkspaces?.length ?? 0

  return {
    activeWorkspace: {
      id: activeWorkspace.id,
      name: activeWorkspace.name,
      plan: activeWorkspace.plan,
      plan_label: getWorkspacePlanLabel(activeWorkspace.plan),
      role: activeMembership?.role ?? null,
      status: activeWorkspace.status,
    },
    can_manage: activeMembership?.role === 'owner' || activeMembership?.role === 'admin',
    can_create: workspaceLimit == null || ownedCount < workspaceLimit,
    limit: workspaceLimit,
    limit_label: formatWorkspaceLimit(workspaceLimit),
    normalized_plan: normalizedPlan,
    owned_count: ownedCount,
    override: profile?.workspace_limit_override ?? null,
    remaining_slots: workspaceLimit == null ? null : Math.max(workspaceLimit - ownedCount, 0),
    workspaces: ((ownedWorkspaces as OwnedWorkspaceRow[] | null) ?? []).map((workspace) => ({
      created_at: workspace.created_at,
      id: workspace.id,
      is_active: workspace.id === activeWorkspace.id,
      name: workspace.name,
      plan: workspace.plan,
      plan_label: getWorkspacePlanLabel(workspace.plan),
      slug: workspace.slug,
      status: workspace.status,
    })),
  }
}

async function resolveUniqueWorkspaceSlug(
  admin: ReturnType<typeof createAdminClient>,
  baseSlug: string
) {
  const slugBase = toWorkspaceSlug(baseSlug).slice(0, 68) || 'workspace'
  let candidate = slugBase

  for (let attempt = 1; attempt <= 50; attempt += 1) {
    const { data: existing, error } = await admin
      .from('workspaces')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!existing) {
      return candidate
    }

    candidate = `${slugBase}-${attempt + 1}`.slice(0, 80)
  }

  throw new Error('No fue posible generar un slug disponible para esta marca.')
}

export async function GET() {
  try {
    const { response, user } = await requireRouteUser()

    if (response || !user) {
      return response ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const summary = await buildSummary(admin, user.id)

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Workspace brands load failed', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'No fue posible cargar la capacidad de marcas.',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { response, user } = await requireRouteUser()

    if (response || !user) {
      return response ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const summary = await buildSummary(admin, user.id)

    if (!summary.can_manage) {
      return NextResponse.json(
        { error: 'Solo owners o admins pueden agregar nuevas marcas.' },
        { status: 403 }
      )
    }

    if (!summary.can_create) {
      const upgradeMessage =
        summary.limit == null
          ? 'Tu configuración actual requiere capacidad personalizada. Escríbenos para activarla.'
          : `Tu plan ${summary.activeWorkspace.plan_label.toLowerCase()} permite hasta ${summary.limit_label.toLowerCase()}. Si necesitas más, sube a Enterprise.`

      return NextResponse.json({ error: upgradeMessage }, { status: 403 })
    }

    const parsedBody = createBrandSchema.safeParse(await request.json())

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.issues[0]?.message ?? 'Payload inválido.' },
        { status: 400 }
      )
    }

    const nextSlug = await resolveUniqueWorkspaceSlug(
      admin,
      parsedBody.data.slug || parsedBody.data.name
    )

    const { data: workspace, error: workspaceError } = await admin
      .from('workspaces')
      .insert({
        name: parsedBody.data.name,
        owner_id: user.id,
        plan: summary.activeWorkspace.plan,
        slug: nextSlug,
        status: 'active',
      })
      .select('id, name, slug, plan, status')
      .single()

    if (workspaceError) {
      throw workspaceError
    }

    const { error: membershipError } = await admin.from('workspace_members').upsert(
      {
        invited_by: user.id,
        role: 'owner',
        user_id: user.id,
        workspace_id: workspace.id,
      },
      { onConflict: 'workspace_id,user_id' }
    )

    if (membershipError) {
      throw membershipError
    }

    const { error: configError } = await admin.from('workspace_config').upsert(
      {
        brand_name: parsedBody.data.name,
        workspace_id: workspace.id,
      },
      { onConflict: 'workspace_id' }
    )

    if (configError) {
      throw configError
    }

    const { error: profileError } = await admin
      .from('profiles')
      .update({ current_workspace_id: workspace.id })
      .eq('id', user.id)

    if (profileError) {
      throw profileError
    }

    const refreshedSummary = await buildSummary(admin, user.id)

    return NextResponse.json({
      success: true,
      summary: refreshedSummary,
      workspace: {
        ...workspace,
        plan_label: getWorkspacePlanLabel(workspace.plan),
      },
    })
  } catch (error) {
    console.error('Workspace brand creation failed', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'No fue posible crear la nueva marca.',
      },
      { status: 500 }
    )
  }
}
