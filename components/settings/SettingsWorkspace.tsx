'use client'

import { useMemo, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { AccountSettingsForm } from '@/components/settings/AccountSettingsForm'
import { BrandVoiceSettingsForm } from '@/components/settings/BrandVoiceSettingsForm'
import type { Platform } from '@/lib/product'
import type { AssistanceLevel } from '@/lib/product'

type SettingsWorkspaceProps = {
  initialAvatarUrl: string
  initialAssistanceLevel: AssistanceLevel
  initialEmail: string
  initialName: string
  initialSocialHandles: Partial<Record<Platform, string>>
  initialSection?: 'account' | 'studio'
  initialTab?: 'assistance' | 'platforms' | 'voice'
}

const sections = [
  { key: 'account', label: 'Cuenta' },
  { key: 'studio', label: 'Estudio' },
] as const

const tabs = [
  { key: 'voice', label: 'Voz de marca' },
  { key: 'assistance', label: 'Nivel de asistencia' },
  { key: 'platforms', label: 'Plataformas' },
] as const

const assistanceOptions: Array<{
  description: string
  key: AssistanceLevel
  label: string
}> = [
  {
    key: 'guided',
    label: 'Guía completa',
    description: 'Más orientación, contexto y ayudas visibles durante la creación.',
  },
  {
    key: 'balanced',
    label: 'Balanceado',
    description: 'Un punto medio entre autonomía y acompañamiento.',
  },
  {
    key: 'expert',
    label: 'Experto',
    description: 'Menos explicaciones y una interfaz más directa.',
  },
]

const platformCards: Array<{
  description: string
  key: Platform
  label: string
}> = [
  {
    key: 'instagram',
    label: 'Instagram',
    description: 'Conecta insights del feed y del rendimiento para orientar hooks, formatos y frecuencia.',
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    description: 'Lee señales de engagement y tono para ayudarte a publicar con más autoridad y consistencia.',
  },
  {
    key: 'x',
    label: 'X',
    description: 'Ajusta hilos, ritmo y ángulos en función de lo que más conversación te genera.',
  },
]

function PlatformIcon({ platform, className }: { className?: string; platform: Platform }) {
  if (platform === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
        <rect x="3.75" y="3.75" width="16.5" height="16.5" rx="5.25" />
        <circle cx="12" cy="12" r="3.5" />
        <circle cx="17.3" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    )
  }

  if (platform === 'linkedin') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M6.26 8.28a1.52 1.52 0 1 0 0-3.04 1.52 1.52 0 0 0 0 3.04ZM4.96 9.84h2.6v8.35h-2.6V9.84Zm4.23 0h2.5v1.14h.04c.35-.66 1.2-1.35 2.48-1.35 2.66 0 3.15 1.75 3.15 4.02v4.54h-2.6v-4.03c0-.96-.02-2.2-1.34-2.2-1.35 0-1.56 1.05-1.56 2.13v4.1h-2.6V9.84Z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="m5.53 4.5 5.09 6.82L5.5 19.5h1.88l4.08-6.2 4.63 6.2h4.41l-5.38-7.2 4.76-7.8H18l-3.75 5.86L9.91 4.5H5.53Zm2.78 1.5h.87l8.01 12h-.87l-8-12Z" />
    </svg>
  )
}

export function SettingsWorkspace({
  initialAvatarUrl,
  initialAssistanceLevel,
  initialEmail,
  initialName,
  initialSocialHandles,
  initialSection = 'studio',
  initialTab = 'voice',
}: SettingsWorkspaceProps) {
  const [activeSection, setActiveSection] = useState<(typeof sections)[number]['key']>(initialSection)
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['key']>(initialTab)
  const [assistanceLevel, setAssistanceLevel] = useState<AssistanceLevel>(initialAssistanceLevel)
  const [savingAssistance, setSavingAssistance] = useState(false)
  const [assistanceMessage, setAssistanceMessage] = useState<string | null>(null)
  const [socialHandles, setSocialHandles] = useState<Partial<Record<Platform, string>>>(initialSocialHandles)
  const [savingHandle, setSavingHandle] = useState<Platform | null>(null)
  const [socialHandlesMessage, setSocialHandlesMessage] = useState<string | null>(null)

  const selectedAssistance = useMemo(
    () => assistanceOptions.find((option) => option.key === assistanceLevel) || assistanceOptions[1],
    [assistanceLevel]
  )

  const saveAssistanceLevel = async (nextLevel: AssistanceLevel) => {
    setAssistanceLevel(nextLevel)
    setSavingAssistance(true)
    setAssistanceMessage(null)

    try {
      const response = await fetch('/api/settings/assistance-level', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assistance_level: nextLevel }),
      })

      const data = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(data.error || 'No fue posible guardar el nivel de asistencia')
      }

      setAssistanceMessage('Nivel de asistencia actualizado.')
    } catch (error) {
      setAssistanceLevel(initialAssistanceLevel)
      setAssistanceMessage(
        error instanceof Error ? error.message : 'No fue posible guardar el nivel de asistencia'
      )
    } finally {
      setSavingAssistance(false)
    }
  }

  const saveSocialHandle = async (platform: Platform) => {
    setSavingHandle(platform)
    setSocialHandlesMessage(null)

    try {
      const response = await fetch('/api/settings/social-handles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          social_handles: {
            instagram: socialHandles.instagram || '',
            linkedin: socialHandles.linkedin || '',
            x: socialHandles.x || '',
          },
        }),
      })

      const data = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(data.error || 'No fue posible guardar el usuario de la plataforma')
      }

      setSocialHandlesMessage('Usuarios guardados para futuras conexiones.')
    } catch (error) {
      setSocialHandlesMessage(
        error instanceof Error ? error.message : 'No fue posible guardar el usuario de la plataforma'
      )
    } finally {
      setSavingHandle(null)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.28em] text-[#4E576A]">Configuración</p>
        <h1
          className="text-4xl font-medium text-[#E0E5EB]"
          style={{ fontFamily: 'var(--font-brand-display)' }}
        >
          Ajustes
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-[#8D95A6]">
          Separa la configuración de tu cuenta personal de la configuración editorial del estudio.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {sections.map((section) => (
          <button
            key={section.key}
            type="button"
            onClick={() => setActiveSection(section.key)}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              activeSection === section.key
                ? 'bg-white text-black'
                : 'text-zinc-500 hover:text-[#E0E5EB]'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {activeSection === 'studio' && (
        <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              activeTab === tab.key
                ? 'bg-zinc-800 px-4 py-1 font-medium text-[#E0E5EB]'
                : 'text-zinc-500 hover:text-[#E0E5EB]'
            }`}
          >
            {tab.label}
          </button>
        ))}
        </div>
      )}

      <section className="w-full rounded-[32px] border border-white/10 bg-transparent p-5 sm:p-6 md:p-7">
        {activeSection === 'account' && (
          <div className="mx-auto w-full max-w-[720px]">
            <AccountSettingsForm
              initialAvatarUrl={initialAvatarUrl}
              initialEmail={initialEmail}
              initialName={initialName}
            />
          </div>
        )}

        {activeSection === 'studio' && activeTab === 'voice' && (
          <div className="mx-auto w-full max-w-[720px]">
            <BrandVoiceSettingsForm />
          </div>
        )}

        {activeSection === 'studio' && activeTab === 'assistance' && (
          <div className="mx-auto w-full max-w-[720px] space-y-5">
            <div>
              <p
                className="text-2xl font-medium text-[#E0E5EB]"
                style={{ fontFamily: 'var(--font-brand-display)' }}
              >
                Nivel de asistencia
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8D95A6]">
                Ajusta cuánto contexto y guía debe aparecer en el flujo de creación.
              </p>
            </div>

            <div className="grid gap-3">
              {assistanceOptions.map((option) => {
                const active = assistanceLevel === option.key

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => void saveAssistanceLevel(option.key)}
                    disabled={savingAssistance}
                    className={`flex items-start justify-between gap-4 rounded-[28px] border p-5 text-left transition-colors ${
                      active
                        ? 'border border-white/40 bg-transparent'
                        : 'border-white/10 bg-transparent hover:border-white/20'
                    }`}
                  >
                    <div>
                      <p
                        className="text-lg font-medium text-[#E0E5EB]"
                        style={{ fontFamily: 'var(--font-brand-display)' }}
                      >
                        {option.label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#8D95A6]">{option.description}</p>
                    </div>
                    <div
                      className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full border ${
                        active ? 'border-white/70 bg-white' : 'border-white/15'
                      }`}
                    >
                      {active && <span className="h-2.5 w-2.5 rounded-full bg-[#101417]" />}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {savingAssistance && <Loader2 className="h-4 w-4 animate-spin text-[#8D95A6]" />}
              {assistanceMessage ? (
                <span className="text-sm text-[#8D95A6]">{assistanceMessage}</span>
              ) : null}
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
                <Check className="h-3.5 w-3.5" />
                Activo: {selectedAssistance.label}
              </span>
            </div>
          </div>
        )}

        {activeSection === 'studio' && activeTab === 'platforms' && (
          <div className="mx-auto w-full max-w-[1080px] space-y-5">
            <div>
              <p
                className="text-2xl font-medium text-[#E0E5EB]"
                style={{ fontFamily: 'var(--font-brand-display)' }}
              >
                Plataformas
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8D95A6]">
                El siguiente paso del producto será conectar cuentas y leer métricas en
                tiempo real.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {platformCards.map((platform) => (
                <div
                  key={platform.key}
                  className="rounded-[28px] border border-dashed border-[#4E576A] bg-transparent p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-transparent">
                      <PlatformIcon platform={platform.key} className="h-5 w-5 text-[#E0E5EB]" />
                    </div>
                    <span className="rounded-full border border-[#4E576A] px-2 py-0.5 text-xs text-[#4E576A]">
                      Próximamente
                    </span>
                  </div>
                  <p
                    className="mt-5 text-lg font-medium text-[#E0E5EB]"
                    style={{ fontFamily: 'var(--font-brand-display)' }}
                  >
                    {platform.label}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#8D95A6]">{platform.description}</p>
                  <label className="mt-5 grid gap-2">
                    <span className="text-xs font-semibold tracking-[0.16em] text-zinc-400">
                      Tu usuario en {platform.label}
                    </span>
                    <input
                      type="text"
                      value={socialHandles[platform.key] || ''}
                      onChange={(event) =>
                        setSocialHandles((current) => ({
                          ...current,
                          [platform.key]: event.target.value,
                        }))
                      }
                      placeholder={platform.key === 'instagram' ? '@noctra.studio' : platform.key === 'linkedin' ? 'noctra-studio' : '@noctra'}
                      className="rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm text-[#E0E5EB] placeholder:text-[#4E576A] focus:outline-none focus:ring-2 focus:ring-[#E0E5EB]/10"
                    />
                  </label>
                  <p className="mt-3 text-xs leading-5 text-zinc-500">
                    Lo usaremos para identificar tu cuenta cuando conectemos la API en una próxima versión.
                  </p>
                  <button
                    type="button"
                    onClick={() => void saveSocialHandle(platform.key)}
                    disabled={savingHandle === platform.key}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5 disabled:opacity-60"
                  >
                    {savingHandle === platform.key ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Guardar usuario
                  </button>
                </div>
              ))}
            </div>
            {socialHandlesMessage ? (
              <p className="text-sm text-[#8D95A6]">{socialHandlesMessage}</p>
            ) : null}
          </div>
        )}
      </section>
    </div>
  )
}
