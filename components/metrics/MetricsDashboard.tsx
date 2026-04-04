'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type InsightItem = {
  confidence: number
  dataPoints: number
  id: string
  summary: string
  type: string
}

type MetricsDashboardProps = {
  availablePlatforms: Array<{ label: string; value: string }>
  emptyState: {
    hasConnections: boolean
  }
  insights: InsightItem[]
  pillarData: Array<{ count: number; engagement: number; name: string }>
  selectedPlatform: string
  selectedRange: number
  summary: {
    avgEngagement: number
    avgImpressions: number
    bestPostLabel: string | null
    publishedPosts: number
  }
  timelineData: Array<{ date: string; impressions: number }>
  topPosts: Array<{
    engagementRate: number
    id: string
    impressions: number
    pillarName: string | null
    title: string
  }>
}

const INSIGHT_TYPE_ICONS: Record<string, string> = {
  topic: '🎯',
  format: '📐',
  tone: '🎤',
  timing: '⏰',
  hashtag: '#',
  cta: '📣',
  length: '📏',
  general: '✦',
}

function confidenceLabel(confidence: number) {
  if (confidence >= 0.75) return 'alta'
  if (confidence >= 0.5) return 'media'
  return 'baja'
}

function ConfidenceDots({ confidence }: { confidence: number }) {
  const filled = confidence >= 0.75 ? 4 : confidence >= 0.5 ? 3 : confidence >= 0.25 ? 2 : 1
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4].map((dot) => (
        <span
          key={dot}
          className={`inline-block h-1.5 w-1.5 rounded-full ${dot <= filled ? 'bg-[#F6D37A]' : 'bg-white/15'}`}
        />
      ))}
    </span>
  )
}

const rangeOptions = [
  { label: 'Últimos 7 días', value: 7 },
  { label: 'Últimos 30 días', value: 30 },
  { label: 'Últimos 90 días', value: 90 },
] as const

function formatNumber(value: number) {
  return new Intl.NumberFormat('es-MX').format(Math.round(value))
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function coerceChartNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

export function MetricsDashboard({
  availablePlatforms,
  emptyState,
  insights: initialInsights,
  pillarData,
  selectedPlatform,
  selectedRange,
  summary,
  timelineData,
  topPosts,
}: MetricsDashboardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [insights, setInsights] = useState<InsightItem[]>(initialInsights)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  async function runAnalysis() {
    if (selectedPlatform === 'all') return
    setIsAnalyzing(true)
    setAnalyzeError(null)

    try {
      const res = await fetch('/api/insights/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: selectedPlatform }),
      })
      const data = await res.json() as { insights?: Array<{ id: string; insight_type: string; summary: string; confidence: number; data_points: number }>; error?: string }

      if (!res.ok) {
        setAnalyzeError(data.error ?? 'Error al analizar')
        return
      }

      if (data.insights) {
        setInsights(
          data.insights.map((i) => ({
            id: i.id,
            type: i.insight_type,
            summary: i.summary,
            confidence: i.confidence,
            dataPoints: i.data_points,
          }))
        )
      }
    } catch {
      setAnalyzeError('No se pudo conectar con el servidor')
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function dismissInsight(id: string) {
    setInsights((prev) => prev.filter((i) => i.id !== id))
    await fetch('/api/insights/dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(console.error)
  }

  function updateSearchParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)

    startTransition(() => {
      router.push(`/metrics?${params.toString()}`)
    })
  }

  const hasMetrics = topPosts.length > 0 || pillarData.length > 0 || timelineData.length > 0

  return (
    <div className="space-y-6">
      <section className="rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top,#B8860B1F,transparent_35%),linear-gradient(180deg,#1A212B,#101417)] p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-[#6F7786]">Métricas</p>
            <h1
              className="text-4xl font-medium text-[#E0E5EB] sm:text-5xl"
              style={{ fontFamily: 'var(--font-brand-display)' }}
            >
              Rendimiento editorial
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-[#8D95A6]">
              Observa qué posts generan más tracción, cómo cambia el engagement en el tiempo y
              cuáles pilares están sosteniendo tu autoridad.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedPlatform}
              onChange={(event) => updateSearchParam('platform', event.target.value)}
              className="rounded-full border border-white/10 bg-[#101417] px-4 py-2 text-sm text-[#E0E5EB] outline-none"
            >
              {availablePlatforms.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={String(selectedRange)}
              onChange={(event) => updateSearchParam('range', event.target.value)}
              className="rounded-full border border-white/10 bg-[#101417] px-4 py-2 text-sm text-[#E0E5EB] outline-none"
            >
              {rangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {isPending ? (
              <span className="text-xs uppercase tracking-[0.2em] text-[#6F7786]">Actualizando…</span>
            ) : null}
          </div>
        </div>
      </section>

      {!hasMetrics ? (
        <section className="rounded-[30px] border border-dashed border-white/10 bg-[#12161D] p-10 text-center">
          <p
            className="text-2xl font-medium text-[#E0E5EB]"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            Todavía no hay métricas para mostrar.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#8D95A6]">
            {emptyState.hasConnections
              ? 'Marca algunos posts como publicados y usa “Sincronizar” en Cuentas para traer los primeros datos.'
              : 'Conecta al menos una cuenta social para empezar a capturar rendimiento por post.'}
          </p>
          <div className="mt-6">
            <Link
              href="/settings?section=studio&tab=accounts"
              className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/[0.08]"
            >
              Ir a Cuentas
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-4">
            {[
              {
                label: 'Posts publicados',
                value: formatNumber(summary.publishedPosts),
              },
              {
                label: 'Impresiones promedio',
                value: formatNumber(summary.avgImpressions),
              },
              {
                label: 'Engagement promedio',
                value: formatPercent(summary.avgEngagement),
              },
              {
                label: 'Mejor post',
                value: summary.bestPostLabel || 'Sin datos',
              },
            ].map((card) => (
              <article key={card.label} className="rounded-[28px] border border-white/10 bg-[#12161D] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[#6F7786]">{card.label}</p>
                <p
                  className="mt-4 text-3xl font-medium text-[#E0E5EB]"
                  style={{ fontFamily: 'var(--font-brand-display)' }}
                >
                  {card.value}
                </p>
              </article>
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-[30px] border border-white/10 bg-[#12161D] p-5">
              <div className="mb-4">
                <p
                  className="text-xl font-medium text-[#E0E5EB]"
                  style={{ fontFamily: 'var(--font-brand-display)' }}
                >
                  Engagement por pilar de contenido
                </p>
                <p className="mt-2 text-sm leading-6 text-[#8D95A6]">
                  Comparación del engagement promedio por pilar dentro del rango seleccionado.
                </p>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pillarData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="name" stroke="#6F7786" tickLine={false} axisLine={false} />
                    <YAxis stroke="#6F7786" tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      contentStyle={{
                        background: '#11161D',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 16,
                      }}
                      formatter={(value) => [
                        formatPercent(coerceChartNumber(value)),
                        'Engagement',
                      ]}
                    />
                    <Bar dataKey="engagement" fill="#F6D37A" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="rounded-[30px] border border-white/10 bg-[#12161D] p-5">
              <div className="mb-4">
                <p
                  className="text-xl font-medium text-[#E0E5EB]"
                  style={{ fontFamily: 'var(--font-brand-display)' }}
                >
                  Impresiones en el tiempo
                </p>
                <p className="mt-2 text-sm leading-6 text-[#8D95A6]">
                  Evolución diaria de impresiones capturadas durante el rango activo.
                </p>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="date" stroke="#6F7786" tickLine={false} axisLine={false} />
                    <YAxis stroke="#6F7786" tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: '#11161D',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 16,
                      }}
                      formatter={(value) => [
                        formatNumber(coerceChartNumber(value)),
                        'Impresiones',
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="impressions"
                      stroke="#9CCFD8"
                      strokeWidth={3}
                      dot={{ fill: '#9CCFD8', r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
            <article className="rounded-[30px] border border-white/10 bg-[#12161D] p-5">
              <div className="mb-4">
                <p
                  className="text-xl font-medium text-[#E0E5EB]"
                  style={{ fontFamily: 'var(--font-brand-display)' }}
                >
                  Tus posts más efectivos
                </p>
                <p className="mt-2 text-sm leading-6 text-[#8D95A6]">
                  Ranking por engagement rate con contexto editorial del pilar al que pertenecen.
                </p>
              </div>
              <div className="grid gap-3">
                {topPosts.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-[24px] border border-white/10 bg-[#171C24] p-4"
                  >
                    <p className="text-base font-medium text-[#E0E5EB]">{post.title}</p>
                    <p className="mt-2 text-sm text-[#8D95A6]">
                      {formatNumber(post.impressions)} impresiones · {formatPercent(post.engagementRate)} engagement
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#6F7786]">
                      {post.pillarName ? `Pilar: ${post.pillarName}` : 'Sin pilar asignado'}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[30px] border border-white/10 bg-[#12161D] p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p
                    className="text-xl font-medium text-[#E0E5EB]"
                    style={{ fontFamily: 'var(--font-brand-display)' }}
                  >
                    Insights de la IA
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#8D95A6]">
                    Aprendizajes persistidos para este workspace a partir de tu historial editorial.
                  </p>
                </div>
                {selectedPlatform !== 'all' && (
                  <button
                    onClick={runAnalysis}
                    disabled={isAnalyzing}
                    className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/[0.08] disabled:opacity-50"
                  >
                    {isAnalyzing ? 'Analizando…' : 'Actualizar análisis →'}
                  </button>
                )}
              </div>

              {analyzeError && (
                <p className="mb-3 rounded-[16px] border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {analyzeError}
                </p>
              )}

              <div className="grid gap-3">
                {insights.length > 0 ? (
                  insights.map((insight) => (
                    <div
                      key={insight.id}
                      className="group relative rounded-[24px] border border-white/10 bg-[#171C24] px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">
                            {INSIGHT_TYPE_ICONS[insight.type] ?? '✦'}
                          </span>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-[#6F7786]">
                            {insight.type}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <ConfidenceDots confidence={insight.confidence} />
                          <span className="text-[10px] text-[#6F7786]">
                            {confidenceLabel(insight.confidence)}
                          </span>
                          <button
                            onClick={() => dismissInsight(insight.id)}
                            className="ml-1 text-[#6F7786] opacity-0 transition-opacity hover:text-[#E0E5EB] group-hover:opacity-100"
                            title="Ignorar este insight"
                            aria-label="Ignorar este insight"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#E0E5EB]">{insight.summary}</p>
                      <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-[#6F7786]">
                        Basado en {insight.dataPoints} posts
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-white/10 bg-[#171C24] px-4 py-6 text-sm leading-6 text-[#8D95A6]">
                    {selectedPlatform === 'all'
                      ? 'Selecciona una plataforma y usa "Actualizar análisis" para generar insights.'
                      : 'Publica y sincroniza al menos 3 posts para activar el aprendizaje.'}
                  </div>
                )}
              </div>
            </article>
          </section>
        </>
      )}
    </div>
  )
}
