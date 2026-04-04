import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { cookies } from 'next/headers'
import type { SocialMetricPlatform } from '@/types/social'

const SOCIAL_OAUTH_COOKIE = 'noctra_social_oauth'

export type SocialOAuthState = {
  codeVerifier?: string
  nonce: string
  platform: SocialMetricPlatform
  workspaceId: string
}

function toBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

export function createOAuthNonce() {
  return randomUUID()
}

export function encodeOAuthState(state: SocialOAuthState) {
  return toBase64Url(JSON.stringify(state))
}

export function decodeOAuthState(value: string) {
  return JSON.parse(fromBase64Url(value)) as SocialOAuthState
}

export function createCodeVerifier() {
  return randomBytes(32).toString('base64url')
}

export function createCodeChallenge(codeVerifier: string) {
  return createHash('sha256').update(codeVerifier).digest('base64url')
}

export function getAppBaseUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()

  if (configured) {
    return configured.replace(/\/$/, '')
  }

  return new URL(request.url).origin
}

export async function persistOAuthState(state: SocialOAuthState) {
  const cookieStore = await cookies()

  cookieStore.set(SOCIAL_OAUTH_COOKIE, encodeOAuthState(state), {
    httpOnly: true,
    maxAge: 60 * 15,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}

export async function readPersistedOAuthState() {
  const cookieStore = await cookies()
  const value = cookieStore.get(SOCIAL_OAUTH_COOKIE)?.value

  if (!value) {
    return null
  }

  try {
    return decodeOAuthState(value)
  } catch {
    return null
  }
}

export async function clearPersistedOAuthState() {
  const cookieStore = await cookies()
  cookieStore.delete(SOCIAL_OAUTH_COOKIE)
}
