import { createBrowserClient } from '@supabase/ssr'
import { getSupabasePublicConfig } from '@/lib/supabase/config'

let client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (client) return client;

  const config = getSupabasePublicConfig()
  client = createBrowserClient(
    config.url || 'https://placeholder.supabase.co',
    config.anonKey || 'placeholder'
  )
  
  return client;
}
