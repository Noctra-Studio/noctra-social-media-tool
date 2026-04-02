import { NextResponse } from 'next/server'
import { getGenerationContext } from '@/lib/social-server'
import { normalizePillarColor, type BrandPillar } from '@/lib/brand-strategy'
import type { Platform } from '@/lib/product'

type PostRow = {
  angle: string | null
  content: Record<string, unknown> | null
  created_at: string
  pillar_id: string | null
  platform: Platform
  status: string | null
}

type FeedbackRow = {
  post_id: string
  rating: number | null
  used_as_published: boolean | null
}

type PillarSummary = {
  pillar_color: string
  pillar_id: string
  pillar_name: string
  count: number
  percentage: number
}

function roundPercentage(value: number, total: number) {
  if (total <= 0) {
    return 0
  }

  return Math.round((value / total) * 100)
}

function getWeekWindows(referenceDate = new Date()) {
  return Array.from({ length: 4 }, (_, index) => {
    const end = new Date(referenceDate)
    end.setHours(23, 59, 59, 999)
    end.setDate(end.getDate() - index * 7)

    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)

    return { start, end }
  }).reverse()
}

function getWeekStreak(windows: Array<{ start: Date; end: Date }>, posts: PostRow[]) {
  let streak = 0

  for (let index = windows.length - 1; index >= 0; index -= 1) {
    const window = windows[index]
    const hasPost = posts.some((post) => {
      const createdAt = new Date(post.created_at)
      return createdAt >= window.start && createdAt <= window.end
    })

    if (!hasPost) {
      break
    }

    streak += 1
  }

  return streak
}

export async function GET() {
  try {
    const { supabase, user } = await getGenerationContext()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 28)

    const [{ data: posts, error: postsError }, { data: feedback, error: feedbackError }, { data: pillars, error: pillarsError }] =
      await Promise.all([
        supabase
          .from('posts')
          .select('id, platform, angle, pillar_id, content, created_at, status')
          .eq('user_id', user.id)
          .gte('created_at', cutoffDate.toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('post_feedback')
          .select('post_id, rating, used_as_published')
          .eq('user_id', user.id),
        supabase
          .from('brand_pillars')
          .select('id, name, color, description, post_count, sort_order')
          .eq('user_id', user.id)
          .order('sort_order', { ascending: true }),
      ])

    if (postsError || feedbackError || pillarsError) {
      throw postsError || feedbackError || pillarsError
    }

    const typedPosts = ((posts as Array<PostRow & { id: string }> | null) ?? []).map((post) => ({
      angle: post.angle,
      content: post.content,
      created_at: post.created_at,
      pillar_id: post.pillar_id,
      platform: post.platform,
      status: post.status,
      id: post.id,
    }))
    const typedFeedback = (feedback as FeedbackRow[] | null) ?? []
    const typedPillars = (pillars as BrandPillar[] | null) ?? []

    const successfulPostIds = new Set(
      typedFeedback
        .filter((item) => (item.rating ?? 0) >= 4 || item.used_as_published)
        .map((item) => item.post_id)
    )

    const totalPosts = typedPosts.length
    const platformCounts = {
      instagram: typedPosts.filter((post) => post.platform === 'instagram').length,
      linkedin: typedPosts.filter((post) => post.platform === 'linkedin').length,
      x: typedPosts.filter((post) => post.platform === 'x').length,
    }

    const pillarBalance: PillarSummary[] = typedPillars.map((pillar) => {
      const matchingPosts = typedPosts.filter((post) => post.pillar_id === pillar.id)

      return {
        pillar_color: normalizePillarColor(pillar.color),
        pillar_id: pillar.id,
        pillar_name: pillar.name,
        count: matchingPosts.length,
        percentage: roundPercentage(matchingPosts.length, totalPosts),
      }
    })

    const angleUsageMap = new Map<
      string,
      { count: number; successCount: number }
    >()

    typedPosts.forEach((post) => {
      const angle = post.angle?.trim()

      if (!angle) {
        return
      }

      const current = angleUsageMap.get(angle) ?? { count: 0, successCount: 0 }
      angleUsageMap.set(angle, {
        count: current.count + 1,
        successCount: current.successCount + (successfulPostIds.has(post.id) ? 1 : 0),
      })
    })

    const topAngles = Array.from(angleUsageMap.entries())
      .sort((left, right) => {
        if (right[1].count !== left[1].count) {
          return right[1].count - left[1].count
        }

        return right[1].successCount - left[1].successCount
      })
      .slice(0, 3)
      .map(([angle, stats]) => ({
        angle,
        count: stats.count,
      }))

    const weekWindows = getWeekWindows()
    const weeksWithTwoPosts = weekWindows.filter((window) => {
      const count = typedPosts.filter((post) => {
        const createdAt = new Date(post.created_at)
        return createdAt >= window.start && createdAt <= window.end
      }).length

      return count >= 2
    }).length

    const consistencyScore = roundPercentage(weeksWithTwoPosts, weekWindows.length)
    const weekStreak = getWeekStreak(weekWindows, typedPosts)
    const dominantPillar = pillarBalance
      .filter((pillar) => pillar.count > 0)
      .sort((left, right) => right.count - left.count)[0]?.pillar_name ?? null
    const underusedPillar =
      pillarBalance.length >= 2
        ? [...pillarBalance].sort((left, right) => left.count - right.count)[0]?.pillar_name ?? null
        : null

    return NextResponse.json({
      total_posts: totalPosts,
      week_streak: weekStreak,
      platform_distribution: {
        instagram: roundPercentage(platformCounts.instagram, totalPosts),
        linkedin: roundPercentage(platformCounts.linkedin, totalPosts),
        x: roundPercentage(platformCounts.x, totalPosts),
      },
      pillar_balance: pillarBalance,
      top_angles: topAngles,
      consistency_score: consistencyScore,
      dominant_pillar: dominantPillar,
      underused_pillar: underusedPillar,
    })
  } catch (error: unknown) {
    console.error('Brand authority error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to load brand authority',
      },
      { status: 500 }
    )
  }
}
