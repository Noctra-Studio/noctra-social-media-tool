'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { startTransition, useDeferredValue, useMemo, useState } from 'react'
import {
  ArrowRight,
  ArrowUpDown,
  Lightbulb,
  Loader2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { formatPlatformLabel, getIdeaStatusLabel, type Platform } from '@/lib/product'
import { openQuickCapture } from '@/lib/quick-capture'
import { createClient } from '@/lib/supabase/client'

type FilterKey = 'all' | 'raw' | 'drafted' | 'published'
type SortKey = 'recent-desc' | 'recent-asc' | 'platform'

export type IdeaListItem = {
  created_at: string | null
  id: string
  platform: Platform | null
  raw_idea: string
  status: string | null
}

type IdeasBacklogViewProps = {
  initialFilter: FilterKey
  ideas: IdeaListItem[]
}

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'Todas' },
  { key: 'raw', label: 'Sin desarrollar' },
  { key: 'drafted', label: 'En borrador' },
  { key: 'published', label: 'Publicadas' },
]

const sortOptions: Array<{ key: SortKey; label: string }> = [
  { key: 'recent-desc', label: 'Más recientes' },
  { key: 'recent-asc', label: 'Más antiguas' },
  { key: 'platform', label: 'Por plataforma' },
]

const starterPrompts = [
  '¿Qué error cometen mis clientes antes de contratar una agencia?',
  'Algo que aprendí este mes trabajando con un cliente',
  'Una opinión que tengo sobre el diseño web en México',
]

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

function getPlatformTone(platform: Platform | null) {
  switch (platform) {
    case 'instagram':
      return 'bg-pink-500/16 text-pink-200 border border-pink-400/20'
    case 'linkedin':
      return 'bg-blue-500/16 text-blue-200 border border-blue-400/20'
    case 'x':
      return 'bg-white/10 text-white border border-white/12'
    default:
      return 'bg-white/5 text-zinc-300 border border-white/10'
  }
}

function getStatusToneClasses(status: string | null) {
  switch (status) {
    case 'draft':
    case 'drafted':
      return 'bg-[#462D6E] text-[#E0E5EB]'
    case 'published':
      return 'bg-[#1a3a2a] text-[#4ade80]'
    case 'raw':
    default:
      return 'bg-[#4E576A] text-[#E0E5EB]'
  }
}

function matchesFilter(status: string | null, filter: FilterKey) {
  if (filter === 'all') {
    return true
  }

  if (filter === 'raw') {
    return status === 'raw' || status == null
  }

  if (filter === 'drafted') {
    return status === 'draft' || status === 'drafted'
  }

  return status === 'published'
}

function getCreatedAtTime(createdAt: string | null) {
  return createdAt ? new Date(createdAt).getTime() : 0
}

function MockIdeaPreview() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-dashed border-[#4E576A] bg-[#212631] p-5 opacity-60">
        <div className="flex items-center gap-2 text-[11px] text-[#E0E5EB]">
          <span className="rounded-full bg-blue-500/16 px-3 py-1 text-blue-200">LinkedIn</span>
          <span className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">Tutorial</span>
        </div>
        <p
          className="mt-5 text-xl font-bold leading-8 text-[#E0E5EB]"
          style={{ fontFamily: 'var(--font-brand-display)' }}
        >
          &quot;Por qué el 80% de los sitios web en México no aparecen en Google...&quot;
        </p>
        <div className="mt-8 flex items-center justify-between text-sm text-[#8D95A6]">
          <div className="flex items-center gap-2">
            <span>Hace 2 días</span>
            <span>•</span>
            <span>Sin desarrollar</span>
          </div>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#4E576A] bg-[#101417] text-[#E0E5EB]">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
      <p className="text-xs text-[#4E576A]">Así se verá tu primera idea</p>
    </div>
  )
}

export function IdeasBacklogView({ initialFilter, ideas }: IdeasBacklogViewProps) {
  const router = useRouter()
  const supabase = createClient()
  const [items, setItems] = useState(ideas)
  const [activeFilter, setActiveFilter] = useState<FilterKey>(initialFilter)
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('recent-desc')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())
  const ideasCount = items.length

  const counts = useMemo(
    () => ({
      all: items.length,
      raw: items.filter((item) => matchesFilter(item.status, 'raw')).length,
      drafted: items.filter((item) => matchesFilter(item.status, 'drafted')).length,
      published: items.filter((item) => matchesFilter(item.status, 'published')).length,
    }),
    [items]
  )

  const visibleIdeas = useMemo(
    () =>
      [...items]
        .filter((item) => matchesFilter(item.status, activeFilter))
        .filter((item) => {
          if (!deferredQuery) {
            return true
          }

          const platformLabel = item.platform ? formatPlatformLabel(item.platform) : 'Sin plataforma'
          return `${item.raw_idea} ${platformLabel} ${getIdeaStatusLabel(item.status)}`
            .toLowerCase()
            .includes(deferredQuery)
        })
        .sort((left, right) => {
          if (sortBy === 'recent-asc') {
            return getCreatedAtTime(left.created_at) - getCreatedAtTime(right.created_at)
          }

          if (sortBy === 'platform') {
            const leftPlatform = left.platform ? formatPlatformLabel(left.platform) : 'Sin plataforma'
            const rightPlatform = right.platform ? formatPlatformLabel(right.platform) : 'Sin plataforma'
            return (
              leftPlatform.localeCompare(rightPlatform, 'es') ||
              getCreatedAtTime(right.created_at) - getCreatedAtTime(left.created_at)
            )
          }

          return getCreatedAtTime(right.created_at) - getCreatedAtTime(left.created_at)
        }),
    [activeFilter, deferredQuery, items, sortBy]
  )

  async function handleDelete(ideaId: string) {
    if (!window.confirm('¿Eliminar esta idea del backlog?')) {
      return
    }

    setDeletingId(ideaId)

    const { error } = await supabase.from('content_ideas').delete().eq('id', ideaId)

    if (error) {
      console.error('Error deleting idea:', error)
      window.alert('No fue posible eliminar la idea. Inténtalo de nuevo.')
      setDeletingId(null)
      return
    }

    setItems((currentItems) => currentItems.filter((item) => item.id !== ideaId))
    setDeletingId(null)
    startTransition(() => {
      router.refresh()
    })
  }

  if (ideasCount === 0) {
    return (
      <div className="grid gap-8 rounded-[32px] border border-white/10 bg-[#101417]/65 p-6 md:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)] md:p-8">
        <div className="flex flex-col justify-center">
          <p className="text-[11px] font-medium tracking-[0.28em] text-[#4E576A]">EMPIEZA AQUÍ</p>
          <h1
            className="mt-4 text-[28px] font-bold text-[#E0E5EB]"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            Tu banco de ideas
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-[1.6] text-[#4E576A]">
            Captura cualquier pensamiento antes de que se escape. No tiene que ser perfecto
            — solo escríbelo. La IA lo convierte en contenido después.
          </p>

          <div className="mt-8">
            <button
              type="button"
              onClick={() => openQuickCapture()}
              className="inline-flex items-center justify-center rounded-lg bg-[#E0E5EB] px-6 py-3 text-sm font-medium text-[#101417]"
              style={{ fontFamily: 'var(--font-brand-display)' }}
            >
              Capturar primera idea
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => openQuickCapture(prompt)}
                className="rounded-full border border-[#4E576A] px-4 py-2 text-[13px] text-[#E0E5EB] transition-colors hover:border-[#E0E5EB]"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-full max-w-sm">
            <MockIdeaPreview />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-[#E0E5EB]"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            Ideas
          </h1>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative min-w-[240px] flex-1 md:min-w-[280px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar ideas..."
              className="h-11 w-full rounded-2xl border border-white/10 bg-[#101417] pl-10 pr-4 text-sm text-[#E0E5EB] outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/10"
            />
          </label>

          <label className="relative min-w-[220px]">
            <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortKey)}
              className="h-11 w-full appearance-none rounded-2xl border border-white/10 bg-[#101417] pl-10 pr-10 text-sm text-[#E0E5EB] outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/10"
            >
              {sortOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => openQuickCapture()}
            className="hidden h-11 items-center justify-center gap-2 rounded-2xl bg-[#E0E5EB] px-5 text-sm font-medium text-[#101417] transition-transform hover:scale-[1.01] active:scale-[0.99] md:inline-flex"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            <Plus className="h-4 w-4" />
            Nueva idea
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveFilter(item.key)}
            className={`rounded-full px-4 py-1 text-sm transition-colors ${
              activeFilter === item.key
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            {item.label} ({counts[item.key]})
          </button>
        ))}
      </div>

      {visibleIdeas.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-white/10 bg-[#101417] px-6 py-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
            <Lightbulb className="h-6 w-6 text-[#E0E5EB]" strokeWidth={1.8} />
          </div>
          <h3
            className="mt-5 text-xl font-medium text-[#E0E5EB]"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            No encontramos ideas con esos filtros
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#8D95A6]">
            Ajusta la búsqueda, cambia el orden o limpia el filtro para recuperar tu backlog.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setActiveFilter('all')
              setSortBy('recent-desc')
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-[#E0E5EB] transition-colors hover:bg-white/10"
          >
            Limpiar filtros
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`${activeFilter}-${sortBy}-${deferredQuery}-${visibleIdeas.length}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="columns-1 gap-4 md:columns-2 xl:columns-3"
          >
            {visibleIdeas.map((idea, index) => {
              const isDeleting = deletingId === idea.id
              const platformLabel = idea.platform ? formatPlatformLabel(idea.platform) : 'Sin plataforma'

              return (
                <motion.article
                  key={idea.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{
                    duration: 0.3,
                    ease: 'easeOut',
                    delay: index * 0.05,
                  }}
                  className="group mb-4 break-inside-avoid rounded-xl border border-[#2a3040] bg-[#212631] p-5 transition-all hover:-translate-y-[2px] hover:border-[#4E576A]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${getPlatformTone(idea.platform)}`}>
                        {platformLabel}
                      </span>
                      <span className="inline-flex rounded-full border border-white/10 px-3 py-1 text-[11px] font-medium text-zinc-300">
                        Idea base
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleDelete(idea.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-zinc-500 transition-colors hover:border-rose-400/20 hover:bg-rose-400/10 hover:text-rose-200 disabled:opacity-60"
                      aria-label="Eliminar idea"
                    >
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>

                  <p
                    className="mt-5 overflow-hidden text-base leading-7 text-[#E0E5EB]"
                    style={{
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 3,
                    }}
                  >
                    {idea.raw_idea}
                  </p>

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${getStatusToneClasses(
                          idea.status
                        )}`}
                      >
                        {getIdeaStatusLabel(idea.status)}
                      </span>
                      <span className="text-xs text-[#8D95A6]">{formatDate(idea.created_at)}</span>
                    </div>

                    <Link
                      href={`/compose?idea=${idea.id}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#4E576A] bg-[#101417] text-[#E0E5EB] opacity-0 transition-all group-hover:opacity-100"
                      aria-label="Desarrollar idea"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </motion.article>
              )
            })}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
