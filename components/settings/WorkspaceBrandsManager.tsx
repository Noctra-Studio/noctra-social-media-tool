'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Building2, Check, Loader2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useWorkspace } from '@/contexts/WorkspaceContext'

type BrandWorkspace = {
  id: string
  is_active: boolean
  name: string
  plan: string
  plan_label: string
  slug: string
  status: string
}

type BrandSummary = {
  activeWorkspace: {
    id: string
    name: string
    plan: string
    plan_label: string
    role: string | null
    status: string
  }
  can_create: boolean
  can_manage: boolean
  limit: number | null
  limit_label: string
  normalized_plan: 'founder' | 'studio' | 'agency' | 'enterprise'
  owned_count: number
  override: number | null
  remaining_slots: number | null
  workspaces: BrandWorkspace[]
}

const planCopy = {
  agency: {
    accent: 'text-cyan-200',
    badge: 'Operación multi-marca consolidada',
    note: 'Tu plan Agencia habilita hasta 10 marcas activas dentro del mismo dashboard.',
  },
  enterprise: {
    accent: 'text-amber-200',
    badge: 'Capacidad empresarial a medida',
    note: 'Enterprise escala contigo. Si necesitas más marcas, definimos el cupo exacto según tu operación.',
  },
  founder: {
    accent: 'text-emerald-200',
    badge: 'Operación enfocada en una sola marca',
    note: 'Fundador está pensado para una marca principal y un flujo editorial muy enfocado.',
  },
  studio: {
    accent: 'text-violet-200',
    badge: 'Equipo pequeño con varias marcas',
    note: 'Estudio permite operar hasta 3 marcas con el mismo sistema editorial.',
  },
} as const

export function WorkspaceBrandsManager() {
  const router = useRouter()
  const { reloadWorkspaces } = useWorkspace()
  const [summary, setSummary] = useState<BrandSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '' })
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    void loadSummary()
  }, [])

  async function loadSummary() {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/workspace/brands', {
        method: 'GET',
        cache: 'no-store',
      })

      const data = (await response.json()) as BrandSummary & { error?: string }

      if (!response.ok) {
        throw new Error(data.error || 'No fue posible cargar las marcas.')
      }

      setSummary(data)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No fue posible cargar las marcas.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreateBrand(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage(null)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/workspace/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug || undefined,
        }),
      })

      const data = (await response.json()) as {
        error?: string
        summary?: BrandSummary
        workspace?: { id: string; name: string }
      }

      if (!response.ok || !data.summary || !data.workspace) {
        throw new Error(data.error || 'No fue posible crear la marca.')
      }

      setSummary(data.summary)
      setForm({ name: '', slug: '' })
      setMessage(`Marca creada: ${data.workspace.name}. Ahora es tu workspace activo.`)
      await reloadWorkspaces(data.workspace.id)
      router.refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible crear la marca.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentPlanTone = useMemo(() => {
    if (!summary) {
      return planCopy.founder
    }

    return planCopy[summary.normalized_plan]
  }, [summary])

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-[28px] border border-white/10 bg-transparent">
        <Loader2 className="h-5 w-5 animate-spin text-[#8D95A6]" />
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="rounded-[28px] border border-rose-400/15 bg-rose-400/5 p-6 text-sm text-rose-100">
        {errorMessage || 'No fue posible cargar la sección de marcas.'}
      </div>
    )
  }

  const enterpriseNeedsSales = summary.normalized_plan !== 'enterprise' && !summary.can_create

  return (
    <div className="mx-auto w-full max-w-[1080px] space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[30px] border border-white/10 bg-[#11161E] p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#4E576A]">Marcas</p>
              <h2
                className="mt-3 text-3xl font-medium text-[#E0E5EB]"
                style={{ fontFamily: 'var(--font-brand-display)' }}
              >
                Gestiona múltiples marcas desde el mismo dashboard
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8D95A6]">
                Cada marca vive en su propio workspace y mantiene aislados su voz, estrategia, ideas y posts.
              </p>
            </div>
            <span className={`rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium ${currentPlanTone.accent}`}>
              {summary.activeWorkspace.plan_label}
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-transparent p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#4E576A]">Marcas activas</p>
              <p className="mt-3 text-3xl text-[#E0E5EB]">{summary.owned_count}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-transparent p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#4E576A]">Capacidad</p>
              <p className="mt-3 text-3xl text-[#E0E5EB]">{summary.limit_label}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-transparent p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#4E576A]">Disponibles</p>
              <p className="mt-3 text-3xl text-[#E0E5EB]">
                {summary.remaining_slots == null ? 'Custom' : summary.remaining_slots}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-4">
            <p className={`text-sm font-medium ${currentPlanTone.accent}`}>{currentPlanTone.badge}</p>
            <p className="mt-2 text-sm leading-6 text-[#8D95A6]">{currentPlanTone.note}</p>
            {summary.override ? (
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[#8D95A6]">
                Override activo: hasta {summary.override} marcas
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-transparent p-6 sm:p-7">
          <p className="text-xs uppercase tracking-[0.24em] text-[#4E576A]">Agregar marca</p>
          <h3
            className="mt-3 text-2xl font-medium text-[#E0E5EB]"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            Crea un nuevo workspace para otra marca
          </h3>
          <p className="mt-3 text-sm leading-6 text-[#8D95A6]">
            La nueva marca hereda el plan del workspace actual y se vuelve tu workspace activo al crearla.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleCreateBrand}>
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8D95A6]">
                Nombre de la marca
              </span>
              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Ej. Valtru Interiorismo"
                disabled={isSubmitting || !summary.can_manage || !summary.can_create}
                className="rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm text-[#E0E5EB] placeholder:text-[#4E576A] focus:outline-none focus:ring-2 focus:ring-[#E0E5EB]/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8D95A6]">
                Slug opcional
              </span>
              <input
                type="text"
                value={form.slug}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    slug: event.target.value.toLowerCase(),
                  }))
                }
                placeholder="valtru-interiorismo"
                disabled={isSubmitting || !summary.can_manage || !summary.can_create}
                className="rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm text-[#E0E5EB] placeholder:text-[#4E576A] focus:outline-none focus:ring-2 focus:ring-[#E0E5EB]/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting || !summary.can_manage || !summary.can_create}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-medium text-[#101417] transition-colors hover:bg-[#E0E5EB] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/10 disabled:text-[#8D95A6]"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Crear nueva marca
            </button>
          </form>

          {!summary.can_manage ? (
            <p className="mt-4 text-sm text-amber-100">
              Necesitas rol owner o admin en el workspace activo para agregar nuevas marcas.
            </p>
          ) : null}

          {enterpriseNeedsSales ? (
            <a
              href="mailto:hello@noctra.studio?subject=Enterprise%20Noctra%20Social"
              className="mt-5 inline-flex items-center gap-2 text-sm text-[#E0E5EB] transition-colors hover:text-white"
            >
              Hablar con ventas para Enterprise
              <ArrowUpRight className="h-4 w-4" />
            </a>
          ) : null}

          {message ? (
            <p className="mt-4 text-sm text-emerald-100">{message}</p>
          ) : null}

          {errorMessage ? (
            <p className="mt-4 text-sm text-rose-200">{errorMessage}</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-[30px] border border-white/10 bg-transparent p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#4E576A]">Tus marcas</p>
            <h3
              className="mt-2 text-2xl font-medium text-[#E0E5EB]"
              style={{ fontFamily: 'var(--font-brand-display)' }}
            >
              Workspaces que ya controlas
            </h3>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-[#8D95A6]">
            {summary.owned_count} activas
          </span>
        </div>

        <div className="mt-6 grid gap-3">
          {summary.workspaces.map((workspace) => (
            <div
              key={workspace.id}
              className={`flex flex-col gap-4 rounded-[24px] border p-4 sm:flex-row sm:items-center sm:justify-between ${
                workspace.is_active
                  ? 'border-white/25 bg-white/[0.04]'
                  : 'border-white/10 bg-transparent'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#11161E] text-[#8D95A6]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-medium text-[#E0E5EB]">{workspace.name}</p>
                    {workspace.is_active ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-emerald-100">
                        <Check className="h-3 w-3" />
                        Activa
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-[#8D95A6]">
                    {workspace.slug} · {workspace.plan_label}
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#8D95A6]">
                {workspace.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
