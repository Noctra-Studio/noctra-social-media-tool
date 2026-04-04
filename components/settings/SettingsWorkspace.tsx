'use client'

import { useMemo, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { AccountSettingsForm } from '@/components/settings/AccountSettingsForm'
import { BrandVoiceSettingsForm } from '@/components/settings/BrandVoiceSettingsForm'
import { SocialAccountsSettings } from '@/components/settings/SocialAccountsSettings'
import { StrategySettingsForm } from '@/components/settings/StrategySettingsForm'
import { TextStylesSettings } from '@/components/settings/TextStylesSettings'
import { WorkspaceBrandsManager } from '@/components/settings/WorkspaceBrandsManager'
import type { AssistanceLevel } from '@/lib/product'
import type { SocialConnectionRow } from '@/types/social'

type SettingsWorkspaceProps = {
  initialAccountsNotice?: {
    kind: 'error' | 'success'
    message: string
  } | null
  initialAvatarUrl: string
  initialAssistanceLevel: AssistanceLevel
  initialConnections: SocialConnectionRow[]
  initialEmail: string
  initialName: string
  initialSection?: 'account' | 'studio'
  initialTab?: 'accounts' | 'assistance' | 'brands' | 'strategy' | 'voice' | 'text-styles'
}

const sections = [
  { key: 'account', label: 'Cuenta' },
  { key: 'studio', label: 'Estudio' },
] as const

const tabs = [
  { key: 'accounts', label: 'Cuentas' },
  { key: 'voice', label: 'Voz de marca' },
  { key: 'brands', label: 'Marcas' },
  { key: 'assistance', label: 'Nivel de asistencia' },
  { key: 'strategy', label: 'Estrategia' },
  { key: 'text-styles', label: 'Estilos de texto' },
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

export function SettingsWorkspace({
  initialAccountsNotice = null,
  initialAvatarUrl,
  initialAssistanceLevel,
  initialConnections,
  initialEmail,
  initialName,
  initialSection = 'studio',
  initialTab = 'voice',
}: SettingsWorkspaceProps) {
  const [activeSection, setActiveSection] = useState<(typeof sections)[number]['key']>(initialSection)
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['key']>(initialTab)
  const [assistanceLevel, setAssistanceLevel] = useState<AssistanceLevel>(initialAssistanceLevel)
  const [savingAssistance, setSavingAssistance] = useState(false)
  const [assistanceMessage, setAssistanceMessage] = useState<string | null>(null)

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

        {activeSection === 'studio' && activeTab === 'brands' && <WorkspaceBrandsManager />}

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

        {activeSection === 'studio' && activeTab === 'accounts' && (
          <SocialAccountsSettings
            initialConnections={initialConnections}
            initialNotice={initialAccountsNotice}
          />
        )}

        {activeSection === 'studio' && activeTab === 'strategy' && (
          <div className="mx-auto w-full max-w-[1080px]">
            <StrategySettingsForm />
          </div>
        )}

        {activeSection === 'studio' && activeTab === 'text-styles' && (
          <div className="mx-auto w-full max-w-[1080px]">
            <TextStylesSettings />
          </div>
        )}
      </section>
    </div>
  )
}
