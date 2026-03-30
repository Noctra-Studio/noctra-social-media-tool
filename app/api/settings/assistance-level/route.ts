import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import type { AssistanceLevel } from '@/lib/product'

function isAssistanceLevel(value: unknown): value is AssistanceLevel {
  return value === 'guided' || value === 'balanced' || value === 'expert'
}

export async function POST(req: Request) {
  try {
    let user

    try {
      user = await getUser()
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as { assistance_level?: unknown }

    if (!isAssistanceLevel(body.assistance_level)) {
      return NextResponse.json({ error: 'Invalid assistance level' }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase.from('profiles').upsert(
      {
        assistance_level: body.assistance_level,
        email: user.email || '',
        id: user.id,
      },
      { onConflict: 'id' }
    )

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Assistance level error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save assistance level' },
      { status: 500 }
    )
  }
}
