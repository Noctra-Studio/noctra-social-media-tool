'use client'

import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Layers3, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type BrandAuthorityResponse = {
  consistency_score: number
  dominant_pillar: string | null
  pillar_balance: Array<{
    count: number
    percentage: number
    pillar_color: string
    pillar_id: string
    pillar_name: string
  }>
  platform_distribution: {
    instagram: number
    linkedin: number
    x: number
  }
  top_angles: Array<{
    angle: string
    count: number
  }>
  total_posts: number
  underused_pillar: string | null
  week_streak: number
}

function getScoreColor(score: number) {
  if (score >= 75) {
    return '#4ADE80'
  }

  if (score >= 50) {
    return '#FCD34D'
  }

  return '#F87171'
}

function SkeletonBlock() {
  return <div className="h-20 rounded-[20px] bg-white/5 animate-pulse" />
}

export function BrandAuthorityPanel() {
  const [data, setData] = useState<BrandAuthorityResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    async function loadAuthority() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/home/brand-authority')
        const payload = (await response.json()) as BrandAuthorityResponse & { error?: string }

        if (!response.ok) {
          throw new Error(payload.error || 'No fue posible cargar la autoridad de marca.')
        }

        if (isActive) {
          setData(payload)
        }
      } catch (loadError) {
        if (isActive) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No fue posible cargar la autoridad de marca.'
          )
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    void loadAuthority()

    return () => {
      isActive = false
    }
  }, [])

  const dominantPlatform = useMemo(() => {
    if (!data) {
      return null
    }

    return (Object.entries(data.platform_distribution) as Array<['instagram' | 'linkedin' | 'x', number]>)
      .sort((left, right) => right[1] - left[1])[0]?.[0] ?? null
  }, [data])

  const repetitiveAngle = useMemo(() => {
    if (!data || data.total_posts === 0) {
      return false
    }

    const topAngleCount = data.top_angles[0]?.count ?? 0
    return topAngleCount / data.total_posts > 0.6
  }, [data])

  if (loading) {
    return (
      <section className="rounded-[28px] border border-white/10 bg-[#212631]/40 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="h-3 w-32 rounded bg-white/5 animate-pulse" />
            <div className="h-8 w-40 rounded bg-white/5 animate-pulse" />
          </div>
          <div className="h-12 w-20 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_1fr]">
          <SkeletonBlock />
          <SkeletonBlock />
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <SkeletonBlock />
          <SkeletonBlock />
        </div>
      </section>
    )
  }

  if (error || !data) {
    return (
      <section className="rounded-[28px] border border-white/10 bg-[#212631]/40 p-6">
        <p className="text-xs uppercase tracking-widest text-[#4E576A]">Autoridad de marca</p>
        <p className="mt-3 text-sm text-[#8D95A6]">
          {error || 'No hay suficiente información para calcular métricas todavía.'}
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-[#212631]/40 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#4E576A]">Autoridad de marca</p>
          <p className="mt-3 text-sm leading-6 text-[#8D95A6]">
            Señales editoriales de las últimas 4 semanas para entender ritmo, foco y variedad.
          </p>
        </div>
        <div className="text-right">
          <p
            className="text-4xl font-medium text-[#E0E5EB]"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            {data.total_posts}
          </p>
          <p className="mt-1 text-xs text-[#8D95A6]">posts</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <div className="rounded-[24px] border border-white/10 bg-[#101417]/70 p-5">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-[#6F7786]">
            <BarChart3 className="h-3.5 w-3.5" />
            Consistency Score
          </div>
          <div className="mt-5">
            <div className="h-4 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full transition-[width,background-color] duration-500 ease-out"
                style={{
                  width: `${data.consistency_score}%`,
                  backgroundColor: getScoreColor(data.consistency_score),
                }}
              />
            </div>
            <div className="mt-4 flex items-end justify-between gap-4">
              <p
                className="text-4xl font-medium"
                style={{
                  color: getScoreColor(data.consistency_score),
                  fontFamily: 'var(--font-brand-display)',
                }}
              >
                {data.consistency_score}
              </p>
              <p className="text-sm text-[#8D95A6]">
                Consistencia editorial — últimas 4 semanas
              </p>
            </div>
            <p className="mt-2 text-xs text-[#8D95A6]">
              Racha activa: {data.week_streak} semana{data.week_streak === 1 ? '' : 's'} consecutiva
              {data.week_streak === 1 ? '' : 's'} con al menos un post.
            </p>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-[#101417]/70 p-5">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-[#6F7786]">
            <Layers3 className="h-3.5 w-3.5" />
            Balance de pilares
          </div>
          <div className="mt-5 space-y-4">
            {data.pillar_balance.length > 0 ? (
              data.pillar_balance.map((pillar) => (
                <div key={pillar.pillar_id} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-[#E0E5EB]">{pillar.pillar_name}</span>
                    <span className="text-xs text-[#8D95A6]">
                      {pillar.count} · {pillar.percentage}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full transition-[width] duration-500 ease-out"
                      style={{
                        backgroundColor: pillar.pillar_color,
                        width: `${pillar.percentage}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#8D95A6]">Aún no hay pilares configurados.</p>
            )}
          </div>
          {data.underused_pillar ? (
            <div className="mt-4 inline-flex rounded-full border border-[#FCD34D]/20 bg-[#FCD34D]/10 px-3 py-1.5 text-xs text-[#FCD34D]">
              Pilar {data.underused_pillar} necesita contenido esta semana
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="rounded-[24px] border border-white/10 bg-[#101417]/70 p-5">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#6F7786]">
            Distribución de plataformas
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {(Object.entries(data.platform_distribution) as Array<['instagram' | 'linkedin' | 'x', number]>).map(
              ([platform, value]) => (
                <div
                  key={platform}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm transition-colors',
                    dominantPlatform === platform
                      ? 'border-[#E0E5EB]/30 bg-white/[0.08] text-[#E0E5EB]'
                      : 'border-white/10 bg-white/[0.03] text-[#8D95A6]'
                  )}
                >
                  {platform} · {value}%
                </div>
              )
            )}
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-[#101417]/70 p-5">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-[#6F7786]">
            <Sparkles className="h-3.5 w-3.5" />
            Ángulos más usados
          </div>
          <div className="mt-5 space-y-3">
            {data.top_angles.length > 0 ? (
              data.top_angles.map((item) => (
                <div key={item.angle} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-[#E0E5EB]">{item.angle}</span>
                  <span className="text-xs text-[#8D95A6]">{item.count} usos</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#8D95A6]">Aún no hay suficientes posts para detectar patrones.</p>
            )}
          </div>
          {repetitiveAngle ? (
            <div className="mt-4 inline-flex rounded-full border border-[#F87171]/20 bg-[#F87171]/10 px-3 py-1.5 text-xs text-[#F87171]">
              Varías poco el tipo de contenido
            </div>
          ) : null}
          {data.dominant_pillar ? (
            <p className="mt-4 text-xs text-[#8D95A6]">Pilar dominante: {data.dominant_pillar}</p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
