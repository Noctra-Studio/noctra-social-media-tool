'use client'

import { useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getSupabasePublicConfig } from '@/lib/supabase/config'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const supabaseConfig = getSupabasePublicConfig()
  const isSupabaseReady = supabaseConfig.isConfigured
  const isBusy = loading

  const submitLoginForm = () => {
    if (!isBusy) {
      formRef.current?.requestSubmit()
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!isSupabaseReady) {
      setErrorMsg(`${supabaseConfig.message} Ahora mismo el proyecto solo tiene .env.example.`)
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMsg(error.message)
        return
      }

      // Redirect to the home page, the middleware will now correctly route
      // to either /compose (dashboard) or /onboarding based on the user's state.
      window.location.assign('/')
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'No fue posible iniciar sesión. Revisa la configuración de Supabase e inténtalo de nuevo.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {!isSupabaseReady ? (
        <div className="mb-5 rounded-2xl border border-[#4E576A] bg-[#212631]/70 px-4 py-3 text-sm leading-6 text-[#E0E5EB]">
          <p className="font-medium">Supabase aún no está configurado.</p>
          <p className="mt-1 text-[#A7AFBD]">{supabaseConfig.message}</p>
        </div>
      ) : null}

      <form ref={formRef} onSubmit={handleLogin} className="space-y-4">
        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-[0.22em] text-[#4E576A]">Correo</span>
          <input
            type="email"
            placeholder="tu@noctra.studio"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isBusy}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submitLoginForm()
              }
            }}
            className="w-full rounded-2xl border border-white/10 bg-[#101417]/80 px-4 py-3.5 text-base text-[#E0E5EB] placeholder:text-[#4E576A] transition-colors focus:border-[#E0E5EB]/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-[0.22em] text-[#4E576A]">Contraseña</span>
          <input
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isBusy}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submitLoginForm()
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
          disabled={isBusy}
          className="flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-[#E0E5EB] px-4 py-3.5 text-sm font-medium uppercase tracking-[0.14em] text-[#101417] transition duration-200 hover:bg-white disabled:cursor-not-allowed disabled:bg-[#E0E5EB]/50"
          style={{ fontFamily: 'var(--font-brand-display)' }}
        >
          {isBusy ? <Loader2 className="animate-spin" size={18} /> : 'Iniciar sesión'}
        </button>
      </form>
    </>
  )
}
