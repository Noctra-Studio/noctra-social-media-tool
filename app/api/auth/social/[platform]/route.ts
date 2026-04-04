import { NextResponse } from 'next/server'
import {
  createCodeChallenge,
  createCodeVerifier,
  createOAuthNonce,
  encodeOAuthState,
  getAppBaseUrl,
  persistOAuthState,
} from '@/lib/social/oauth'
import {
  buildInstagramAuthorizeUrl,
  buildLinkedInAuthorizeUrl,
  buildXAuthorizeUrl,
} from '@/lib/social/providers'
import { isSocialMetricPlatform } from '@/lib/social/platforms'
import { requireActiveWorkspaceRouteContext } from '@/lib/workspace/route'

export async function GET(
  request: Request,
  context: { params: Promise<{ platform: string }> }
) {
  const { platform } = await context.params

  if (!isSocialMetricPlatform(platform)) {
    return NextResponse.json({ error: 'Unsupported social platform.' }, { status: 400 })
  }

  const workspaceContext = await requireActiveWorkspaceRouteContext()

  if ('response' in workspaceContext) {
    return workspaceContext.response
  }

  const baseUrl = getAppBaseUrl(request)
  const nonce = createOAuthNonce()

  if (platform === 'x') {
    const codeVerifier = createCodeVerifier()
    const state = encodeOAuthState({
      codeVerifier,
      nonce,
      platform,
      workspaceId: workspaceContext.workspaceId,
    })

    await persistOAuthState({
      codeVerifier,
      nonce,
      platform,
      workspaceId: workspaceContext.workspaceId,
    })

    return NextResponse.redirect(
      buildXAuthorizeUrl({
        baseUrl,
        codeChallenge: createCodeChallenge(codeVerifier),
        state,
      })
    )
  }

  const state = encodeOAuthState({
    nonce,
    platform,
    workspaceId: workspaceContext.workspaceId,
  })

  await persistOAuthState({
    nonce,
    platform,
    workspaceId: workspaceContext.workspaceId,
  })

  const url =
    platform === 'instagram'
      ? buildInstagramAuthorizeUrl({ baseUrl, state })
      : buildLinkedInAuthorizeUrl({ baseUrl, state })

  return NextResponse.redirect(url)
}
