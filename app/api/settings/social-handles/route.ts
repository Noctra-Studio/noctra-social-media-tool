import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'

type SocialHandles = {
  instagram?: string
  linkedin?: string
  x?: string
}

function sanitizeHandles(handles: unknown): SocialHandles | null {
  if (!handles || typeof handles !== 'object') {
    return null
  }

  const candidate = handles as Record<string, unknown>

  return {
    instagram: typeof candidate.instagram === 'string' ? candidate.instagram.trim() : '',
    linkedin: typeof candidate.linkedin === 'string' ? candidate.linkedin.trim() : '',
    x: typeof candidate.x === 'string' ? candidate.x.trim() : '',
  }
}

export async function POST(req: Request) {
  try {
    let user

    try {
      user = await getUser()
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as { social_handles?: unknown }
    const socialHandles = sanitizeHandles(body.social_handles)

    if (!socialHandles) {
      return NextResponse.json({ error: 'Invalid social handles payload' }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase.from('profiles').upsert(
      {
        email: user.email || '',
        id: user.id,
        social_handles: socialHandles,
      },
      { onConflict: 'id' }
    )

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Social handles error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save social handles' },
      { status: 500 }
    )
  }
}
