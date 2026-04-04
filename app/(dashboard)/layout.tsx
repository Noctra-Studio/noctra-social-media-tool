import { redirect } from 'next/navigation'
import QuickCapture from '@/components/QuickCapture'
import { WorkspaceProvider } from '@/contexts/WorkspaceContext'
import { AppShell } from '@/components/layout/AppShell'
import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user
  let fullName = ''
  let avatarUrl = ''
  let noctraRole = ''

  try {
    user = await getUser()
  } catch {
    redirect('/login')
  }

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('profiles')
      .select('full_name, noctra_role')
      .eq('id', user.id)
      .maybeSingle()

    fullName = data?.full_name || ''
    noctraRole = data?.noctra_role || ''
  } catch {
    fullName = ''
    noctraRole = ''
  }

  avatarUrl =
    (user.user_metadata as { avatar_url?: string } | undefined)?.avatar_url?.trim() || ''

  return (
    <WorkspaceProvider>
      <AppShell
        userAvatarUrl={avatarUrl}
        userEmail={user.email ?? 'owner@noctra.studio'}
        userName={
          fullName ||
          (user.user_metadata as { full_name?: string } | undefined)?.full_name ||
          user.email?.split('@')[0] ||
          'Usuario'
        }
        noctraRole={noctraRole}
      >
        {children}
      </AppShell>
      <QuickCapture />
    </WorkspaceProvider>
  );
}
