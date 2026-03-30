const PLACEHOLDER_SUPABASE_URL = 'https://placeholder.supabase.co'
const PLACEHOLDER_SUPABASE_KEY = 'placeholder'

type SupabasePublicConfig = {
  anonKey: string | null
  isConfigured: boolean
  message: string
  missingKeys: string[]
  url: string | null
}

function getMissingConfigMessage(missingKeys: string[]) {
  const listedKeys = missingKeys.join(' y ')

  return `Configura ${listedKeys} en .env.local y reinicia el servidor de desarrollo.`
}

function isMissingValue(value: string | undefined, placeholder?: string) {
  if (!value) {
    return true
  }

  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return true
  }

  if (placeholder && normalizedValue === placeholder) {
    return true
  }

  return false
}

export function getSupabasePublicConfig(): SupabasePublicConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || null
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || null
  const missingKeys: string[] = []

  if (isMissingValue(url ?? undefined, PLACEHOLDER_SUPABASE_URL)) {
    missingKeys.push('NEXT_PUBLIC_SUPABASE_URL')
  }

  if (isMissingValue(anonKey ?? undefined, PLACEHOLDER_SUPABASE_KEY)) {
    missingKeys.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return {
    anonKey,
    isConfigured: missingKeys.length === 0,
    message: getMissingConfigMessage(missingKeys),
    missingKeys,
    url,
  }
}
