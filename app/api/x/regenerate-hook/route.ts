import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { getGenerationContext, parseAnthropicJson } from '@/lib/social-server'
import { createClient } from '@/lib/supabase/server'
import { isRecord, readString, readXThreadTweets } from '@/lib/social-content'

type HookBody = {
  current_hook?: string
  thread_id?: string
}

type HookResponse = {
  char_count?: number
  hook_note?: string
  hook_strength?: string
  tweet?: string
}

export async function POST(req: Request) {
  try {
    const { user } = await getGenerationContext()
    const body = (await req.json()) as HookBody
    const threadId = body.thread_id?.trim()
    const currentHook = body.current_hook?.trim()

    if (!threadId || !currentHook) {
      return NextResponse.json({ error: 'Missing thread_id or current_hook' }, { status: 400 })
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: `You rewrite only the first tweet hook of a thread for X. Return only valid JSON.`,
      messages: [
        {
          role: 'user',
          content: `Current hook:
${currentHook}

Make it stronger, more specific, and more clickable.
Max 270 characters.
Return ONLY valid JSON:
{
  "tweet": "string",
  "char_count": 123,
  "hook_strength": "strong",
  "hook_note": "string"
}`,
        },
      ],
    })

    const parsed = parseAnthropicJson<HookResponse>(message)
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('posts')
      .select('content, export_metadata')
      .eq('id', threadId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error || !data || !isRecord(data.content)) {
      throw error || new Error('No fue posible encontrar el hilo para actualizar el hook')
    }

    const tweets = readXThreadTweets((data.content as Record<string, unknown>).tweets)
    const nextTweet = readString(parsed.tweet)

    if (tweets.length === 0 || !nextTweet) {
      throw new Error('No se pudo reconstruir el hilo para actualizar el hook')
    }

    const nextTweets = tweets.map((tweet, index) =>
      index === 0
        ? {
            ...tweet,
            char_count: typeof parsed.char_count === 'number' ? parsed.char_count : nextTweet.length,
            content: nextTweet,
          }
        : tweet
    )

    const nextContent = {
      ...(data.content as Record<string, unknown>),
      hook_note: readString(parsed.hook_note),
      hook_strength: readString(parsed.hook_strength),
      tweets: nextTweets,
    }

    const nextMetadata = isRecord(data.export_metadata)
      ? {
          ...data.export_metadata,
          hook_strength: readString(parsed.hook_strength),
          tweet_count: nextTweets.length,
        }
      : {
          hook_strength: readString(parsed.hook_strength),
          tweet_count: nextTweets.length,
        }

    const { error: updateError } = await supabase
      .from('posts')
      .update({
        content: nextContent,
        export_metadata: nextMetadata,
      })
      .eq('id', threadId)
      .eq('user_id', user.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      char_count: typeof parsed.char_count === 'number' ? parsed.char_count : nextTweet.length,
      hook_note: readString(parsed.hook_note),
      hook_strength: readString(parsed.hook_strength),
      post_id: threadId,
      tweet: nextTweet,
      tweets: nextTweets,
    })
  } catch (error: unknown) {
    console.error('Error regenerating X hook:', error)
    const msg = error instanceof Error ? error.message : 'Failed to regenerate hook'

    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
