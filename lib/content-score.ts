import { isRecord, readString } from '@/lib/social-content'

export const editorialFunctionKeys = [
  'educa',
  'curiosidad',
  'conocimiento',
  'convence',
] as const

export type EditorialFunctionKey = (typeof editorialFunctionKeys)[number]

export type EditorialScoreDimension = {
  note: string
  score: number
}

export type EditorialScoreData = Record<EditorialFunctionKey, EditorialScoreDimension> & {
  dominant: EditorialFunctionKey
  overall: number
  rebalance_tip: string
  weak: EditorialFunctionKey | null
}

export const editorialFunctionLabels: Record<EditorialFunctionKey, string> = {
  educa: 'Educa',
  curiosidad: 'Genera curiosidad',
  conocimiento: 'Demuestra conocimiento',
  convence: 'Convence',
}

export const editorialWeakLabels: Record<EditorialFunctionKey, string> = {
  educa: 'educa',
  curiosidad: 'genera curiosidad',
  conocimiento: 'demuestra conocimiento',
  convence: 'convence',
}

function clampScore(value: unknown) {
  const numeric = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(numeric)) {
    return 0
  }

  return Math.max(0, Math.min(100, Math.round(numeric)))
}

function limitWords(text: string, maxWords: number) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords)
    .join(' ')
}

function normalizeDimension(
  value: unknown,
  fallbackNote: string,
  maxWords: number
): EditorialScoreDimension {
  if (!isRecord(value)) {
    return {
      note: fallbackNote,
      score: 0,
    }
  }

  const note = limitWords(readString(value.note), maxWords)

  return {
    note: note || fallbackNote,
    score: clampScore(value.score),
  }
}

function getComputedDominant(dimensions: Record<EditorialFunctionKey, EditorialScoreDimension>) {
  return editorialFunctionKeys.reduce((best, key) =>
    dimensions[key].score > dimensions[best].score ? key : best
  )
}

function getComputedWeak(dimensions: Record<EditorialFunctionKey, EditorialScoreDimension>) {
  const scores = editorialFunctionKeys.map((key) => dimensions[key].score)
  const maxScore = Math.max(...scores)
  const minScore = Math.min(...scores)

  if (maxScore === minScore) {
    return null
  }

  return editorialFunctionKeys.reduce((lowest, key) =>
    dimensions[key].score < dimensions[lowest].score ? key : lowest
  )
}

export function normalizeEditorialScoreData(value: unknown): EditorialScoreData {
  const record = isRecord(value) ? value : {}
  const dimensions = {
    educa: normalizeDimension(record.educa, 'Amplia el aprendizaje práctico.', 12),
    curiosidad: normalizeDimension(record.curiosidad, 'Le falta una tensión clara.', 12),
    conocimiento: normalizeDimension(record.conocimiento, 'Añade criterio más concreto.', 12),
    convence: normalizeDimension(record.convence, 'Refuerza el cierre o beneficio.', 12),
  } satisfies Record<EditorialFunctionKey, EditorialScoreDimension>

  const dominant = editorialFunctionKeys.includes(record.dominant as EditorialFunctionKey)
    ? (record.dominant as EditorialFunctionKey)
    : getComputedDominant(dimensions)
  const computedWeak = getComputedWeak(dimensions)
  const weak =
    record.weak === null
      ? null
      : editorialFunctionKeys.includes(record.weak as EditorialFunctionKey)
        ? (record.weak as EditorialFunctionKey)
        : computedWeak
  const overall =
    typeof record.overall === 'number'
      ? clampScore(record.overall)
      : clampScore(
          Math.round(
            editorialFunctionKeys.reduce((total, key) => total + dimensions[key].score, 0) /
              editorialFunctionKeys.length
          )
        )
  const rebalanceTip = limitWords(readString(record.rebalance_tip), 20)

  return {
    ...dimensions,
    dominant,
    overall,
    rebalance_tip: rebalanceTip || 'Añade una idea más concreta y un cierre más útil.',
    weak,
  }
}
