import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/get-user'
import { getIdeaStatusLabel } from '@/lib/product'

type IdeasPageProps = {
  searchParams?: Promise<{ filter?: string }>
}

type IdeaRow = {
  created_at: string | null
  id: string
  platform: string | null
  raw_idea: string
  status: string | null
}

const filters = [
  { key: 'all', label: 'Todas' },
  { key: 'raw', label: 'Sin desarrollar' },
  { key: 'drafted', label: 'En borrador' },
  { key: 'published', label: 'Publicadas' },
] as const

function formatDate(date: string | null) {
  if (!date) {
    return 'Sin fecha'
  }

  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

function getPlatformLabel(platform: string | null) {
  if (!platform) {
    return 'Sin plataforma'
  }

  if (platform === 'linkedin') {
    return 'LinkedIn'
  }

  if (platform === 'instagram') {
    return 'Instagram'
  }

  return 'X'
}

export default async function IdeasPage({ searchParams }: IdeasPageProps) {
  const params = (await searchParams) || {}
  const filter = filters.some((item) => item.key === params.filter) ? params.filter : 'all'
  const user = await getUser()
  const supabase = await createClient()
  let query = supabase
    .from('content_ideas')
    .select('id, raw_idea, platform, created_at, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (filter === 'raw') {
    query = query.eq('status', 'raw')
  }

  if (filter === 'drafted') {
    query = query.in('status', ['draft', 'drafted'])
  }

  if (filter === 'published') {
    query = query.eq('status', 'published')
  }

  const { data } = await query
  const ideas = (data || []) as IdeaRow[]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.28em] text-[#4E576A]">Ideas</p>
        <h1
          className="text-4xl font-medium text-[#E0E5EB]"
          style={{ fontFamily: 'var(--font-brand-display)' }}
        >
          Backlog de contenido
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-[#8D95A6]">
          Aquí vive todo lo que capturas. Filtra, prioriza y abre cualquier idea en el
          flujo de creación.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <Link
            key={item.key}
            href={item.key === 'all' ? '/ideas' : `/ideas?filter=${item.key}`}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              filter === item.key
                ? 'bg-[#212631] text-[#E0E5EB]'
                : 'text-[#8D95A6] hover:bg-white/5 hover:text-[#E0E5EB]'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {ideas.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-[#4E576A] p-8 text-sm leading-6 text-[#8D95A6]">
          Captura tu primera idea con el botón + y aquí aparecerá lista para convertirla
          en contenido.
        </div>
      ) : (
        <div className="grid gap-4">
          {ideas.map((idea) => (
            <div key={idea.id} className="rounded-[28px] border border-white/10 bg-[#212631]/55 p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#4E576A]">
                <span>{getPlatformLabel(idea.platform)}</span>
                <span className="h-1 w-1 rounded-full bg-[#4E576A]" />
                <span>{formatDate(idea.created_at)}</span>
                <span className="h-1 w-1 rounded-full bg-[#4E576A]" />
                <span>{getIdeaStatusLabel(idea.status)}</span>
              </div>
              <p className="mt-4 line-clamp-2 text-base leading-7 text-[#E0E5EB]">{idea.raw_idea}</p>
              <Link
                href={`/compose?mode=idea&idea=${idea.id}`}
                className="mt-5 inline-flex items-center rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-[#E0E5EB]/30"
              >
                Desarrollar
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
