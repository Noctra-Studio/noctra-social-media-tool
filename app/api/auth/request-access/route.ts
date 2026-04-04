import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { sendNoctraEmail } from '@/lib/early-access/email'
import { accessRequestSchema } from '@/lib/early-access/schema'
import {
  escapeHtml,
  formatPlatformList,
  getAppUrl,
  humanizeMonthlyBudget,
  humanizeReferralSource,
} from '@/lib/early-access/utils'
import { getAwaitingReviewTemplate } from '@/lib/early-access/email-templates'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = accessRequestSchema.safeParse(body)

    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return NextResponse.json(
        { error: issue?.message ?? 'Solicitud inválida' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()
    const payload = parsed.data

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('access_requests')
      .select('id, status')
      .eq('email', payload.email)
      .maybeSingle()

    if (existingError) {
      throw existingError
    }

    if (existing?.status === 'approved') {
      return NextResponse.json(
        { error: 'Este email ya tiene acceso a la plataforma.' },
        { status: 409 }
      )
    }

    if (existing?.status === 'pending') {
      return NextResponse.json(
        { error: 'Ya existe una solicitud pendiente con este email.' },
        { status: 409 }
      )
    }

    const record = {
      company_name: payload.company_name,
      email: payload.email,
      full_name: payload.full_name,
      goal: payload.goal,
      monthly_budget: payload.monthly_budget ?? null,
      platforms: payload.platforms,
      referral_source: payload.referral_source ?? null,
      requested_at: new Date().toISOString(),
      review_notes: null,
      reviewed_at: null,
      reviewed_by: null,
      status: 'pending',
      website_url: payload.website_url || null,
      workspace_id: null,
    }

    const query = existing
      ? supabaseAdmin.from('access_requests').update(record).eq('id', existing.id)
      : supabaseAdmin.from('access_requests').insert(record)

    const { error } = await query

    if (error) {
      throw error
    }

    const adminUrl = `${getAppUrl(req)}/admin/requests`
    try {
      await sendNoctraEmail({
        subject: `Nueva solicitud de acceso: ${payload.company_name} (${payload.email})`,
        to: 'hello@noctra.studio',
        html: `
          <h2>Nueva solicitud de Early Access</h2>
          <p><strong>Nombre:</strong> ${escapeHtml(payload.full_name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
          <p><strong>Empresa:</strong> ${escapeHtml(payload.company_name)}</p>
          <p><strong>Sitio web:</strong> ${escapeHtml(payload.website_url || 'No indicado')}</p>
          <p><strong>Plataformas:</strong> ${escapeHtml(formatPlatformList(payload.platforms))}</p>
          <p><strong>Objetivo:</strong> ${escapeHtml(payload.goal)}</p>
          <p><strong>Presupuesto:</strong> ${escapeHtml(humanizeMonthlyBudget(payload.monthly_budget))}</p>
          <p><strong>Referencia:</strong> ${escapeHtml(humanizeReferralSource(payload.referral_source))}</p>
          <br />
          <a href="${escapeHtml(adminUrl)}" style="background:#462D6E;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
            Ver en panel admin
          </a>
        `,
      })
    } catch (emailError) {
      console.error('Access request admin notification error:', emailError)
    }

    try {
      await sendNoctraEmail({
        subject: 'Recibimos tu solicitud de acceso a Noctra Social',
        to: payload.email,
        html: getAwaitingReviewTemplate({ name: payload.full_name }),
      })
    } catch (emailError) {
      console.error('Awaiting review email error:', emailError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Access request error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Error al procesar la solicitud',
      },
      { status: 500 }
    )
  }
}
