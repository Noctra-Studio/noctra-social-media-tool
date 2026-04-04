import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { AccessRequestsAdminPanel } from '@/components/admin/AccessRequestsAdminPanel'
import { getNoctraAdminContext } from '@/lib/auth/noctra-admin'
import type { AccessRequestRecord } from '@/lib/early-access/utils'
import { createAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function AdminRequestsPage() {
  try {
    await getNoctraAdminContext()
  } catch {
    redirect('/login')
  }

  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin
    .from('access_requests')
    .select('*')
    .order('requested_at', { ascending: false })

  if (error) {
    throw error
  }

  return (
    <main className="min-h-screen bg-[#101417] px-4 py-8 text-[#E0E5EB] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <Link
            href="/home"
            className="group mb-8 inline-flex items-center gap-2 text-sm text-[#8D95A6] transition-colors hover:text-white"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Volver al dashboard
          </Link>
        </div>
        <div className="mb-8 flex flex-col gap-3 border-b border-white/8 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.34em] text-white/30">
              Noctra Social
            </p>
            <h1
              className="mt-3 text-4xl text-white"
              style={{ fontFamily: 'var(--font-brand-display)' }}
            >
              Admin panel
            </h1>
          </div>
          <p className="max-w-xl text-sm leading-6 text-white/50">
            Aprobación manual de acceso temprano, revisión operativa y seguimiento de solicitudes.
          </p>
        </div>

        <AccessRequestsAdminPanel initialRequests={(data as AccessRequestRecord[] | null) ?? []} />
      </div>
    </main>
  )
}
