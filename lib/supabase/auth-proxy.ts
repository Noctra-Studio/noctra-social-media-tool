import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabasePublicConfig } from '@/lib/supabase/config'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })
  const isLoginRoute = request.nextUrl.pathname.startsWith('/login')
  const config = getSupabasePublicConfig()

  if (!config.isConfigured || !config.url || !config.anonKey) {
    if (isLoginRoute || request.nextUrl.pathname.startsWith('/api')) {
      return supabaseResponse
    }

    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('setup', 'supabase')
    return NextResponse.redirect(url)
  }

  // Exclude auth endpoints or static assets here if needed, 
  // but middleware matcher typically handles it.

  const supabase = createServerClient(
    config.url,
    config.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !isLoginRoute && request.nextUrl.pathname.startsWith('/app')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // NOTE: since this is an internal tool, all paths other than /login are essentially protected.
  // We'll protect everything except /login and /api/auth.
  if (!user && !isLoginRoute && !request.nextUrl.pathname.startsWith('/api')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in and visits /login, redirect to the dashboard home
  if (user && isLoginRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
