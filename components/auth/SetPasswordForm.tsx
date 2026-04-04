'use client'

import { useRef, useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getSupabasePublicConfig } from '@/lib/supabase/config'

export function SetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  
  const submitForm = () => {
    if (!loading) {
      formRef.current?.requestSubmit()
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    
    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.')
      return
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        setErrorMsg(error.message)
        return
      }

      // Notificar al admin de Noctra que el usuario ya configuro su cuenta
      await fetch('/api/auth/notify-setup', { method: 'POST' })

      // Redirect to onboarding
      window.location.assign('/onboarding')
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'No fue posible actualizar la contraseña. Por favor, intenta de nuevo.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleUpdate} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-xs uppercase tracking-[0.22em] text-[#4E576A]">Nueva contraseña</span>
        <input
          type="password"
          placeholder="••••••••"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          className="w-full rounded-2xl border border-white/10 bg-[#101417]/80 px-4 py-3.5 text-base text-[#E0E5EB] placeholder:text-[#4E576A] transition-colors focus:border-[#E0E5EB]/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-xs uppercase tracking-[0.22em] text-[#4E576A]">Confirma tu contraseña</span>
        <input
          type="password"
          placeholder="••••••••"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submitForm()
            }
          }}
          className="w-full rounded-2xl border border-white/10 bg-[#101417]/80 px-4 py-3.5 text-base text-[#E0E5EB] placeholder:text-[#4E576A] transition-colors focus:border-[#E0E5EB]/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>

      {errorMsg ? (
        <div
          role="alert"
          className="rounded-2xl border border-[#462D6E]/60 bg-[#462D6E]/12 px-4 py-3 text-sm leading-6 text-[#E0E5EB]"
        >
          {errorMsg}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-[#E0E5EB] px-4 py-3.5 text-sm font-medium uppercase tracking-[0.14em] text-[#101417] transition duration-200 hover:bg-white disabled:cursor-not-allowed disabled:bg-[#E0E5EB]/50"
        style={{ fontFamily: 'var(--font-brand-display)' }}
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : 'Guardar y Continuar'}
      </button>
    </form>
  )
}
