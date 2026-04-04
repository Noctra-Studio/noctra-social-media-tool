import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

type AdminProfile = {
  current_workspace_id?: string | null
  noctra_role?: string | null
}

export type NoctraAdminContext = {
  profile: AdminProfile | null
  supabase: Awaited<ReturnType<typeof createClient>>
  user: User
}

export async function getNoctraAdminContext(): Promise<NoctraAdminContext> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('current_workspace_id, noctra_role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || profile?.noctra_role !== 'noctra_admin') {
    throw new Error('Forbidden')
  }

  return {
    profile: (profile as AdminProfile | null) ?? null,
    supabase,
    user,
  }
}
