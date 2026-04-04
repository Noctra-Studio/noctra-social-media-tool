import { redirect } from 'next/navigation'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'
import { WorkspaceProvider } from '@/contexts/WorkspaceContext'
import { getActiveWorkspaceContext } from '@/lib/workspace/server'

export default async function OnboardingPage() {
  let context

  try {
    context = await getActiveWorkspaceContext()
  } catch (error) {
    console.error('[Onboarding] Error fetching context:', error)
    redirect('/login')
  }

  // If already onboarded, send to dashboard
  if (context.config?.onboarding_completed) {
    redirect('/compose')
  }

  const fullName =
    context.profile?.full_name?.trim() ||
    (context.user.user_metadata as { full_name?: string } | undefined)?.full_name?.trim() ||
    context.user.email?.split('@')[0] ||
    'Usuario'
  const firstName = fullName.split(/\s+/)[0] || 'Usuario'

  return (
    <WorkspaceProvider>
      <OnboardingFlow firstName={firstName} />
    </WorkspaceProvider>
  )
}
