import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/get-user'
import { platforms, type Platform, type SuggestionCard } from '@/lib/product'

type PostRow = {
  created_at: string | null
  platform: Platform
  published_at: string | null
  scheduled_at: string | null
  status: string | null
}

type IdeaRow = {
  created_at: string | null
  id: string
  platform: Platform | null
  raw_idea: string
}

function getReferenceDate(post: PostRow) {
  return post.published_at || post.scheduled_at || post.created_at
}

function getAgeLabel(daysSinceLastPost: number | null) {
  if (daysSinceLastPost === null) {
    return 'Sin publicaciones recientes'
  }

  if (daysSinceLastPost === 0) {
    return 'Publicado hoy'
  }

  if (daysSinceLastPost === 1) {
    return 'Hace 1 día'
  }

  return `Hace ${daysSinceLastPost} días`
}

function trimIdea(rawIdea: string) {
  return rawIdea.length > 72 ? `${rawIdea.slice(0, 69)}...` : rawIdea
}

export async function GET() {
  try {
    try {
      await getUser()
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const [{ data: posts, error: postsError }, { data: rawIdeas, error: ideasError }] =
      await Promise.all([
        supabase
          .from('posts')
          .select('platform, created_at, scheduled_at, published_at, status')
          .neq('status', 'draft'),
        supabase
          .from('content_ideas')
          .select('id, raw_idea, platform, created_at')
          .eq('status', 'raw')
          .order('created_at', { ascending: true }),
      ])

    if (postsError || ideasError) {
      throw new Error(postsError?.message || ideasError?.message || 'Failed to build suggestions')
    }

    const now = Date.now()
    const typedPosts = (posts || []) as PostRow[]
    const typedIdeas = (rawIdeas || []) as IdeaRow[]

    const suggestions: SuggestionCard[] = platforms.map((platform) => {
      const latestForPlatform = typedPosts
        .filter((post) => post.platform === platform)
        .map((post) => getReferenceDate(post))
        .filter((value): value is string => Boolean(value))
        .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0]

      const daysSinceLastPost = latestForPlatform
        ? Math.floor((now - new Date(latestForPlatform).getTime()) / 86_400_000)
        : null

      const platformIdea =
        typedIdeas.find((idea) => idea.platform === platform) ||
        typedIdeas.find((idea) => idea.platform === null) ||
        typedIdeas[0] ||
        null

      if (platformIdea) {
        return {
          ageLabel: getAgeLabel(daysSinceLastPost),
          daysSinceLastPost,
          ideaId: platformIdea.id,
          ideaText: platformIdea.raw_idea,
          platform,
          reason: `Tienes una idea guardada sobre ${trimIdea(platformIdea.raw_idea)} sin desarrollar.`,
          suggestionType: 'develop_saved_idea',
        }
      }

      return {
        ageLabel: getAgeLabel(daysSinceLastPost),
        daysSinceLastPost,
        ideaId: null,
        ideaText: `Propón una idea fresca para ${platform}`,
        platform,
        reason:
          daysSinceLastPost === null
            ? `Aún no has construido un ritmo para ${platform}. Conviene empezar con una pieza simple y útil.`
            : `Tu ritmo en ${platform} se enfrió un poco. Es buen momento para publicar una idea corta y accionable.`,
        suggestionType: 'fresh_prompt',
      }
    })

    suggestions.sort((left, right) => {
      const leftScore = left.daysSinceLastPost ?? Number.MAX_SAFE_INTEGER
      const rightScore = right.daysSinceLastPost ?? Number.MAX_SAFE_INTEGER

      return rightScore - leftScore
    })

    return NextResponse.json({ suggestions: suggestions.slice(0, 3) })
  } catch (error) {
    console.error('Home suggestions error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load suggestions' },
      { status: 500 }
    )
  }
}
