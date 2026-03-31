import type { CarouselGradientConfig } from '@/lib/carousel-backgrounds'
import { normalizeGradientConfig, normalizeHexColor } from '@/lib/carousel-backgrounds'

export const RECENT_COLORS_STORAGE_KEY = 'noctra_recent_colors'
export const SAVED_GRADIENTS_STORAGE_KEY = 'noctra_saved_gradients'
export const RECENT_FONTS_STORAGE_KEY = 'noctra_recent_fonts'

const MAX_RECENT_COLORS = 8
const MAX_SAVED_GRADIENTS = 10
const MAX_RECENT_FONTS = 5

function canUseStorage() {
  return typeof window !== 'undefined'
}

function readJsonArray<T>(key: string) {
  if (!canUseStorage()) {
    return []
  }

  try {
    const raw = window.localStorage.getItem(key)

    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function writeJsonArray<T>(key: string, value: T[]) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

export function getRecentColors() {
  return readJsonArray<string>(RECENT_COLORS_STORAGE_KEY).map((color) => normalizeHexColor(color)).slice(0, MAX_RECENT_COLORS)
}

export function saveRecentColor(color: string) {
  const normalized = normalizeHexColor(color)
  const next = [normalized, ...getRecentColors().filter((item) => item !== normalized)].slice(0, MAX_RECENT_COLORS)
  writeJsonArray(RECENT_COLORS_STORAGE_KEY, next)
  return next
}

export function getSavedGradients() {
  return readJsonArray<CarouselGradientConfig>(SAVED_GRADIENTS_STORAGE_KEY)
    .map((gradient) => normalizeGradientConfig(gradient))
    .slice(0, MAX_SAVED_GRADIENTS)
}

export function saveGradient(config: CarouselGradientConfig) {
  const normalized = normalizeGradientConfig(config)
  const serialized = JSON.stringify(normalized)
  const next = [normalized, ...getSavedGradients().filter((item) => JSON.stringify(item) !== serialized)].slice(
    0,
    MAX_SAVED_GRADIENTS
  )
  writeJsonArray(SAVED_GRADIENTS_STORAGE_KEY, next)
  return next
}

export function getRecentFonts() {
  return readJsonArray<string>(RECENT_FONTS_STORAGE_KEY).slice(0, MAX_RECENT_FONTS)
}

export function saveRecentFont(fontId: string) {
  const next = [fontId, ...getRecentFonts().filter((item) => item !== fontId)].slice(0, MAX_RECENT_FONTS)
  writeJsonArray(RECENT_FONTS_STORAGE_KEY, next)
  return next
}
