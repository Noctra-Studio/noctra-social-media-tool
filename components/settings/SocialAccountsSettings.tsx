'use client'

import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckCircle2, ExternalLink, Loader2, RefreshCcw, Unplug } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatSocialPlatformLabel } from '@/lib/social/platforms'
import type { SocialConnectionRow, SocialMetricPlatform } from '@/types/social'

type SocialAccountsSettingsProps = {
  initialConnections: SocialConnectionRow[]
  initialNotice?: {
    kind: 'error' | 'success'
    message: string
  } | null
}

const platforms: Array<{
  description: string
  key: SocialMetricPlatform
  syncHint: string
}> = [
  {
    key: 'instagram',
    description: 'Lee perfil y métricas de publicaciones para aprender qué formatos y hooks funcionan mejor.',
    syncHint: 'Sincroniza impresiones, reach, likes, comentarios, shares y saves.',
  },
  {
    key: 'linkedin',
    description: 'Conecta tu perfil y, si tienes acceso de admin, las métricas de tu página o posts de organización.',
    syncHint: 'Sincroniza impresiones, clicks, comentarios, reacciones y shares.',
  },
  {
    key: 'x',
    description: 'Trae el rendimiento de tus posts para comparar conversación, alcance e interacción.',
    syncHint: 'Sincroniza likes, replies, reposts e impresiones cuando la API las expone.',
  },
] as const

function PlatformIcon({ platform }: { platform: SocialMetricPlatform }) {
  if (platform === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
        <rect x="3.75" y="3.75" width="16.5" height="16.5" rx="5.25" />
        <circle cx="12" cy="12" r="3.5" />
        <circle cx="17.3" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    )
  }

  if (platform === 'linkedin') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
        <path d="M6.26 8.28a1.52 1.52 0 1 0 0-3.04 1.52 1.52 0 0 0 0 3.04ZM4.96 9.84h2.6v8.35h-2.6V9.84Zm4.23 0h2.5v1.14h.04c.35-.66 1.2-1.35 2.48-1.35 2.66 0 3.15 1.75 3.15 4.02v4.54h-2.6v-4.03c0-.96-.02-2.2-1.34-2.2-1.35 0-1.56 1.05-1.56 2.13v4.1h-2.6V9.84Z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="m5.53 4.5 5.09 6.82L5.5 19.5h1.88l4.08-6.2 4.63 6.2h4.41l-5.38-7.2 4.76-7.8H18l-3.75 5.86L9.91 4.5H5.53Zm2.78 1.5h.87l8.01 12h-.87l-8-12Z" />
    </svg>
  )
}

function formatLastSync(value: string | null) {
  if (!value) {
    return 'Aún no has sincronizado métricas.'
  }

  return `Última sincronización: ${formatDistanceToNow(new Date(value), {
    addSuffix: true,
    locale: es,
  })}`
}

export function SocialAccountsSettings({
  initialConnections,
  initialNotice = null,
}: SocialAccountsSettingsProps) {
  const router = useRouter()
  const [connections, setConnections] = useState(initialConnections)
  const [notice, setNotice] = useState(initialNotice)
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  const connectionByPlatform = useMemo(
    () =>
      new Map(connections.map((connection) => [connection.platform, connection] as const)),
    [connections]
  )

  async function handleSync(platform: SocialMetricPlatform) {
    setPendingAction(`sync:${platform}`)
    setNotice(null)

    try {
      const response = await fetch('/api/metrics/sync', {
        body: JSON.stringify({ platform }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const data = (await response.json()) as {
        error?: string
        failed?: number
        synced?: number
      }

      if (!response.ok) {
        throw new Error(data.error || 'No fue posible sincronizar las métricas.')
      }

      setConnections((current) =>
        current.map((connection) =>
          connection.platform === platform
            ? { ...connection, last_synced_at: new Date().toISOString() }
            : connection
        )
      )
      setNotice({
        kind: 'success',
        message:
          data.synced && data.synced > 0
            ? `Se sincronizaron ${data.synced} post${data.synced === 1 ? '' : 's'} de ${formatSocialPlatformLabel(platform)}.`
            : `No encontramos posts publicados con ID externo para ${formatSocialPlatformLabel(platform)}.`,
      })
      router.refresh()
    } catch (error) {
      setNotice({
        kind: 'error',
        message: error instanceof Error ? error.message : 'No fue posible sincronizar las métricas.',
      })
    } finally {
      setPendingAction(null)
    }
  }

  async function handleDisconnect(platform: SocialMetricPlatform) {
    setPendingAction(`disconnect:${platform}`)
    setNotice(null)

    try {
      const response = await fetch(`/api/social/connections/${platform}`, {
        method: 'DELETE',
      })
      const data = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(data.error || 'No fue posible desconectar la cuenta.')
      }

      setConnections((current) => current.filter((connection) => connection.platform !== platform))
      setNotice({
        kind: 'success',
        message: `${formatSocialPlatformLabel(platform)} se desconectó del workspace actual.`,
      })
      router.refresh()
    } catch (error) {
      setNotice({
        kind: 'error',
        message: error instanceof Error ? error.message : 'No fue posible desconectar la cuenta.',
      })
    } finally {
      setPendingAction(null)
    }
  }

  function handleConnect(platform: SocialMetricPlatform) {
    setPendingAction(`connect:${platform}`)
    window.location.href = `/api/auth/social/${platform}`
  }

  return (
    <div className="mx-auto w-full max-w-[1080px] space-y-6">
      <div className="space-y-3">
        <p
          className="text-2xl font-medium text-[#E0E5EB]"
          style={{ fontFamily: 'var(--font-brand-display)' }}
        >
          Conecta tus cuentas de redes sociales
        </p>
        <p className="max-w-2xl text-sm leading-6 text-[#8D95A6]">
          Conectar tus cuentas permite a Noctra Social obtener las métricas de tus publicaciones,
          detectar patrones de rendimiento y refinar el sistema editorial con datos reales.
        </p>
      </div>

      {notice ? (
        <div
          className={`rounded-[24px] border px-4 py-3 text-sm ${
            notice.kind === 'success'
              ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100'
              : 'border-rose-400/20 bg-rose-400/10 text-rose-100'
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      <div className="grid gap-4">
        {platforms.map((platform) => {
          const connection = connectionByPlatform.get(platform.key)
          const isConnecting = pendingAction === `connect:${platform.key}`
          const isSyncing = pendingAction === `sync:${platform.key}`
          const isDisconnecting = pendingAction === `disconnect:${platform.key}`

          return (
            <article
              key={platform.key}
              className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,#171C24,#11161D)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#E0E5EB]">
                    <PlatformIcon platform={platform.key} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className="text-lg font-medium text-[#E0E5EB]"
                        style={{ fontFamily: 'var(--font-brand-display)' }}
                      >
                        {formatSocialPlatformLabel(platform.key)}
                      </p>
                      {connection ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-100">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Conectada
                        </span>
                      ) : null}
                    </div>

                    <p className="max-w-2xl text-sm leading-6 text-[#8D95A6]">
                      {platform.description}
                    </p>

                    {connection ? (
                      <div className="space-y-1 text-sm text-[#D7DCE4]">
                        <p>{connection.account_name || 'Cuenta conectada'}</p>
                        <p className="text-[#8D95A6]">{formatLastSync(connection.last_synced_at)}</p>
                      </div>
                    ) : (
                      <div className="space-y-1 text-sm">
                        <p className="text-[#D7DCE4]">No conectada</p>
                        <p className="text-[#8D95A6]">{platform.syncHint}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {connection ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void handleSync(platform.key)}
                        disabled={Boolean(pendingAction)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5 disabled:opacity-60"
                      >
                        {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                        Sincronizar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDisconnect(platform.key)}
                        disabled={Boolean(pendingAction)}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm text-rose-100 transition-colors hover:bg-rose-400/15 disabled:opacity-60"
                      >
                        {isDisconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4" />}
                        Desconectar
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleConnect(platform.key)}
                      disabled={Boolean(pendingAction)}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/[0.08] disabled:opacity-60"
                    >
                      {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                      Conectar cuenta
                    </button>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
