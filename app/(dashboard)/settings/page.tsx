import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/get-user'
import { SettingsWorkspace } from '@/components/settings/SettingsWorkspace'
import type { AssistanceLevel } from '@/lib/product'

type SettingsPageProps = {
  searchParams?: Promise<{ section?: string; tab?: string }>
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = (await searchParams) || {}
  const user = await getUser()
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('assistance_level, full_name, social_handles')
    .eq('id', user.id)
    .maybeSingle()

  const profile = data as {
    assistance_level?: AssistanceLevel | null
    full_name?: string | null
    social_handles?: { instagram?: string; linkedin?: string; x?: string } | null
  } | null
  const userMetadata = user.user_metadata as { avatar_url?: string; full_name?: string } | undefined

  const validTab =
    params.tab === 'assistance' || params.tab === 'platforms' || params.tab === 'voice' || params.tab === 'strategy'
      ? params.tab
      : 'voice'
  const validSection = params.section === 'account' || params.tab === 'account' ? 'account' : 'studio'
  const fallbackName = user.email?.split('@')[0] || 'Usuario'

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <SettingsWorkspace
        initialAvatarUrl={userMetadata?.avatar_url || ''}
        initialAssistanceLevel={profile?.assistance_level || 'balanced'}
        initialEmail={user.email || ''}
        initialName={profile?.full_name || userMetadata?.full_name || fallbackName}
        initialSocialHandles={profile?.social_handles || {}}
        initialSection={validSection}
        initialTab={validTab}
      />
    </div>
  )
}
