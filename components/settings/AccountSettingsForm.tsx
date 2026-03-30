'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Check, Loader2, Save } from 'lucide-react'
import { LocaleToggle } from '@/components/landing/locale-toggle'
import { createClient } from '@/lib/supabase/client'
import { getSupabasePublicConfig } from '@/lib/supabase/config'

type AccountSettingsFormProps = {
  initialAvatarUrl: string
  initialEmail: string
  initialName: string
}

function getAccountErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  if (typeof error === 'string' && error.trim()) {
    return error
  }

  if (typeof error === 'object' && error !== null) {
    const record = error as Record<string, unknown>

    if (typeof record.message === 'string' && record.message.trim()) {
      return record.message
    }

    if (typeof record.error_description === 'string' && record.error_description.trim()) {
      return record.error_description
    }

    if (record.code === 'same_password') {
      return 'La nueva contraseña debe ser distinta a la actual.'
    }
  }

  return fallback
}

function isMissingProfilesTableError(error: unknown) {
  const message = getAccountErrorMessage(error, '')

  return (
    message.includes("Could not find the table 'public.profiles'") ||
    message.includes('relation "profiles" does not exist')
  )
}

export function AccountSettingsForm({
  initialAvatarUrl,
  initialEmail,
  initialName,
}: AccountSettingsFormProps) {
  const t = useTranslations('dashboard.locale')
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')

  const previewInitial = (name || email || 'N').trim().charAt(0).toUpperCase()

  const handleAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setSaveState('error')
      setMessage('Selecciona una imagen válida para el avatar.')
      event.target.value = ''
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setSaveState('error')
      setMessage('La imagen debe pesar menos de 2 MB.')
      event.target.value = ''
      return
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
    }

    const nextAvatarUrl = URL.createObjectURL(file)

    setAvatarFile(file)
    setAvatarUrl(nextAvatarUrl)
    previewUrlRef.current = nextAvatarUrl
    setSaveState('idle')
    setMessage(null)

    event.target.value = ''
  }

  const save = async () => {
    setSaving(true)
    setMessage(null)
    setSaveState('idle')

    try {
      if (newPassword.trim() && !currentPassword.trim()) {
        throw new Error('Escribe tu contraseña actual para confirmar el cambio.')
      }

      if (newPassword.trim()) {
        const config = getSupabasePublicConfig()

        if (!config.url || !config.anonKey) {
          throw new Error(config.message)
        }

        const verificationClient = createSupabaseClient(config.url, config.anonKey, {
          auth: {
            autoRefreshToken: false,
            detectSessionInUrl: false,
            persistSession: false,
          },
        })

        const { error: verificationError } = await verificationClient.auth.signInWithPassword({
          email: initialEmail,
          password: currentPassword,
        })

        if (verificationError) {
          throw new Error('La contraseña actual no es correcta.')
        }
      }

      let nextAvatarUrl = avatarUrl.trim()

      if (avatarFile) {
        const formData = new FormData()
        formData.append('file', avatarFile)

        const response = await fetch('/api/account/avatar', {
          method: 'POST',
          body: formData,
        })

        const data = (await response.json()) as { error?: string; url?: string }

        if (!response.ok || !data.url) {
          throw new Error(data.error || 'No fue posible subir la imagen del avatar.')
        }

        nextAvatarUrl = data.url
      }

      const payload: {
        data: { avatar_url: string; full_name: string }
        email?: string
        password?: string
      } = {
        data: {
          avatar_url: nextAvatarUrl,
          full_name: name.trim(),
        },
      }

      if (email.trim() && email.trim() !== initialEmail) {
        payload.email = email.trim()
      }

      if (newPassword.trim()) {
        payload.password = newPassword.trim()
      }

      const { error } = await supabase.auth.updateUser(payload)

      if (error) {
        throw error
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (user) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          email: payload.email ?? user.email ?? initialEmail,
          full_name: name.trim(),
          id: user.id,
        }, { onConflict: 'id' })

        if (profileError && !isMissingProfilesTableError(profileError)) {
          throw profileError
        }
      }

      setMessage(
        payload.email
          ? 'Cuenta actualizada. Revisa tu correo si Supabase requiere confirmar el nuevo email.'
          : 'Cuenta actualizada.'
      )
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
      }
      setAvatarFile(null)
      setAvatarUrl(nextAvatarUrl)
      setCurrentPassword('')
      setNewPassword('')
      setSaveState('saved')
      router.refresh()
    } catch (error) {
      setMessage(getAccountErrorMessage(error, 'No fue posible actualizar la cuenta.'))
      setSaveState('error')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <p
          className="text-2xl font-medium text-[#E0E5EB]"
          style={{ fontFamily: 'var(--font-brand-display)' }}
        >
          Perfil y cuenta
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8D95A6]">
          Gestiona tus datos personales, la imagen visible de tu cuenta y el acceso al estudio.
        </p>
      </div>

      <div className="rounded-[28px] border border-white/10 p-5">
        <p className="text-xs font-semibold tracking-[0.16em] text-zinc-400">{t('label').toUpperCase()}</p>
        <div className="mt-4">
          <LocaleToggle />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-[28px] border border-white/10 p-5">
          <p className="text-xs font-semibold tracking-[0.16em] text-zinc-400">IMAGEN DE PERFIL</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-18 w-18 overflow-hidden rounded-full border border-white/10">
              {avatarUrl.trim() ? (
                <Image src={avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-white">
                  {previewInitial}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#E0E5EB]">{name || 'Sin nombre'}</p>
              <p className="truncate text-xs text-zinc-500">{email}</p>
            </div>
          </div>
          <label className="mt-5 grid gap-2">
            <span className="text-xs font-semibold tracking-[0.16em] text-zinc-400">IMAGEN DEL AVATAR</span>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              onChange={(event) => void handleAvatarFileChange(event)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="inline-flex w-fit items-center rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5"
            >
              {avatarUrl.trim() ? 'Cambiar imagen' : 'Subir imagen'}
            </button>
            <span className="text-xs text-zinc-500">
              Sube un archivo PNG, JPG, WEBP o AVIF de hasta 2 MB.
            </span>
          </label>
        </div>

        <div className="grid gap-5">
          <label className="grid gap-2">
            <span className="mb-1 text-xs font-semibold tracking-[0.16em] text-zinc-400">NOMBRE</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Tu nombre o nombre del estudio"
              className="rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm text-[#E0E5EB] placeholder:text-[#4E576A] focus:outline-none focus:ring-2 focus:ring-[#E0E5EB]/10"
            />
            <span className="text-xs text-zinc-500">
              Este nombre puede usarse en tu perfil y en futuras personalizaciones del estudio.
            </span>
          </label>

          <label className="grid gap-2">
            <span className="mb-1 text-xs font-semibold tracking-[0.16em] text-zinc-400">EMAIL</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@email.com"
              className="rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm text-[#E0E5EB] placeholder:text-[#4E576A] focus:outline-none focus:ring-2 focus:ring-[#E0E5EB]/10"
            />
            <span className="text-xs text-zinc-500">
              Si cambias el email, es posible que se requiera confirmación antes de usarlo.
            </span>
          </label>

          <label className="grid gap-2">
            <span className="mb-1 text-xs font-semibold tracking-[0.16em] text-zinc-400">
              CONTRASEÑA ACTUAL
            </span>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Obligatoria si quieres cambiar la contraseña"
              className="rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm text-[#E0E5EB] placeholder:text-[#4E576A] focus:outline-none focus:ring-2 focus:ring-[#E0E5EB]/10"
            />
            <span className="text-xs text-zinc-500">
              Solo la usamos para validar el cambio antes de actualizar tu contraseña.
            </span>
          </label>

          <label className="grid gap-2">
            <span className="mb-1 text-xs font-semibold tracking-[0.16em] text-zinc-400">
              NUEVA CONTRASEÑA
            </span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Deja este campo vacío si no quieres cambiarla"
              className="rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm text-[#E0E5EB] placeholder:text-[#4E576A] focus:outline-none focus:ring-2 focus:ring-[#E0E5EB]/10"
            />
            <span className="text-xs text-zinc-500">
              Usa una contraseña robusta. Solo se actualizará si escribes una nueva.
            </span>
          </label>
        </div>
      </div>

      <div className="mt-2 rounded-[24px] border-t border-white/8 pt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-5 text-sm">
            {message ? (
              <p className={saveState === 'error' ? 'text-[#F6B3B3]' : 'text-[#8D95A6]'}>{message}</p>
            ) : (
              <p className="text-[#8D95A6]">Mantén separados tus ajustes personales y los del estudio.</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {saveState === 'saved' && !saving && (
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                <Check className="h-3.5 w-3.5" />
                Guardado
              </span>
            )}
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-[#E0E5EB] px-5 py-2.5 text-sm text-[#101417] transition-colors hover:bg-white disabled:opacity-60"
              style={{ fontFamily: 'var(--font-brand-display)' }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saveState === 'saved' ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saving ? 'Guardando...' : saveState === 'saved' ? 'Guardado' : 'Guardar cuenta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
