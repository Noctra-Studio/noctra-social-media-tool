'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import type { AccessRequestStatus, WorkspacePlan } from '@/lib/early-access/schema'
import {
  humanizeMonthlyBudget,
  humanizeReferralSource,
  statusLabels,
  toWorkspaceSlug,
  type AccessRequestRecord,
  workspacePlanOptions,
} from '@/lib/early-access/utils'
import { cn } from '@/lib/utils'

type PanelProps = {
  initialRequests: AccessRequestRecord[]
}

type FilterValue = 'all' | AccessRequestStatus
type ModalState =
  | { kind: 'approve'; request: AccessRequestRecord }
  | { kind: 'reject'; request: AccessRequestRecord }
  | { kind: 'waitlist'; request: AccessRequestRecord }
  | null

const filterOptions: Array<{ label: string; value: FilterValue }> = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Waitlisted', value: 'waitlisted' },
]

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function StatusBadge({ status }: { status: AccessRequestStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em]',
        status === 'approved' && 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
        status === 'pending' && 'border-amber-400/25 bg-amber-400/10 text-amber-100',
        status === 'rejected' && 'border-red-400/30 bg-red-400/10 text-red-200',
        status === 'waitlisted' && 'border-sky-400/25 bg-sky-400/10 text-sky-100'
      )}
    >
      {statusLabels[status]}
    </span>
  )
}

function ModalShell({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode
  onClose: () => void
  title: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06080d]/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#101417] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/30">Noctra Admin</p>
            <h3
              className="mt-2 text-2xl text-white"
              style={{ fontFamily: 'var(--font-brand-display)' }}
            >
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="whitespace-nowrap rounded-full border border-white/10 px-4 py-1.5 text-sm text-white/60 transition hover:border-white/20 hover:text-white"
          >
            Cerrar
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function AccessRequestsAdminPanel({ initialRequests }: PanelProps) {
  const [requests, setRequests] = useState(initialRequests)
  const [filter, setFilter] = useState<FilterValue>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>(null)
  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceSlug, setWorkspaceSlug] = useState('')
  const [plan, setPlan] = useState<WorkspacePlan>('free')
  const [reviewNotes, setReviewNotes] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [actionError, setActionError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!modal || modal.kind !== 'approve') {
      return
    }

    setWorkspaceName(modal.request.company_name)
    setWorkspaceSlug(toWorkspaceSlug(modal.request.company_name))
    setPlan('free')
    setReviewNotes('')
    setActionError('')
    setSlugTouched(false)
  }, [modal])

  useEffect(() => {
    if (!modal || modal.kind !== 'approve' || slugTouched) {
      return
    }

    setWorkspaceSlug(toWorkspaceSlug(workspaceName))
  }, [modal, slugTouched, workspaceName])

  useEffect(() => {
    if (!modal || modal.kind === 'approve') {
      return
    }

    setReviewNotes(modal.request.review_notes ?? '')
    setActionError('')
  }, [modal])

  const filteredRequests = useMemo(() => {
    if (filter === 'all') {
      return requests
    }

    return requests.filter((request) => request.status === filter)
  }, [filter, requests])

  function updateRequest(nextRequest: AccessRequestRecord) {
    setRequests((current) =>
      current.map((request) => (request.id === nextRequest.id ? nextRequest : request))
    )
  }

  async function submitApproval() {
    if (!modal || modal.kind !== 'approve') return

    setSubmitting(true)
    setActionError('')

    try {
      const response = await fetch('/api/admin/approve-request', {
        body: JSON.stringify({
          plan,
          request_id: modal.request.id,
          review_notes: reviewNotes,
          workspace_name: workspaceName,
          workspace_slug: workspaceSlug,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })

      const result = (await response.json()) as { error?: string; workspace_id?: string }

      if (!response.ok) {
        throw new Error(result.error ?? 'No fue posible aprobar la solicitud')
      }

      updateRequest({
        ...modal.request,
        review_notes: reviewNotes || null,
        reviewed_at: new Date().toISOString(),
        status: 'approved',
        workspace_id: result.workspace_id ?? null,
      })
      setModal(null)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Ocurrió un error inesperado.')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitReview(status: 'rejected' | 'waitlisted') {
    if (!modal || (modal.kind !== 'reject' && modal.kind !== 'waitlist')) return

    setSubmitting(true)
    setActionError('')

    try {
      const response = await fetch('/api/admin/requests', {
        body: JSON.stringify({
          request_id: modal.request.id,
          review_notes: reviewNotes,
          status,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      })

      const result = (await response.json()) as {
        error?: string
        request?: AccessRequestRecord
      }

      if (!response.ok || !result.request) {
        throw new Error(result.error ?? 'No fue posible actualizar la solicitud')
      }

      updateRequest(result.request)
      setModal(null)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Ocurrió un error inesperado.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/30">Internal</p>
            <h2
              className="mt-2 text-3xl text-white"
              style={{ fontFamily: 'var(--font-brand-display)' }}
            >
              Solicitudes de acceso
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
              Revisa, aprueba o rechaza el acceso temprano de cuentas nuevas para Noctra Social.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={cn(
                  'rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em] transition',
                  filter === option.value
                    ? 'border-white/20 bg-white/10 text-white'
                    : 'border-white/10 text-white/45 hover:border-white/20 hover:text-white'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-white/10">
          <div className="hidden grid-cols-[1.1fr_1.1fr_1fr_0.8fr_0.9fr_1.2fr] gap-4 bg-white/[0.05] px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-white/35 lg:grid">
            <span>Name</span>
            <span>Email</span>
            <span>Company</span>
            <span>Platforms</span>
            <span>Date</span>
            <span>Status</span>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="px-6 py-14 text-center text-sm text-white/45">
              No hay solicitudes para este filtro.
            </div>
          ) : (
            <div className="divide-y divide-white/8">
              {filteredRequests.map((request) => {
                const expanded = expandedId === request.id
                const actionable =
                  request.status === 'pending' || request.status === 'waitlisted'

                return (
                  <div key={request.id} className="bg-[#101417]/80">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : request.id)}
                      className="grid w-full gap-3 px-5 py-4 text-left transition hover:bg-white/[0.03] lg:grid-cols-[1.1fr_1.1fr_1fr_0.8fr_0.9fr_1.2fr_auto] lg:items-center"
                    >
                      <div>
                        <p className="text-sm text-white">{request.full_name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/28 lg:hidden">
                          {request.company_name}
                        </p>
                      </div>
                      <p className="text-sm text-white/70">{request.email}</p>
                      <p className="hidden text-sm text-white/70 lg:block">{request.company_name}</p>
                      <p className="text-sm text-white/55">{request.platforms.join(', ')}</p>
                      <p className="text-sm text-white/55">{formatDate(request.requested_at)}</p>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={request.status} />
                      </div>
                      <span className="justify-self-end text-white/45">
                        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </span>
                    </button>

                    {expanded ? (
                      <div className="border-t border-white/8 bg-[#0d1116] px-5 py-5">
                        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.22em] text-white/30">
                              Objetivo
                            </p>
                            <p className="mt-2 text-sm leading-7 text-white/70">{request.goal}</p>

                            {request.review_notes ? (
                              <div className="mt-5">
                                <p className="text-[11px] uppercase tracking-[0.22em] text-white/30">
                                  Notas internas
                                </p>
                                <p className="mt-2 text-sm leading-7 text-white/60">
                                  {request.review_notes}
                                </p>
                              </div>
                            ) : null}
                          </div>

                          <div className="space-y-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.22em] text-white/30">
                                Empresa
                              </p>
                              <p className="mt-1 text-sm text-white/70">{request.company_name}</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.22em] text-white/30">
                                Sitio web
                              </p>
                              <p className="mt-1 text-sm text-white/70">
                                {request.website_url || 'No indicado'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.22em] text-white/30">
                                Presupuesto
                              </p>
                              <p className="mt-1 text-sm text-white/70">
                                {humanizeMonthlyBudget(request.monthly_budget)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.22em] text-white/30">
                                Referencia
                              </p>
                              <p className="mt-1 text-sm text-white/70">
                                {humanizeReferralSource(request.referral_source)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {actionable ? (
                          <div className="mt-5 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => setModal({ kind: 'approve', request })}
                              className="rounded-full bg-[#E0E5EB] px-5 py-2 text-sm font-semibold text-[#101417] transition hover:bg-white"
                            >
                              Aprobar
                            </button>
                            <button
                              type="button"
                              onClick={() => setModal({ kind: 'reject', request })}
                              className="rounded-full border border-red-400/25 px-4 py-2 text-sm text-red-100 transition hover:border-red-400/40 hover:bg-red-400/10"
                            >
                              Rechazar
                            </button>
                            <button
                              type="button"
                              onClick={() => setModal({ kind: 'waitlist', request })}
                              className="rounded-full border border-sky-400/25 px-4 py-2 text-sm text-sky-100 transition hover:border-sky-400/40 hover:bg-sky-400/10"
                            >
                              Lista de espera
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {modal?.kind === 'approve' ? (
        <ModalShell
          onClose={() => !submitting && setModal(null)}
          title={`Crear cuenta para ${modal.request.full_name}`}
        >
          <div className="space-y-4">
            <p className="text-sm leading-6 text-white/60">
              Se invitará a <span className="text-white">{modal.request.email}</span> y se
              activará su workspace inicial.
            </p>

            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">
                Workspace name
              </span>
              <input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">
                Workspace slug
              </span>
              <input
                value={workspaceSlug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setWorkspaceSlug(toWorkspaceSlug(e.target.value))
                }}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">
                Plan
              </span>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as WorkspacePlan)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white"
              >
                {workspacePlanOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">
                Nota interna
              </span>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white"
                placeholder="Opcional"
              />
            </label>

            {actionError ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {actionError}
              </div>
            ) : null}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-white/70 transition hover:border-white/20 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submitApproval}
                disabled={submitting}
                className="flex flex-1 items-center justify-center rounded-xl bg-[#E0E5EB] px-4 py-3 text-sm font-bold text-[#101417] transition hover:bg-white disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar aprobación'}
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {modal?.kind === 'reject' ? (
        <ModalShell onClose={() => !submitting && setModal(null)} title="Rechazar solicitud">
          <div className="space-y-4">
            <p className="text-sm leading-6 text-white/60">
              Se enviará un correo amable a <span className="text-white">{modal.request.email}</span>.
            </p>

            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">
                Nota interna
              </span>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white"
                placeholder="Opcional"
              />
            </label>

            {actionError ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {actionError}
              </div>
            ) : null}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-white/70 transition hover:border-white/20 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => submitReview('rejected')}
                disabled={submitting}
                className="flex flex-1 items-center justify-center rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100 transition hover:bg-red-500/15 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {modal?.kind === 'waitlist' ? (
        <ModalShell onClose={() => !submitting && setModal(null)} title="Mover a lista de espera">
          <div className="space-y-4">
            <p className="text-sm leading-6 text-white/60">
              La solicitud quedará marcada para seguimiento interno sin crear aún la cuenta.
            </p>

            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">
                Nota interna
              </span>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white"
                placeholder="Opcional"
              />
            </label>

            {actionError ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {actionError}
              </div>
            ) : null}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-white/70 transition hover:border-white/20 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => submitReview('waitlisted')}
                disabled={submitting}
                className="flex flex-1 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-500/10 px-4 py-3 text-sm text-sky-100 transition hover:bg-sky-500/15 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar en lista'}
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}
    </>
  )
}
