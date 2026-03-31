export type CarouselTheme = {
  accent: string
  fontBody: string
  fontHeading: string
  id: string
  name: string
  primary: string
  secondary: string
  text: string
  textMuted: string
}

export const PRESET_THEMES: CarouselTheme[] = [
  {
    accent: '#462D6E',
    fontBody: 'Inter',
    fontHeading: 'Satoshi',
    id: 'nocturno',
    name: 'Nocturno',
    primary: '#101417',
    secondary: '#212631',
    text: '#E0E5EB',
    textMuted: '#4E576A',
  },
  {
    accent: '#ffffff',
    fontBody: 'Inter',
    fontHeading: 'DM Sans',
    id: 'carbon',
    name: 'Carbon',
    primary: '#0a0a0a',
    secondary: '#1a1a1a',
    text: '#ffffff',
    textMuted: '#666666',
  },
  {
    accent: '#00d4aa',
    fontBody: 'Manrope',
    fontHeading: 'Satoshi',
    id: 'aurora',
    name: 'Aurora',
    primary: '#0f1923',
    secondary: '#1a2f3d',
    text: '#e8f4f0',
    textMuted: '#7aafaa',
  },
  {
    accent: '#ff6b00',
    fontBody: 'Inter',
    fontHeading: 'Plus Jakarta Sans',
    id: 'solar',
    name: 'Solar',
    primary: '#1a0a00',
    secondary: '#2d1600',
    text: '#fff0e0',
    textMuted: '#b38060',
  },
  {
    accent: '#8b5cf6',
    fontBody: 'Inter',
    fontHeading: 'Syne',
    id: 'lavanda',
    name: 'Lavanda',
    primary: '#0f0a1e',
    secondary: '#1e1040',
    text: '#ede9fe',
    textMuted: '#7c6fa0',
  },
  {
    accent: '#22c55e',
    fontBody: 'Inter',
    fontHeading: 'Space Grotesk',
    id: 'jade',
    name: 'Jade',
    primary: '#0a1a12',
    secondary: '#102218',
    text: '#dcfce7',
    textMuted: '#4a7a5a',
  },
  {
    accent: '#111111',
    fontBody: 'Inter',
    fontHeading: 'Satoshi',
    id: 'blanco',
    name: 'Blanco',
    primary: '#ffffff',
    secondary: '#f5f5f5',
    text: '#111111',
    textMuted: '#666666',
  },
  {
    accent: '#462D6E',
    fontBody: 'Inter',
    fontHeading: 'Satoshi',
    id: 'custom',
    name: 'Personalizado',
    primary: '#101417',
    secondary: '#212631',
    text: '#E0E5EB',
    textMuted: '#4E576A',
  },
]

const CUSTOM_THEMES_STORAGE_KEY = 'noctra_custom_themes'

export function getCustomThemes(): CarouselTheme[] {
  if (typeof window === 'undefined') return []
  const saved = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY)
  if (!saved) return []
  try {
    return JSON.parse(saved) as CarouselTheme[]
  } catch {
    return []
  }
}

export function saveCustomTheme(theme: CarouselTheme): CarouselTheme[] {
  const current = getCustomThemes()
  const next = [theme, ...current.filter((t) => t.id !== theme.id)].slice(0, 5)
  localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(next))
  return next
}
