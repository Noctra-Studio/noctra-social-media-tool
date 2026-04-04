import { SettingsWorkspace } from '@/components/settings/SettingsWorkspace'
import type { AssistanceLevel } from '@/lib/product'
import { getActiveWorkspaceContext } from '@/lib/workspace/server'
import type { SocialConnectionRow } from '@/types/social'

type SettingsPageProps = {
  searchParams?: Promise<{
    connected?: string
    error?: string
    section?: string
    success?: string
    tab?: string
  }>
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = (await searchParams) || {}
  const { config, profile, supabase, user, workspace } = await getActiveWorkspaceContext()
  if (!workspace) return null
  const userMetadata = user.user_metadata as { avatar_url?: string; full_name?: string } | undefined

  const initialAssistanceLevel: AssistanceLevel =
    config?.assistance_level === 'minimal'
      ? 'guided'
      : config?.assistance_level === 'full'
        ? 'expert'
        : 'balanced'

  const validTab =
    params.tab === 'accounts' ||
    params.tab === 'assistance' ||
    params.tab === 'brands' ||
    params.tab === 'text-styles' ||
    params.tab === 'voice' ||
    params.tab === 'platforms' ||
    params.tab === 'strategy'
      ? params.tab === 'platforms'
        ? 'accounts'
        : params.tab
      : 'voice'
  const validSection = params.section === 'account' || params.tab === 'account' ? 'account' : 'studio'
  const fallbackName = user.email?.split('@')[0] || 'Usuario'
  const { data: connectionsData } = await supabase
    .from('social_connections')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  const initialConnections = (connectionsData as SocialConnectionRow[] | null) ?? []
  const initialAccountsNotice =
    params.connected && ['instagram', 'linkedin', 'x'].includes(params.connected)
      ? {
          kind: 'success' as const,
          message: `${params.connected === 'x' ? 'X' : params.connected === 'linkedin' ? 'LinkedIn' : 'Instagram'} quedó conectada a este workspace.`,
        }
      : params.error
        ? {
            kind: 'error' as const,
            message: 'No fue posible completar la conexión social. Revisa tus credenciales OAuth e inténtalo de nuevo.',
          }
        : null

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <SettingsWorkspace
        initialAccountsNotice={initialAccountsNotice}
        initialAvatarUrl={userMetadata?.avatar_url || ''}
        initialAssistanceLevel={initialAssistanceLevel}
        initialConnections={initialConnections}
        initialEmail={user.email || ''}
        initialName={profile?.full_name || userMetadata?.full_name || fallbackName}
        initialSection={validSection}
        initialTab={validTab}
      />
    </div>
  )
}
