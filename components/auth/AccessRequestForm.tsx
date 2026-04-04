'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Loader2 } from 'lucide-react'
import {
  accessRequestSchema,
  type AccessRequestFormData,
  type AccessRequestFormValues,
} from '@/lib/early-access/schema'
import {
  monthlyBudgetOptions,
  platformOptions,
  referralSourceOptions,
} from '@/lib/early-access/utils'
import { cn } from '@/lib/utils'

const inputClassName =
  'w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-white/25'
const errorClassName = 'mt-1 text-xs text-red-400'

export function AccessRequestForm() {
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [submitError, setSubmitError] = useState('')
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<AccessRequestFormValues, unknown, AccessRequestFormData>({
    defaultValues: {
      monthly_budget: undefined,
      platforms: [],
      referral_source: undefined,
      website_url: '',
    },
    resolver: zodResolver(accessRequestSchema),
  })


  async function onSubmit(data: AccessRequestFormData) {
    setSubmitError('')

    const response = await fetch('/api/auth/request-access', {
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })

    const result = (await response.json().catch(() => ({}))) as { error?: string }

    if (!response.ok) {
      setSubmitError(result.error ?? 'No fue posible enviar tu solicitud.')
      return
    }

    setSubmittedEmail(data.email)
    setSubmitted(true)
    reset()
  }

  if (submitted) {
    return (
      <div className="space-y-4 py-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
          <Check className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-light text-white">Solicitud recibida</h2>
        <p className="text-sm leading-relaxed text-white/60">
          Revisaremos tu solicitud y nos comunicaremos a{' '}
          <span className="text-white">{submittedEmail}</span> en los próximos 2-3 días
          hábiles.
        </p>
        <p className="text-xs text-white/30">Si tienes urgencia, escríbenos a hello@noctra.studio</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">
            Nombre completo
          </span>
          <input
            {...register('full_name')}
            className={inputClassName}
            placeholder="Tu nombre"
          />
          {errors.full_name ? <p className={errorClassName}>{errors.full_name.message}</p> : null}
        </label>

        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">
            Email
          </span>
          <input
            {...register('email')}
            type="email"
            className={inputClassName}
            placeholder="tu@empresa.com"
          />
          {errors.email ? <p className={errorClassName}>{errors.email.message}</p> : null}
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">
          Empresa o Marca
        </span>
        <input
          {...register('company_name')}
          className={inputClassName}
          placeholder="Nombre de tu marca"
        />
        {errors.company_name ? (
          <p className={errorClassName}>{errors.company_name.message}</p>
        ) : null}
      </label>

      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">
          Mensaje opcional
        </span>
        <textarea
          {...register('goal')}
          rows={2}
          className={cn(inputClassName, 'resize-none')}
          placeholder="Dinos brevemente qué esperas de Noctra Social."
        />
        {errors.goal ? <p className={errorClassName}>{errors.goal.message}</p> : null}
      </label>

      {submitError ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {submitError}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-[#E0E5EB] px-4 py-3 text-sm font-medium uppercase tracking-[0.14em] text-[#101417] transition duration-200 hover:bg-white disabled:cursor-not-allowed disabled:bg-[#E0E5EB]/50"
        style={{ fontFamily: 'var(--font-brand-display)' }}
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar solicitud'}
      </button>

      <p className="text-center text-[10px] text-white/20">
        Revisamos las solicitudes manualmente en un plazo de 24-48h.
      </p>
    </form>
  )
}
