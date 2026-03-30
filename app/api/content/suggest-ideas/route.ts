import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { withUserInputLanguageRule } from '@/lib/ai/language-rule'
import { stripMarkdownJSON } from '@/lib/ai/strip-markdown-json'
import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import type { Platform, SuggestedIdea } from '@/lib/product'

function isPlatform(value: unknown): value is Platform {
  return value === 'instagram' || value === 'linkedin' || value === 'x'
}

type RecentPostRow = {
  angle: string | null
  content: { caption?: string; thread?: string[] } | null
  platform: Platform
}

type StoredIdeaRow = {
  platform: Platform | null
  raw_idea: string
}

export async function POST(req: Request) {
  try {
    let user

    try {
      user = await getUser()
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as { platform?: unknown }

    if (!isPlatform(body.platform)) {
      return NextResponse.json({ error: 'Missing or invalid platform' }, { status: 400 })
    }

    const supabase = await createClient()
    const [{ data: recentPosts, error: postsError }, { data: storedIdeas, error: ideasError }] =
      await Promise.all([
        supabase
          .from('posts')
          .select('platform, angle, content')
          .eq('user_id', user.id)
          .eq('platform', body.platform)
          .neq('status', 'draft')
          .order('created_at', { ascending: false })
          .limit(12),
        supabase
          .from('content_ideas')
          .select('raw_idea, platform')
          .eq('user_id', user.id)
          .eq('status', 'raw')
          .order('created_at', { ascending: true })
          .limit(10),
      ])

    if (postsError || ideasError) {
      throw new Error(postsError?.message || ideasError?.message || 'Failed to load context')
    }

    const recentSummary = ((recentPosts || []) as RecentPostRow[])
      .map((post) => {
        const caption = post.content?.caption
        const thread = post.content?.thread?.join(' ')
        const contentPreview = caption || thread || 'Sin preview'
        return `- ${post.platform} | ángulo: ${post.angle || 'sin ángulo'} | contenido: ${contentPreview.slice(
          0,
          180
        )}`
      })
      .join('\n')

    const storedIdeasSummary = ((storedIdeas || []) as StoredIdeaRow[])
      .map((idea) => `- ${idea.platform || 'sin plataforma'} | ${idea.raw_idea.slice(0, 180)}`)
      .join('\n')

    const prompt = `You are a content strategist for Noctra Studio, a boutique digital agency in Querétaro serving LATAM clients.
Generate exactly 3 fresh content ideas for ${body.platform}.

Constraints:
- Language: Spanish (LATAM)
- Audience: SMBs, founders, independent professionals in LATAM
- Themes: branding, websites, automation, digital strategy, design systems, content operations, conversion, positioning
- Avoid repeating recent posts
- You MAY build on unresolved stored ideas if relevant, but improve them
- Tone: calm, direct, purposeful, no fluff

Recent posts to avoid repeating:
${recentSummary || '- Sin historial reciente'}

Stored unresolved ideas:
${storedIdeasSummary || '- Sin ideas guardadas'}

Return ONLY JSON with this structure:
{
  "ideas": [
    {
      "title": "Idea title",
      "angle": "content angle",
      "hook": "scroll-stopping hook",
      "why_now": "short explanation of why this matters now"
    }
  ]
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      system: withUserInputLanguageRule('You output only pure JSON.'),
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = message.content[0]?.type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(stripMarkdownJSON(responseText)) as { ideas?: SuggestedIdea[] }

    return NextResponse.json({ ideas: parsed.ideas || [] })
  } catch (error) {
    console.error('Suggest ideas error:', {
      name: error instanceof Error ? error.name : 'unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to suggest ideas' },
      { status: 500 }
    )
  }
}
