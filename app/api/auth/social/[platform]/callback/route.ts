import { NextResponse } from 'next/server'
import { requireRouteUser } from '@/lib/auth/require-route-user'
import { clearPersistedOAuthState, decodeOAuthState, getAppBaseUrl, readPersistedOAuthState } from '@/lib/social/oauth'
import {
  exchangeInstagramCode,
  exchangeLinkedInCode,
  exchangeXCode,
} from '@/lib/social/providers'
import { isSocialMetricPlatform } from '@/lib/social/platforms'
import { createAdminClient } from '@/lib/supabase'

function buildSettingsRedirect(baseUrl: string, search: Record<string, string | null | undefined>) {
  const url = new URL(`${baseUrl}/settings`)
  url.searchParams.set('section', 'studio')
  url.searchParams.set('tab', 'accounts')

  for (const [key, value] of Object.entries(search)) {
    if (value) {
      url.searchParams.set(key, value)
    }
  }

  return url
}

export async function GET(
  request: Request,
  context: { params: Promise<{ platform: string }> }
) {
  const { platform } = await context.params
  const baseUrl = getAppBaseUrl(request)
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const stateValue = url.searchParams.get('state')
  const error = url.searchParams.get('error')
  const persistedState = await readPersistedOAuthState()

  if (!isSocialMetricPlatform(platform)) {
    return NextResponse.redirect(buildSettingsRedirect(baseUrl, { error: 'unsupported-platform' }))
  }

  if (error) {
    await clearPersistedOAuthState()
    return NextResponse.redirect(buildSettingsRedirect(baseUrl, { error: `${platform}-oauth` }))
  }

  if (!code || !stateValue || !persistedState) {
    await clearPersistedOAuthState()
    return NextResponse.redirect(buildSettingsRedirect(baseUrl, { error: `${platform}-state` }))
  }

  try {
    const decodedState = decodeOAuthState(stateValue)

    if (
      decodedState.nonce !== persistedState.nonce ||
      decodedState.platform !== persistedState.platform ||
      decodedState.workspaceId !== persistedState.workspaceId
    ) {
      throw new Error('OAuth state mismatch')
    }

    const routeUser = await requireRouteUser()

    if (routeUser.response || !routeUser.user) {
      return NextResponse.redirect(new URL('/login', baseUrl))
    }

    const admin = createAdminClient()
    const { data: membership, error: membershipError } = await admin
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', routeUser.user.id)
      .eq('workspace_id', persistedState.workspaceId)
      .maybeSingle()

    if (membershipError) {
      throw membershipError
    }

    if (!membership) {
      throw new Error('User no longer has access to the workspace used for this connection')
    }

    const payload =
      platform === 'instagram'
        ? await exchangeInstagramCode({ baseUrl, code })
        : platform === 'linkedin'
          ? await exchangeLinkedInCode({ baseUrl, code })
          : await exchangeXCode({
              baseUrl,
              code,
              codeVerifier: (() => {
                if (!persistedState.codeVerifier) {
                  throw new Error('Missing PKCE verifier for X OAuth callback')
                }

                return persistedState.codeVerifier
              })(),
            })

    const { error: upsertError } = await admin.from('social_connections').upsert(
      {
        ...payload,
        is_active: true,
        workspace_id: persistedState.workspaceId,
      },
      {
        onConflict: 'workspace_id,platform',
      }
    )

    if (upsertError) {
      throw upsertError
    }

    return NextResponse.redirect(
      buildSettingsRedirect(baseUrl, {
        connected: platform,
        success: 'oauth-connected',
      })
    )
  } catch (callbackError) {
    console.error('Social OAuth callback failed', callbackError)

    return NextResponse.redirect(
      buildSettingsRedirect(baseUrl, {
        error: `${platform}-callback`,
      })
    )
  } finally {
    await clearPersistedOAuthState()
  }
}
