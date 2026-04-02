import { NextResponse } from 'next/server'

const GOOGLE_FONTS_API_KEY = process.env.GOOGLE_FONTS_API_KEY
const CACHE_TTL = 24 * 60 * 60 * 1000

let cachedFonts: GoogleFont[] | null = null
let cacheTimestamp = 0

export type GoogleFont = {
  family: string
  category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace'
  variants: string[]
  subsets: string[]
  popularity: number
}

const ALLOWED_CATEGORIES = ['sans-serif', 'serif', 'display', 'monospace']

const EXCLUDED_FAMILIES = [
  'Hachi Maru Pop',
  'Zen Tokyo Zoo',
  'Boogaloo',
  'Lily Script One',
  'Fruktur',
  'Mystery Quest',
]

function applyFilters(fonts: GoogleFont[], req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')?.toLowerCase() || ''
  const category = searchParams.get('category') || ''
  const parsedLimit = Number.parseInt(searchParams.get('limit') || '200', 10)
  const limit = Number.isFinite(parsedLimit) ? parsedLimit : 200

  let filtered = fonts

  if (query) {
    filtered = filtered.filter((font) => font.family.toLowerCase().includes(query))
  }

  if (category) {
    filtered = filtered.filter((font) => font.category === category)
  }

  return {
    fonts: filtered.slice(0, Math.max(limit, 0)),
    total: filtered.length,
  }
}

export async function GET(req: Request) {
  try {
    if (!GOOGLE_FONTS_API_KEY) {
      return NextResponse.json({
        fonts: [],
        source: 'fallback',
        message: 'GOOGLE_FONTS_API_KEY not configured',
      })
    }

    const now = Date.now()
    if (cachedFonts && now - cacheTimestamp < CACHE_TTL) {
      const filtered = applyFilters(cachedFonts, req)
      return NextResponse.json({
        ...filtered,
        source: 'cache',
      })
    }

    const url = `https://www.googleapis.com/webfonts/v1/webfonts?key=${GOOGLE_FONTS_API_KEY}&sort=popularity`
    const res = await fetch(url, {
      next: { revalidate: 86400 },
    })

    if (!res.ok) {
      throw new Error(`Google Fonts API error: ${res.status}`)
    }

    const data = (await res.json()) as {
      items: Array<{
        family: string
        category: string
        variants: string[]
        subsets: string[]
      }>
    }

    const fonts: GoogleFont[] = data.items
      .filter(
        (item) =>
          ALLOWED_CATEGORIES.includes(item.category) &&
          !EXCLUDED_FAMILIES.includes(item.family) &&
          item.subsets.includes('latin')
      )
      .slice(0, 500)
      .map((item, index) => ({
        family: item.family,
        category: item.category as GoogleFont['category'],
        variants: item.variants,
        subsets: item.subsets,
        popularity: index,
      }))

    cachedFonts = fonts
    cacheTimestamp = Date.now()

    const filtered = applyFilters(fonts, req)

    return NextResponse.json({
      ...filtered,
      source: 'api',
    })
  } catch (error) {
    console.error('Google Fonts API error:', error)

    return NextResponse.json(
      {
        fonts: [],
        source: 'error',
        error: error instanceof Error ? error.message : 'Failed to fetch fonts',
      },
      { status: 500 }
    )
  }
}
