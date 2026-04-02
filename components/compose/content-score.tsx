'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCcw } from 'lucide-react'
import {
  editorialFunctionKeys,
  editorialFunctionLabels,
  editorialWeakLabels,
  normalizeEditorialScoreData,
  type EditorialFunctionKey,
  type EditorialScoreData,
} from '@/lib/content-score'
import type { Platform } from '@/lib/product'
import { getCaptionText, type PostFormat } from '@/lib/social-content'

type ContentScoreProps = {
  angle: string
  content: Record<string, unknown>
  format: PostFormat
  onRebalance?: (newContent: Record<string, unknown>) => void
  platform: Platform
  postId?: string
}

type ScoreResponse = EditorialScoreData & {
  error?: string
  post_id?: string
}

const scoreBadgeColors = {
  high: '#4ADE80',
  low: '#F87171',
  medium: '#FCD34D',
}

const baseBarColor = '#3B4455'
const dominantBarColor = '#6C4BC1'
const weakBarColor = '#2A3040'

function getOverallColor(score: number) {
  if (score >= 80) {
    return scoreBadgeColors.high
  }

  if (score >= 60) {
    return scoreBadgeColors.medium
  }

  return scoreBadgeColors.low
}

function getBarColor(key: EditorialFunctionKey, scoreData: EditorialScoreData) {
  if (scoreData.weak === key) {
    return weakBarColor
  }

  if (scoreData.dominant === key) {
    return dominantBarColor
  }

  return baseBarColor
}

export function ContentScore({
  angle,
  content,
  format,
  onRebalance,
  platform,
  postId,
}: ContentScoreProps) {
  const [scoreData, setScoreData] = useState<EditorialScoreData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rebalancing, setRebalancing] = useState(false)

  const captionText = useMemo(
    () => getCaptionText(platform, format, content).trim(),
    [content, format, platform]
  )

  useEffect(() => {
    if (!captionText || !angle.trim()) {
      setScoreData(null)
      setError(null)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/content/score', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            angle,
            content,
            format,
            platform,
            post_id: postId,
          }),
          signal: controller.signal,
        })

        const data = (await response.json()) as ScoreResponse

        if (!response.ok) {
          throw new Error(data.error || 'No fue posible evaluar el contenido.')
        }

        setScoreData(normalizeEditorialScoreData(data))
      } catch (fetchError) {
        if ((fetchError as Error).name === 'AbortError') {
          return
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'No fue posible evaluar el contenido.'
        )
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }, 1200)

    return () => {
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [angle, captionText, content, format, platform, postId])

  const handleRebalance = async () => {
    if (!scoreData?.rebalance_tip || rebalancing) {
      return
    }

    // Determina qué dimensiones son fuertes (≥85) para preservarlas
    const strongDimensions = editorialFunctionKeys.filter(
      (key) => (scoreData[key]?.score ?? 0) >= 85
    )

    try {
      setRebalancing(true)
      setError(null)

      const response = await fetch('/api/content/rebalance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          angle,
          content,
          format,
          platform,
          post_id: postId,
          weak_dimension: scoreData.weak,
          rebalance_tip: scoreData.rebalance_tip,
          strong_dimensions: strongDimensions,
        }),
      })

      const data = (await response.json()) as {
        content?: Record<string, unknown>
        error?: string
      }

      if (!response.ok || !data.content) {
        throw new Error(data.error || 'No fue posible rebalancear el contenido.')
      }

      // Limpia el score para que se recalcule con el nuevo contenido
      setScoreData(null)
      onRebalance?.(data.content)
    } catch (rebalanceError) {
      setError(
        rebalanceError instanceof Error
          ? rebalanceError.message
          : 'No fue posible rebalancear el contenido.'
      )
    } finally {
      setRebalancing(false)
    }
  }

  if (!captionText) {
    return null
  }

  return (
    <div className="rounded-[24px] border border-white/10 bg-[#101417] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-medium text-[#E0E5EB]">Análisis editorial</p>
            <p className="mt-1 text-xs text-[#8D95A6]">
              Evalúa si el contenido cubre las 4 funciones de Noctra.
            </p>
          </div>
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-[#8D95A6]" /> : null}
        </div>

        <span
          className="inline-flex min-w-[72px] items-center justify-center rounded-full border px-3 py-1 text-sm font-medium"
          style={{
            borderColor: `${getOverallColor(scoreData?.overall ?? 0)}33`,
            color: getOverallColor(scoreData?.overall ?? 0),
          }}
        >
          {scoreData ? `${scoreData.overall}%` : '...'}
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {editorialFunctionKeys.map((key) => {
          const dimension = scoreData?.[key]
          const fillColor = scoreData ? getBarColor(key, scoreData) : baseBarColor

          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-[#E0E5EB]">{editorialFunctionLabels[key]}</span>
                <span className="text-xs font-medium text-[#B5BDCA]">
                  {dimension?.score ?? 0}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full transition-[width,box-shadow,background-color] duration-[600ms] ease-out"
                  style={{
                    backgroundColor: fillColor,
                    boxShadow:
                      scoreData?.dominant === key ? '0 0 18px rgba(70, 45, 110, 0.55)' : 'none',
                    width: `${dimension?.score ?? 0}%`,
                  }}
                />
              </div>

              <p className="text-xs text-[#8D95A6]">
                {dimension?.note ?? 'Esperando evaluación editorial...'}
              </p>
            </div>
          )
        })}
      </div>

      {scoreData?.weak ? (
        <div className="mt-4 inline-flex rounded-full border border-[#FCD34D]/20 bg-[#FCD34D]/10 px-3 py-1.5 text-xs font-medium text-[#FCD34D]">
          ↓ {editorialWeakLabels[scoreData.weak]} necesita refuerzo
        </div>
      ) : null}

      {scoreData ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-white/5 bg-white/[0.02] px-3 py-3">
          <div className="space-y-1.5">
            <p className="text-xs text-[#8D95A6]">{scoreData.rebalance_tip}</p>
            {/* Muestra qué se preserva */}
            {editorialFunctionKeys.some(k => (scoreData[k]?.score ?? 0) >= 85) && (
              <p className="text-[11px] text-[#4E576A]">
                Se preservan:{' '}
                {editorialFunctionKeys
                  .filter(k => (scoreData[k]?.score ?? 0) >= 85)
                  .map(k => editorialFunctionLabels[k])
                  .join(', ')}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => void handleRebalance()}
            disabled={rebalancing}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {rebalancing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Rebalancear con IA
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-4 text-xs text-[#FCD34D]">{error}</p> : null}
    </div>
  )
}
