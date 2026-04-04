import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { getUser } from '@/lib/auth/get-user'

type RouteUserResult =
  | { response: null; user: User }
  | { response: NextResponse; user: null }

export async function requireRouteUser(): Promise<RouteUserResult> {
  try {
    const user = await getUser()
    return { response: null, user }
  } catch {
    return {
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      user: null,
    }
  }
}
