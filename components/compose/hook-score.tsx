'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Loader2, Sparkles } from 'lucide-react'
import type { Platform } from '@/lib/product'
import {
  readInstagramSlides,
  readLinkedInSlides,
  readString,
  readXThreadTweets,
  type HookScore as HookScoreValue,
  type PostFormat,
} from '@/lib/social-content'
import { cn } from '@/lib/utils'

type HookVariant = {
  pattern: 'pregunta' | 'stat' | 'contrarian'
  text: string
  why: string
}

type HookScoreProps = {
  platform: Platform
  content: Record<string, unknown>
  format: PostFormat
  angle: string
  onReplaceHook: (newHook: string) => void
}

function extractFirstLine(platform: Platform, format: PostFormat, content: Record<string, unknown>) {
  if (platform === 'instagram') {
    if (format === 'carousel') {
      const slides = readInstagramSlides(content.slides)
      const coverSlide = slides.find((slide) => slide.type === 'cover') ?? slides[0]

      return readString(coverSlide?.headline).trim()
    }

    return readString(content.caption).split(/\r?\n/)[0]?.trim() ?? ''
  }

  if (platform === 'linkedin') {
    if (format === 'document' || format === 'carousel') {
      const slides = readLinkedInSlides(content.slides)
      return readString(slides[0]?.title).trim()
    }

    return readString(content.caption).split(/\r?\n/)[0]?.trim() ?? ''
  }

  if (platform === 'x') {
    if (format === 'article') {
      return readString(content.title).trim()
    }

    if (format === 'thread') {
      return readString(readXThreadTweets(content.tweets ?? content.thread)[0]?.content).trim()
    }

    return readString(content.tweet).trim()
  }

  return ''
}

function detectPattern(firstLine: string): HookScoreValue['pattern'] {
  const normalized = firstLine.trim().toLowerCase()

  if (normalized.endsWith('?')) {
    return 'pregunta'
  }

  if (/\d/.test(normalized)) {
    return 'stat'
  }

  if (/(equivocad|mito|deja de|mal|nadie te dice|no necesitas)/.test(normalized)) {
    return 'contrarian'
  }

  if (/(cómo|aprende|pasos|guía|consigue|logra|haz)/.test(normalized)) {
    return 'promesa'
  }

  if (/(hace|aprendí|me pasó|cuando|cometí|nos pasó)/.test(normalized)) {
    return 'story'
  }

  return 'otro'
}

function buildWhy(score: HookScoreValue['score'], pattern: HookScoreValue['pattern'], firstLine: string) {
  if (!firstLine.trim()) {
    return 'Aún no hay hook para evaluar.'
  }

  if (firstLine.length > 120) {
    return 'Muy largo; pierde claridad e impacto inicial.'
  }

  if (score >= 4) {
    switch (pattern) {
      case 'pregunta':
        return 'Pregunta breve que abre curiosidad rápido.'
      case 'stat':
        return 'Dato concreto que ancla credibilidad al instante.'
      case 'contrarian':
        return 'Choque claro contra lo obvio; obliga a seguir.'
      case 'promesa':
        return 'Promesa concreta y accionable desde la apertura.'
      case 'story':
        return 'Arranque narrativo que genera tensión y contexto.'
      default:
        return 'Inicio claro, corto y fácil de recordar.'
    }
  }

  if (score >= 2) {
    return 'Tiene base, pero le falta más tensión o especificidad.'
  }

  return 'Le falta curiosidad, contraste o una promesa más clara.'
}

function evaluateHookLocally(firstLine: string): HookScoreValue {
  let score = 2

  if (firstLine.trim().endsWith('?')) {
    score += 1
  }

  if (/\d/.test(firstLine)) {
    score += 1
  }

  if (firstLine.trim().length > 0 && firstLine.trim().length < 60) {
    score += 1
  }

  if (firstLine.trim().length > 120) {
    score -= 1
  }

  const clampedScore = Math.max(0, Math.min(5, score)) as HookScoreValue['score']
  const pattern = detectPattern(firstLine)

  return {
    score: clampedScore,
    strength: clampedScore >= 4 ? 'strong' : clampedScore >= 2 ? 'medium' : 'weak',
    first_line: firstLine,
    pattern,
    why: buildWhy(clampedScore, pattern, firstLine),
  }
}

function formatStars(score: HookScoreValue['score']) {
  return `${'★'.repeat(score)}${'☆'.repeat(5 - score)}`
}

function getStrengthClasses(strength: HookScoreValue['strength']) {
  if (strength === 'strong') {
    return 'border-[#4ADE80]/20 bg-[#4ADE80]/10 text-[#4ADE80]'
  }

  if (strength === 'medium') {
    return 'border-[#FCD34D]/20 bg-[#FCD34D]/10 text-[#FCD34D]'
  }

  return 'border-[#F87171]/20 bg-[#F87171]/10 text-[#F87171]'
}

export function HookScore({
  platform,
  content,
  format,
  angle,
  onReplaceHook,
}: HookScoreProps) {
  const firstLine = useMemo(
    () => extractFirstLine(platform, format, content),
    [content, format, platform]
  )
  const localScore = useMemo(() => evaluateHookLocally(firstLine), [firstLine])
  const analysisKey = `${platform}:${format}:${firstLine}`

  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [variants, setVariants] = useState<HookVariant[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loadedAnalysisKey, setLoadedAnalysisKey] = useState<string | null>(null)

  const visibleVariants = loadedAnalysisKey === analysisKey ? variants : []
  const visibleError = loadedAnalysisKey === analysisKey ? error : null

  const handleAnalyze = async () => {
    const nextExpanded = !expanded
    setExpanded(nextExpanded)

    if (!nextExpanded || visibleVariants.length > 0 || loading || !firstLine.trim()) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      setLoadedAnalysisKey(analysisKey)

      const response = await fetch('/api/content/hook-variants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          angle,
          hook: firstLine,
          platform,
        }),
      })

      const data = (await response.json()) as {
        error?: string
        variants?: HookVariant[]
      }

      if (!response.ok) {
        throw new Error(data.error || 'No fue posible analizar el hook.')
      }

      setVariants(Array.isArray(data.variants) ? data.variants : [])
    } catch (analysisError) {
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : 'No fue posible analizar el hook.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (!firstLine.trim()) {
    return null
  }

  return (
    <div className="rounded-[24px] border border-white/10 bg-[#101417] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => void handleAnalyze()}
          className="inline-flex items-center gap-3 text-left"
        >
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-[#E0E5EB]">
            {formatStars(localScore.score)}
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[#8D95A6]">
            {localScore.pattern}
          </span>
          <span className={cn('rounded-full border px-3 py-1.5 text-xs', getStrengthClasses(localScore.strength))}>
            {localScore.strength}
          </span>
        </button>

        <button
          type="button"
          onClick={() => void handleAnalyze()}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Analizar hook
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-[18px] bg-[#1A1F28] p-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#6F7786]">Primera línea</p>
            <p className="mt-2 text-sm leading-6 text-[#E0E5EB]">{localScore.first_line}</p>
          </div>

          <p className="text-sm text-[#8D95A6]">{localScore.why}</p>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.24em] text-[#6F7786]">3 variantes</p>

            {visibleVariants.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-3">
                {visibleVariants.map((variant) => (
                  <div
                    key={`${variant.pattern}-${variant.text}`}
                    className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[#B5BDCA]">
                        {variant.pattern}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#E0E5EB]">{variant.text}</p>
                    <p className="mt-2 text-xs text-[#8D95A6]">{variant.why}</p>
                    <button
                      type="button"
                      onClick={() => onReplaceHook(variant.text)}
                      className="mt-4 inline-flex items-center rounded-full border border-white/10 px-3 py-1.5 text-xs text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5"
                    >
                      Usar este hook
                    </button>
                  </div>
                ))}
              </div>
            ) : loading ? (
              <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4 text-sm text-[#8D95A6]">
                Generando variantes del hook...
              </div>
            ) : (
              <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4 text-sm text-[#8D95A6]">
                Haz clic en analizar hook para pedir variantes a la IA.
              </div>
            )}
          </div>

          {visibleError ? <p className="text-xs text-[#FCD34D]">{visibleError}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
