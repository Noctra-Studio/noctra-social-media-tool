import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import {
  isMissingStrategyTablesError,
  languageLevelOptions,
  normalizePillarColor,
  sanitizeStrategyText,
  sanitizeStringArray,
  type BrandPillar,
  type LanguageLevel,
  type PlatformAudience,
  type StrategyResponse,
} from '@/lib/brand-strategy'
import { platforms, type Platform } from '@/lib/product'

type StrategyBody = {
  audiences?: Array<{
    audience_description?: string | null
    desired_outcomes?: string[] | null
    language_level?: string | null
    pain_points?: string[] | null
    platform?: string | null
  }>
  pillars?: Array<{
    color?: string | null
    description?: string | null
    id?: string | null
    name?: string | null
    sort_order?: number | null
  }>
}

function isPlatform(value: string | null | undefined): value is Platform {
  return Boolean(value && platforms.includes(value as Platform))
}

function isLanguageLevel(value: string | null | undefined): value is LanguageLevel {
  return Boolean(value && languageLevelOptions.includes(value as LanguageLevel))
}

async function loadStrategy(userId: string): Promise<StrategyResponse> {
  const supabase = await createClient()
  const [{ data: pillars, error: pillarsError }, { data: audiences, error: audiencesError }, { data: posts, error: postsError }] =
    await Promise.all([
      supabase.from('brand_pillars').select('id, name, description, color, post_count, sort_order').order('sort_order', { ascending: true }),
      supabase.from('platform_audiences').select('id, platform, audience_description, pain_points, desired_outcomes, language_level, updated_at'),
      supabase.from('posts').select('pillar_id').eq('user_id', userId).not('pillar_id', 'is', null),
    ])

  if (pillarsError || audiencesError || postsError) {
    if (
      isMissingStrategyTablesError(pillarsError) ||
      isMissingStrategyTablesError(audiencesError)
    ) {
      return {
        audiences: [],
        pillars: [],
      }
    }

    throw pillarsError || audiencesError || postsError
  }

  const postCountByPillar = new Map<string, number>()

  for (const post of posts || []) {
    if (!post.pillar_id) {
      continue
    }

    postCountByPillar.set(post.pillar_id, (postCountByPillar.get(post.pillar_id) || 0) + 1)
  }

  return {
    audiences: ((audiences as PlatformAudience[] | null) || []).sort((left, right) => platforms.indexOf(left.platform) - platforms.indexOf(right.platform)),
    pillars: ((pillars as BrandPillar[] | null) || []).map((pillar) => ({
      ...pillar,
      post_count: postCountByPillar.get(pillar.id) || 0,
    })),
  }
}

export async function GET() {
  try {
    const user = await getUser()
    const strategy = await loadStrategy(user.id)

    return NextResponse.json(strategy)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load strategy' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser()
    const body = (await req.json()) as StrategyBody
    const rawPillars = body.pillars || []
    const rawAudiences = body.audiences || []

    if (rawPillars.length > 4) {
      return NextResponse.json({ error: 'Solo puedes guardar hasta 4 pilares.' }, { status: 400 })
    }

    const pillars = rawPillars
      .map((pillar, index) => ({
        color: normalizePillarColor(pillar.color),
        description: sanitizeStrategyText(pillar.description),
        id: pillar.id?.trim() || null,
        name: sanitizeStrategyText(pillar.name),
        sort_order: typeof pillar.sort_order === 'number' ? pillar.sort_order : index,
      }))
      .filter((pillar) => pillar.name)

    const audiences = rawAudiences
      .map((audience) => ({
        audience_description: sanitizeStrategyText(audience.audience_description),
        desired_outcomes: sanitizeStringArray(audience.desired_outcomes),
        language_level: isLanguageLevel(audience.language_level) ? audience.language_level : 'mixed',
        pain_points: sanitizeStringArray(audience.pain_points),
        platform: isPlatform(audience.platform) ? audience.platform : null,
      }))
      .filter((audience): audience is {
        audience_description: string
        desired_outcomes: string[]
        language_level: LanguageLevel
        pain_points: string[]
        platform: Platform
      } => Boolean(audience.platform))

    const supabase = await createClient()
    const { data: existingPillars, error: existingPillarsError } = await supabase
      .from('brand_pillars')
      .select('id')
      .eq('user_id', user.id)

    if (existingPillarsError) {
      if (isMissingStrategyTablesError(existingPillarsError)) {
        return NextResponse.json(
          { error: 'Falta aplicar la migración de estrategia en Supabase.' },
          { status: 503 }
        )
      }

      throw existingPillarsError
    }

    const incomingIds = new Set(pillars.map((pillar) => pillar.id).filter(Boolean) as string[])
    const removableIds = ((existingPillars as Array<{ id: string }> | null) || [])
      .map((pillar) => pillar.id)
      .filter((id) => !incomingIds.has(id))

    if (removableIds.length > 0) {
      const { error } = await supabase.from('brand_pillars').delete().in('id', removableIds)

      if (error) {
        throw error
      }
    }

    const existingRows = pillars.filter((pillar) => pillar.id)
    const newRows = pillars.filter((pillar) => !pillar.id)

    await Promise.all(
      existingRows.map(async (pillar) => {
        const { error } = await supabase
          .from('brand_pillars')
          .update({
            color: pillar.color,
            description: pillar.description,
            name: pillar.name,
            sort_order: pillar.sort_order,
          })
          .eq('id', pillar.id as string)
          .eq('user_id', user.id)

        if (error) {
          throw error
        }
      })
    )

    if (newRows.length > 0) {
      const { error } = await supabase.from('brand_pillars').insert(
        newRows.map((pillar) => ({
          color: pillar.color,
          description: pillar.description,
          name: pillar.name,
          sort_order: pillar.sort_order,
          user_id: user.id,
        }))
      )

      if (error) {
        throw error
      }
    }

    for (const platform of platforms) {
      const audience = audiences.find((item) => item.platform === platform)

      if (!audience) {
        continue
      }

      const { error } = await supabase.from('platform_audiences').upsert(
        {
          audience_description: audience.audience_description,
          desired_outcomes: audience.desired_outcomes,
          language_level: audience.language_level,
          pain_points: audience.pain_points,
          platform,
          updated_at: new Date().toISOString(),
          user_id: user.id,
        },
        { onConflict: 'user_id,platform' }
      )

      if (error) {
        throw error
      }
    }

    const strategy = await loadStrategy(user.id)

    return NextResponse.json(strategy)
  } catch (error) {
    console.error('Strategy settings error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save strategy' },
      { status: 500 }
    )
  }
}
