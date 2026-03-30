import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { parseAnthropicJson } from '@/lib/social-server'
import { getUser } from '@/lib/auth/get-user'
import { readInstagramAudioSuggestions } from '@/lib/social-content'

type AudioResponse = {
  suggestions?: unknown
}

export async function POST(req: Request) {
  try {
    await getUser()
    const body = (await req.json()) as { angle?: string; caption?: string }
    const caption = body.caption?.trim()
    const angle = body.angle?.trim()

    if (!caption || !angle) {
      return NextResponse.json({ error: 'Missing caption or angle' }, { status: 400 })
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 700,
      system: `Suggest 3 royalty-free audio tracks or music styles that would complement this Instagram post. Consider the mood and content.
Respond ONLY with JSON:
{ "suggestions": [{
    "style": "string",
    "mood": "string",
    "search_query": "string",
    "why": "string"
}] }`,
      messages: [
        {
          role: 'user',
          content: `Caption:
${caption}

Angle:
${angle}`,
        },
      ],
    })

    const parsed = parseAnthropicJson<AudioResponse>(message)

    return NextResponse.json({
      suggestions: readInstagramAudioSuggestions(parsed.suggestions).slice(0, 3),
    })
  } catch (error: unknown) {
    console.error('Error generating Instagram audio suggestions:', error)
    const msg = error instanceof Error ? error.message : 'Failed to generate audio suggestions'

    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
