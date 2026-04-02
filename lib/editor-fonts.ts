export type EditorFontCategory = 'Accent / Editorial' | 'Body / Supporting' | 'Display / Headings' | 'Monospace'

export type EditorFontOption = {
  category: EditorFontCategory
  family: string
  id: string
  label: string
  loader: 'google' | 'local'
  previewFamily: string
}

export const EDITOR_FONT_OPTIONS: EditorFontOption[] = [
  {
    category: 'Display / Headings',
    family: '"Satoshi", "DM Sans", system-ui, sans-serif',
    id: 'satoshi',
    label: 'Satoshi',
    loader: 'local',
    previewFamily: '"Satoshi", "DM Sans", system-ui, sans-serif',
  },
  {
    category: 'Display / Headings',
    family: '"DM Sans", system-ui, sans-serif',
    id: 'dm-sans',
    label: 'DM Sans',
    loader: 'google',
    previewFamily: '"DM Sans", system-ui, sans-serif',
  },
  {
    category: 'Display / Headings',
    family: '"Plus Jakarta Sans", system-ui, sans-serif',
    id: 'plus-jakarta-sans',
    label: 'Plus Jakarta Sans',
    loader: 'google',
    previewFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
  },
  {
    category: 'Display / Headings',
    family: '"Syne", system-ui, sans-serif',
    id: 'syne',
    label: 'Syne',
    loader: 'google',
    previewFamily: '"Syne", system-ui, sans-serif',
  },
  {
    category: 'Display / Headings',
    family: '"Space Grotesk", system-ui, sans-serif',
    id: 'space-grotesk',
    label: 'Space Grotesk',
    loader: 'google',
    previewFamily: '"Space Grotesk", system-ui, sans-serif',
  },
  {
    category: 'Display / Headings',
    family: '"Outfit", system-ui, sans-serif',
    id: 'outfit',
    label: 'Outfit',
    loader: 'google',
    previewFamily: '"Outfit", system-ui, sans-serif',
  },
  {
    category: 'Body / Supporting',
    family: '"Inter", system-ui, sans-serif',
    id: 'inter',
    label: 'Inter',
    loader: 'local',
    previewFamily: '"Inter", system-ui, sans-serif',
  },
  {
    category: 'Body / Supporting',
    family: '"Manrope", system-ui, sans-serif',
    id: 'manrope',
    label: 'Manrope',
    loader: 'google',
    previewFamily: '"Manrope", system-ui, sans-serif',
  },
  {
    category: 'Body / Supporting',
    family: '"Nunito Sans", system-ui, sans-serif',
    id: 'nunito-sans',
    label: 'Nunito Sans',
    loader: 'google',
    previewFamily: '"Nunito Sans", system-ui, sans-serif',
  },
  {
    category: 'Body / Supporting',
    family: '"Work Sans", system-ui, sans-serif',
    id: 'work-sans',
    label: 'Work Sans',
    loader: 'google',
    previewFamily: '"Work Sans", system-ui, sans-serif',
  },
  {
    category: 'Body / Supporting',
    family: '"Public Sans", system-ui, sans-serif',
    id: 'public-sans',
    label: 'Public Sans',
    loader: 'google',
    previewFamily: '"Public Sans", system-ui, sans-serif',
  },
  {
    category: 'Accent / Editorial',
    family: '"Playfair Display", Georgia, serif',
    id: 'playfair-display',
    label: 'Playfair Display',
    loader: 'google',
    previewFamily: '"Playfair Display", Georgia, serif',
  },
  {
    category: 'Accent / Editorial',
    family: '"Cormorant Garamond", Georgia, serif',
    id: 'cormorant-garamond',
    label: 'Cormorant Garamond',
    loader: 'google',
    previewFamily: '"Cormorant Garamond", Georgia, serif',
  },
  {
    category: 'Accent / Editorial',
    family: '"Libre Baskerville", Georgia, serif',
    id: 'libre-baskerville',
    label: 'Libre Baskerville',
    loader: 'google',
    previewFamily: '"Libre Baskerville", Georgia, serif',
  },
  {
    category: 'Monospace',
    family: '"JetBrains Mono", monospace',
    id: 'jetbrains-mono',
    label: 'JetBrains Mono',
    loader: 'google',
    previewFamily: '"JetBrains Mono", monospace',
  },
  {
    category: 'Monospace',
    family: '"Fira Code", monospace',
    id: 'fira-code',
    label: 'Fira Code',
    loader: 'google',
    previewFamily: '"Fira Code", monospace',
  },
]

const GOOGLE_FONT_QUERY: Record<string, string> = {
  'cormorant-garamond': 'Cormorant+Garamond:wght@400;500;600;700',
  'dm-sans': 'DM+Sans:wght@400;500;700;900',
  'fira-code': 'Fira+Code:wght@400;500;700',
  'jetbrains-mono': 'JetBrains+Mono:wght@400;500;700',
  'libre-baskerville': 'Libre+Baskerville:wght@400;700',
  manrope: 'Manrope:wght@400;500;700;800',
  'nunito-sans': 'Nunito+Sans:wght@400;500;700;800',
  outfit: 'Outfit:wght@400;500;700;800',
  'playfair-display': 'Playfair+Display:wght@400;500;600;700;800',
  'plus-jakarta-sans': 'Plus+Jakarta+Sans:wght@400;500;700;800',
  'public-sans': 'Public+Sans:wght@400;500;700;800',
  'space-grotesk': 'Space+Grotesk:wght@400;500;700',
  syne: 'Syne:wght@400;500;700;800',
  'work-sans': 'Work+Sans:wght@400;500;700;800',
}

const loadedGoogleFonts = new Set<string>()

export function findEditorFontByFamily(fontFamily: string | undefined | null) {
  if (!fontFamily) {
    return null
  }

  return (
    EDITOR_FONT_OPTIONS.find((option) => option.family === fontFamily) ??
    EDITOR_FONT_OPTIONS.find((option) => fontFamily.includes(option.label))
  )
}

export function findEditorFontById(fontId: string) {
  return EDITOR_FONT_OPTIONS.find((option) => option.id === fontId) ?? null
}

export async function ensureEditorFontLoaded(option: EditorFontOption) {
  if (typeof document === 'undefined') {
    return
  }

  if (option.loader === 'google') {
    const query = GOOGLE_FONT_QUERY[option.id]

    if (query && !loadedGoogleFonts.has(option.id)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = `https://fonts.googleapis.com/css2?family=${query}&display=swap`
      link.dataset.noctraFont = option.id
      document.head.appendChild(link)
      loadedGoogleFonts.add(option.id)
    }
  }

  await document.fonts.ready
  await Promise.allSettled([
    document.fonts.load(`400 16px ${option.family}`),
    document.fonts.load(`700 16px ${option.family}`),
  ])
}

let googleFontsCache: GoogleFontEntry[] | null = null
let googleFontsCacheTime = 0
const GOOGLE_FONTS_CLIENT_TTL = 60 * 60 * 1000

export type GoogleFontEntry = {
  family: string
  category: string
  variants: string[]
  popularity: number
}

export async function fetchGoogleFonts(options?: {
  query?: string
  category?: string
  limit?: number
}): Promise<GoogleFontEntry[]> {
  const now = Date.now()

  if (!options?.query && !options?.category) {
    if (googleFontsCache && now - googleFontsCacheTime < GOOGLE_FONTS_CLIENT_TTL) {
      return googleFontsCache
    }
  }

  const params = new URLSearchParams()
  if (options?.query) params.set('q', options.query)
  if (options?.category) params.set('category', options.category)
  if (options?.limit) params.set('limit', String(options.limit))

  const queryString = params.toString()
  const res = await fetch(`/api/fonts/google${queryString ? `?${queryString}` : ''}`)
  if (!res.ok) return []

  const data = (await res.json()) as { fonts: GoogleFontEntry[] }
  const fonts = data.fonts || []

  if (!options?.query && !options?.category) {
    googleFontsCache = fonts
    googleFontsCacheTime = now
  }

  return fonts
}

export async function ensureGoogleFontLoaded(
  family: string,
  variants: string[] = ['400', '700']
): Promise<void> {
  if (typeof document === 'undefined') return

  const linkId = `noctra-gf-${family.replace(/\s+/g, '-').toLowerCase()}`
  if (document.getElementById(linkId)) {
    await document.fonts.ready
    return
  }

  const familyParam = family.replace(/\s+/g, '+')
  const weights = variants
    .filter((variant) => !variant.includes('italic'))
    .map((variant) => (variant === 'regular' ? '400' : variant))
    .filter((variant) => /^\d+$/.test(variant))
    .join(';')

  const weightParam = weights || '400;700'
  const url = `https://fonts.googleapis.com/css2?family=${familyParam}:wght@${weightParam}&display=swap`

  const link = document.createElement('link')
  link.id = linkId
  link.rel = 'stylesheet'
  link.href = url
  document.head.appendChild(link)

  await document.fonts.ready
  await Promise.allSettled([
    document.fonts.load(`400 16px "${family}"`),
    document.fonts.load(`700 16px "${family}"`),
  ])
}

export function googleFontToEditorOption(font: GoogleFontEntry): EditorFontOption {
  const categoryMap: Record<string, EditorFontCategory> = {
    'sans-serif': 'Display / Headings',
    serif: 'Accent / Editorial',
    display: 'Display / Headings',
    monospace: 'Monospace',
    handwriting: 'Accent / Editorial',
  }

  return {
    category: categoryMap[font.category] ?? 'Body / Supporting',
    family: `"${font.family}", ${font.category}`,
    id: font.family.toLowerCase().replace(/\s+/g, '-'),
    label: font.family,
    loader: 'google',
    previewFamily: `"${font.family}", ${font.category}`,
  }
}
