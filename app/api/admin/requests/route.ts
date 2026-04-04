import { NextResponse } from 'next/server'
import { getNoctraAdminContext } from '@/lib/auth/noctra-admin'
import { sendNoctraEmail } from '@/lib/early-access/email'
import {
  accessRequestStatuses,
  reviewAccessRequestSchema,
} from '@/lib/early-access/schema'
import { createAdminClient } from '@/lib/supabase'
import { escapeHtml } from '@/lib/early-access/utils'
import { getUpdateStatusTemplate } from '@/lib/early-access/email-templates'

function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export async function GET(req: Request) {
  try {
    await getNoctraAdminContext()
  } catch {
    return unauthorizedResponse()
  }

  try {
    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const supabaseAdmin = createAdminClient()

    let query = supabaseAdmin
      .from('access_requests')
      .select('*')
      .order('requested_at', { ascending: false })

    if (status && accessRequestStatuses.includes(status as (typeof accessRequestStatuses)[number])) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ requests: data ?? [] })
  } catch (error) {
    console.error('List access requests error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No fue posible cargar solicitudes' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  let adminContext

  try {
    adminContext = await getNoctraAdminContext()
  } catch {
    return unauthorizedResponse()
  }

  try {
    const body = await req.json()
    const parsed = reviewAccessRequestSchema.safeParse(body)

    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return NextResponse.json(
        { error: issue?.message ?? 'Solicitud inválida' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()
    const { request_id, review_notes, status } = parsed.data
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

    const reviewTimestamp = new Date().toISOString()
    const { data: updatedRequest, error: updateError } = await supabaseAdmin
      .from('access_requests')
      .update({
        review_notes: review_notes ?? null,
        reviewed_at: reviewTimestamp,
        reviewed_by: adminContext.user.id,
        status,
      })
      .eq('id', request_id)
      .select('*')
      .single()

    if (updateError) {
      throw updateError
    }

    if (status === 'rejected' || status === 'waitlisted') {
      try {
        await sendNoctraEmail({
          subject: 'Actualización sobre tu solicitud a Noctra Social',
          to: request.email,
          html: getUpdateStatusTemplate({
            name: request.full_name,
            status: status as 'rejected' | 'waitlisted',
          }),
        })
      } catch (emailError) {
        console.error('Update status email error:', emailError)
      }
    }

    return NextResponse.json({ success: true, request: updatedRequest })
  } catch (error) {
    console.error('Review access request error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No fue posible actualizar la solicitud' },
      { status: 500 }
    )
  }
}
