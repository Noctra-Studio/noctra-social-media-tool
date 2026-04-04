import type { SocialConnectionRow } from '@/types/social'

type PersistableConnection = Pick<
  SocialConnectionRow,
  | 'access_token'
  | 'account_avatar'
  | 'account_id'
  | 'account_name'
  | 'platform'
  | 'refresh_token'
  | 'scopes'
  | 'token_expires_at'
> & {
  is_active?: boolean
  last_synced_at?: string | null
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function requireOk(response: Response, label: string) {
  if (response.ok) {
    return
  }

  throw new Error(`${label} failed with ${response.status}`)
}

function splitScopes(value: string, separator: RegExp | string = /[,\s]+/) {
  return value
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function buildInstagramAuthorizeUrl({
  baseUrl,
  state,
}: {
  baseUrl: string
  state: string
}) {
  const params = new URLSearchParams({
    client_id: requireEnv('META_APP_ID'),
    redirect_uri: `${baseUrl}/api/auth/social/instagram/callback`,
    response_type: 'code',
    scope:
      process.env.META_INSTAGRAM_SCOPES?.trim() ||
      'instagram_business_basic,instagram_business_manage_insights',
    state,
  })

  return `https://www.instagram.com/oauth/authorize?${params.toString()}`
}

export async function exchangeInstagramCode({
  baseUrl,
  code,
}: {
  baseUrl: string
  code: string
}): Promise<PersistableConnection> {
  const clientId = requireEnv('META_APP_ID')
  const clientSecret = requireEnv('META_APP_SECRET')
  const redirectUri = `${baseUrl}/api/auth/social/instagram/callback`

  const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
    cache: 'no-store',
    method: 'POST',
  })
  requireOk(tokenResponse, 'Instagram token exchange')
  const shortLivedToken = (await tokenResponse.json()) as {
    access_token?: string
    user_id?: string
  }

  if (!shortLivedToken.access_token) {
    throw new Error('Instagram token exchange did not return an access token')
  }

  const longLivedUrl = new URL('https://graph.instagram.com/access_token')
  longLivedUrl.searchParams.set('grant_type', 'ig_exchange_token')
  longLivedUrl.searchParams.set('client_secret', clientSecret)
  longLivedUrl.searchParams.set('access_token', shortLivedToken.access_token)

  const longLivedResponse = await fetch(longLivedUrl, { cache: 'no-store' })
  requireOk(longLivedResponse, 'Instagram long-lived token exchange')
  const longLivedToken = (await longLivedResponse.json()) as {
    access_token?: string
    expires_in?: number
  }
  const activeToken = longLivedToken.access_token || shortLivedToken.access_token

  const profileUrl = new URL('https://graph.instagram.com/me')
  profileUrl.searchParams.set('fields', 'id,username,profile_picture_url')
  profileUrl.searchParams.set('access_token', activeToken)

  const profileResponse = await fetch(profileUrl, { cache: 'no-store' })
  requireOk(profileResponse, 'Instagram profile lookup')
  const profile = (await profileResponse.json()) as {
    id?: string
    profile_picture_url?: string
    username?: string
  }
  const scopeValue =
    process.env.META_INSTAGRAM_SCOPES?.trim() ||
    'instagram_business_basic,instagram_business_manage_insights'

  return {
    access_token: activeToken,
    account_avatar: profile.profile_picture_url ?? null,
    account_id: profile.id ?? shortLivedToken.user_id ?? null,
    account_name: profile.username ? `@${profile.username}` : null,
    platform: 'instagram',
    refresh_token: null,
    scopes: splitScopes(scopeValue, ','),
    token_expires_at: longLivedToken.expires_in
      ? new Date(Date.now() + longLivedToken.expires_in * 1000).toISOString()
      : null,
  }
}

function buildLinkedInHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'LinkedIn-Version': process.env.LINKEDIN_API_VERSION?.trim() || '202602',
    'X-Restli-Protocol-Version': '2.0.0',
  }
}

export function buildLinkedInAuthorizeUrl({
  baseUrl,
  state,
}: {
  baseUrl: string
  state: string
}) {
  const params = new URLSearchParams({
    client_id: requireEnv('LINKEDIN_CLIENT_ID'),
    redirect_uri: `${baseUrl}/api/auth/social/linkedin/callback`,
    response_type: 'code',
    scope:
      process.env.LINKEDIN_SCOPES?.trim() || 'openid profile email rw_organization_admin',
    state,
  })

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
}

export async function exchangeLinkedInCode({
  baseUrl,
  code,
}: {
  baseUrl: string
  code: string
}): Promise<PersistableConnection> {
  const clientId = requireEnv('LINKEDIN_CLIENT_ID')
  const clientSecret = requireEnv('LINKEDIN_CLIENT_SECRET')
  const redirectUri = `${baseUrl}/api/auth/social/linkedin/callback`

  const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
    cache: 'no-store',
    method: 'POST',
  })
  requireOk(tokenResponse, 'LinkedIn token exchange')
  const tokenPayload = (await tokenResponse.json()) as {
    access_token?: string
    expires_in?: number
    refresh_token?: string
  }

  if (!tokenPayload.access_token) {
    throw new Error('LinkedIn token exchange did not return an access token')
  }

  const userInfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${tokenPayload.access_token}`,
    },
  })
  requireOk(userInfoResponse, 'LinkedIn user info lookup')
  const userInfo = (await userInfoResponse.json()) as {
    email?: string
    name?: string
    picture?: string
    sub?: string
  }

  const organizationsResponse = await fetch(
    'https://api.linkedin.com/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED',
    {
      cache: 'no-store',
      headers: buildLinkedInHeaders(tokenPayload.access_token),
    }
  )
  requireOk(organizationsResponse, 'LinkedIn organization ACL lookup')
  const organizationsPayload = (await organizationsResponse.json()) as {
    elements?: Array<{
      organization?: string
      organizationTarget?: string
    }>
  }
  const organizationUrn =
    organizationsPayload.elements?.[0]?.organizationTarget ??
    organizationsPayload.elements?.[0]?.organization ??
    null

  let organizationName: string | null = null

  if (organizationUrn) {
    const organizationId = organizationUrn.split(':').pop()

    if (organizationId) {
      const organizationResponse = await fetch(
        `https://api.linkedin.com/rest/organizations/${organizationId}`,
        {
          cache: 'no-store',
          headers: buildLinkedInHeaders(tokenPayload.access_token),
        }
      )

      if (organizationResponse.ok) {
        const organizationPayload = (await organizationResponse.json()) as {
          localizedName?: string
        }
        organizationName = organizationPayload.localizedName ?? null
      }
    }
  }

  return {
    access_token: tokenPayload.access_token,
    account_avatar: userInfo.picture ?? null,
    account_id: organizationUrn ?? userInfo.sub ?? null,
    account_name: organizationName ?? userInfo.name ?? userInfo.email ?? 'LinkedIn',
    platform: 'linkedin',
    refresh_token: tokenPayload.refresh_token ?? null,
    scopes: splitScopes(
      process.env.LINKEDIN_SCOPES?.trim() || 'openid profile email rw_organization_admin'
    ),
    token_expires_at: tokenPayload.expires_in
      ? new Date(Date.now() + tokenPayload.expires_in * 1000).toISOString()
      : null,
  }
}

export function buildXAuthorizeUrl({
  baseUrl,
  codeChallenge,
  state,
}: {
  baseUrl: string
  codeChallenge: string
  state: string
}) {
  const params = new URLSearchParams({
    client_id: requireEnv('X_CLIENT_ID'),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    redirect_uri: `${baseUrl}/api/auth/social/x/callback`,
    response_type: 'code',
    scope: process.env.X_SCOPES?.trim() || 'tweet.read users.read offline.access',
    state,
  })

  return `https://x.com/i/oauth2/authorize?${params.toString()}`
}

export async function exchangeXCode({
  baseUrl,
  code,
  codeVerifier,
}: {
  baseUrl: string
  code: string
  codeVerifier: string
}): Promise<PersistableConnection> {
  const clientId = requireEnv('X_CLIENT_ID')
  const clientSecret = process.env.X_CLIENT_SECRET?.trim()
  const redirectUri = `${baseUrl}/api/auth/social/x/callback`
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  if (clientSecret) {
    headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
  }

  const tokenResponse = await fetch('https://api.x.com/2/oauth2/token', {
    body: new URLSearchParams({
      client_id: clientId,
      code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
    cache: 'no-store',
    headers,
    method: 'POST',
  })
  requireOk(tokenResponse, 'X token exchange')
  const tokenPayload = (await tokenResponse.json()) as {
    access_token?: string
    expires_in?: number
    refresh_token?: string
    scope?: string
  }

  if (!tokenPayload.access_token) {
    throw new Error('X token exchange did not return an access token')
  }

  const userResponse = await fetch(
    'https://api.x.com/2/users/me?user.fields=profile_image_url,username,name',
    {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${tokenPayload.access_token}`,
      },
    }
  )
  requireOk(userResponse, 'X user lookup')
  const userPayload = (await userResponse.json()) as {
    data?: {
      id?: string
      name?: string
      profile_image_url?: string
      username?: string
    }
  }

  return {
    access_token: tokenPayload.access_token,
    account_avatar: userPayload.data?.profile_image_url ?? null,
    account_id: userPayload.data?.id ?? null,
    account_name: userPayload.data?.username ? `@${userPayload.data.username}` : userPayload.data?.name ?? null,
    platform: 'x',
    refresh_token: tokenPayload.refresh_token ?? null,
    scopes: splitScopes(tokenPayload.scope || process.env.X_SCOPES?.trim() || 'tweet.read users.read offline.access'),
    token_expires_at: tokenPayload.expires_in
      ? new Date(Date.now() + tokenPayload.expires_in * 1000).toISOString()
      : null,
  }
}
