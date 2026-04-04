import { NextResponse } from 'next/server'
import { getNoctraAdminContext } from '@/lib/auth/noctra-admin'
import { approveAccessRequestSchema } from '@/lib/early-access/schema'
import { getAppUrl } from '@/lib/early-access/utils'
import { createAdminClient } from '@/lib/supabase'
import { sendNoctraEmail } from '@/lib/early-access/email'
import { getAccessGrantedTemplate } from '@/lib/early-access/email-templates'

type WorkspaceRow = {
  id: string
  slug: string
}

function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

async function getOrCreateWorkspaceForInvitedUser(params: {
  invitedBy: string
  userId: string
  workspaceName: string
}) {
  const supabaseAdmin = createAdminClient()

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('current_workspace_id')
    .eq('id', params.userId)
    .maybeSingle()

  if (profile?.current_workspace_id) {
    const { data: workspace } = await supabaseAdmin
      .from('workspaces')
      .select('id, slug')
      .eq('id', profile.current_workspace_id)
      .maybeSingle()

    if (workspace) {
      return workspace as WorkspaceRow
    }
  }

  const { data: ownedWorkspace } = await supabaseAdmin
    .from('workspaces')
    .select('id, slug')
    .eq('owner_id', params.userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (ownedWorkspace) {
    return ownedWorkspace as WorkspaceRow
  }

  const { data: workspace, error: workspaceError } = await supabaseAdmin
    .from('workspaces')
    .insert({
      name: params.workspaceName,
      owner_id: params.userId,
      plan: 'free',
      slug: `${params.userId.slice(0, 8)}-${Date.now().toString(36)}`,
      status: 'active',
    })
    .select('id, slug')
    .single()

  if (workspaceError) {
    throw workspaceError
  }

  await supabaseAdmin.from('workspace_members').upsert(
    {
      invited_by: params.invitedBy,
      role: 'owner',
      user_id: params.userId,
      workspace_id: workspace.id,
    },
    { onConflict: 'workspace_id,user_id' }
  )

  await supabaseAdmin.from('workspace_config').upsert(
    {
      brand_name: params.workspaceName,
      workspace_id: workspace.id,
    },
    { onConflict: 'workspace_id' }
  )

  return workspace as WorkspaceRow
}

export async function POST(req: Request) {
  let adminContext

  try {
    adminContext = await getNoctraAdminContext()
  } catch {
    return unauthorizedResponse()
  }

  try {
    const body = await req.json()
    const parsed = approveAccessRequestSchema.safeParse(body)

    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return NextResponse.json(
        { error: issue?.message ?? 'Solicitud inválida' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()
    const { plan, request_id, review_notes, workspace_name, workspace_slug } = parsed.data
    const { data: request, error: requestError } = await supabaseAdmin
      .from('access_requests')
      .select('*')
      .eq('id', request_id)
      .maybeSingle()

    if (requestError) {
      throw requestError
    }

    if (!request) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    if (request.status === 'approved') {
      return NextResponse.json(
        { error: 'La solicitud ya fue aprobada.' },
        { status: 409 }
      )
    }

    const redirectTo = `${getAppUrl(req)}/set-password`
    
    // Generar el enlace de invitación sin enviar el correo automático de Supabase
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: request.email,
      options: {
        data: {
          company_name: request.company_name,
          full_name: request.full_name,
          workspace_name,
        },
        redirectTo,
      },
    })

    if (inviteError) {
      throw inviteError
    }

    const invitedUserId = inviteData.user?.id
    const activationLink = inviteData.properties?.action_link

    if (!invitedUserId) {
      throw new Error('No fue posible crear el usuario invitado.')
    }

    const workspace = await getOrCreateWorkspaceForInvitedUser({
      invitedBy: adminContext.user.id,
      userId: invitedUserId,
      workspaceName: workspace_name,
    })

    const { data: conflictingWorkspace, error: slugConflictError } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('slug', workspace_slug)
      .neq('id', workspace.id)
      .maybeSingle()

    if (slugConflictError) {
      throw slugConflictError
    }

    if (conflictingWorkspace) {
      return NextResponse.json(
        { error: 'Ese slug ya está en uso por otro workspace.' },
        { status: 409 }
      )
    }

    const { error: workspaceError } = await supabaseAdmin
      .from('workspaces')
      .update({
        name: workspace_name,
        owner_id: invitedUserId,
        plan,
        slug: workspace_slug,
        status: 'active',
      })
      .eq('id', workspace.id)

    if (workspaceError) {
      throw workspaceError
    }

    const { error: memberError } = await supabaseAdmin.from('workspace_members').upsert(
      {
        invited_by: adminContext.user.id,
        role: 'owner',
        user_id: invitedUserId,
        workspace_id: workspace.id,
      },
      { onConflict: 'workspace_id,user_id' }
    )

    if (memberError) {
      throw memberError
    }

    const { error: configError } = await supabaseAdmin.from('workspace_config').upsert(
      {
        brand_name: workspace_name,
        workspace_id: workspace.id,
      },
      { onConflict: 'workspace_id' }
    )

    if (configError) {
      throw configError
    }

    const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
      {
        current_workspace_id: workspace.id,
        email: request.email,
        full_name: request.full_name,
        id: invitedUserId,
      },
      { onConflict: 'id' }
    )

    if (profileError) {
      throw profileError
    }

    const reviewTimestamp = new Date().toISOString()
    const { error: updateRequestError } = await supabaseAdmin
      .from('access_requests')
      .update({
        review_notes: review_notes ?? null,
        reviewed_at: reviewTimestamp,
        reviewed_by: adminContext.user.id,
        status: 'approved',
        workspace_id: workspace.id,
      })
      .eq('id', request_id)

    if (updateRequestError) {
      throw updateRequestError
    }

    try {
      if (activationLink) {
        await sendNoctraEmail({
          subject: '¡Tu acceso a Noctra Social está listo!',
          to: request.email,
          html: getAccessGrantedTemplate({
            name: request.full_name,
            loginUrl: activationLink, // Enviamos el link real de activación generado por Supabase
          }),
        })
      }
    } catch (emailError) {
      console.error('Approved access request branded email error:', emailError)
    }

    return NextResponse.json({
      success: true,
      user_id: invitedUserId,
      workspace_id: workspace.id,
    })
  } catch (error) {
    console.error('Approval error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No fue posible aprobar la solicitud' },
      { status: 500 }
    )
  }
}
