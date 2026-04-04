import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabasePublicConfig } from '@/lib/supabase/config'

const publicRoutes = new Set(['/', '/login', '/es/terminos', '/es/privacidad'])
const adminRoutePrefix = '/admin'
const onboardingRoutePrefix = '/onboarding'
const dashboardRoutePrefixes = [
  '/calendar',
  '/compose',
  '/home',
  '/ideas',
  '/metrics',
  '/settings',
  '/templates',
  '/tutorial',
  '/visual',
]

function isDashboardRoute(pathname: string) {
  return dashboardRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  return NextResponse.redirect(url)
}

async function readWorkspaceOnboardingState(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
) {
  const [{ data: profile, error: profileError }, { data: memberships, error: membershipsError }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('current_workspace_id')
        .eq('id', userId)
        .maybeSingle(),
      supabase.from('workspace_members').select('workspace_id').eq('user_id', userId).limit(1),
    ])

  if (profileError || membershipsError) {
    return {
      error: true,
      hasWorkspace: false,
      onboardingCompleted: false,
    }
  }

  const workspaceId = profile?.current_workspace_id ?? memberships?.[0]?.workspace_id ?? null

  if (!workspaceId) {
    return {
      error: false,
      hasWorkspace: false,
      onboardingCompleted: false,
    }
  }

  const { data: config, error: configError } = await supabase
    .from('workspace_config')
    .select('brand_name, onboarding_completed')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (configError) {
    return {
      error: true,
      hasWorkspace: true,
      onboardingCompleted: false,
    }
  }

  return {
    error: false,
    hasWorkspace: true,
    onboardingCompleted: Boolean(
      config?.brand_name?.trim() && config?.onboarding_completed
    ),
  }
}

function isPublicRoute(pathname: string) {
  // Common public routes without locale
  if (publicRoutes.has(pathname)) return true

  // Handle localized routes (e.g., /es, /es/login, /es/terminos)
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return true // Root is public
  
  // If first segment is a 2-letter locale
  if (segments[0] && segments[0].length === 2) {
    const internalPath = segments.length === 1 ? '/' : `/${segments.slice(1).join('/')}`
    return publicRoutes.has(internalPath)
  }

  return false
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })
  const pathname = request.nextUrl.pathname
  const isPublicPath = isPublicRoute(pathname)
  const config = getSupabasePublicConfig()

  if (!config.isConfigured || !config.url || !config.anonKey) {
    if (isPublicPath || pathname.startsWith('/api')) {
      return supabaseResponse
    }

    const redirect = request.nextUrl.clone()
    redirect.pathname = '/login'
    redirect.searchParams.set('setup', 'supabase')
    return NextResponse.redirect(redirect)
  }

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

  if (!user && !isPublicPath && !pathname.startsWith('/api')) {
    return redirectTo(request, '/login')
  }

  if (!user) {
    return supabaseResponse
  }

  if (pathname.startsWith(adminRoutePrefix)) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('noctra_role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || profile?.noctra_role !== 'noctra_admin') {
      return redirectTo(request, '/login')
    }

    return supabaseResponse
  }

  if (pathname.startsWith(onboardingRoutePrefix)) {
    const state = await readWorkspaceOnboardingState(supabase, user.id)

    if (state.hasWorkspace && state.onboardingCompleted) {
      return redirectTo(request, '/compose')
    }

    return supabaseResponse
  }

  if (isDashboardRoute(pathname)) {
    const state = await readWorkspaceOnboardingState(supabase, user.id)

    if (state.error || !state.hasWorkspace || !state.onboardingCompleted) {
      return redirectTo(request, '/onboarding')
    }
  }

  const segments = pathname.split('/').filter(Boolean)
  const isLoginPage = pathname === '/login' || (segments.length === 2 && segments[1] === 'login')

  if (isLoginPage) {
    const state = await readWorkspaceOnboardingState(supabase, user.id)

    if (state.hasWorkspace && state.onboardingCompleted) {
      return redirectTo(request, '/compose')
    }

    // If authenticated but not onboarded, we ALLOW them to see the login page.
    // This allows them to sign out or switch accounts if they've accidentally
    // logged in with the wrong user before starting onboarding.
    return supabaseResponse
  }

  // Redirect from landing (/) for authenticated users
  const isRoot = pathname === '/' || (segments.length === 1 && segments[0].length === 2)
  if (isRoot) {
    const state = await readWorkspaceOnboardingState(supabase, user.id)

    if (state.hasWorkspace && state.onboardingCompleted) {
      return redirectTo(request, '/compose')
    }

    // No workspace or DB error → send to login so the user can sign in
    // with the correct account (or sign out and try again)
    if (state.error || !state.hasWorkspace) {
      return redirectTo(request, '/login')
    }

    // Has workspace but onboarding not finished → onboarding flow
    return redirectTo(request, '/onboarding')
  }

  return supabaseResponse
}
