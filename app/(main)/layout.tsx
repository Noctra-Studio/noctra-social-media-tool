import { redirect } from 'next/navigation'
import QuickCapture from '@/components/QuickCapture'
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

  try {
    user = await getUser()
  } catch {
    redirect('/login')
  }

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()

    fullName = data?.full_name || ''
  } catch {
    fullName = ''
  }

  return (
    <>
      <AppShell
        userEmail={user.email ?? 'owner@noctra.studio'}
        userName={
          fullName ||
          (user.user_metadata as { full_name?: string } | undefined)?.full_name ||
          user.email?.split('@')[0] ||
          'Usuario'
        }
      >
        {children}
      </AppShell>
      <QuickCapture />
    </>
  );
}
