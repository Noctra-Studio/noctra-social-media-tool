'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  Clock3,
  FileStack,
  Layers3,
  Newspaper,
  Rows3,
  Sparkles,
  SquareStack,
} from 'lucide-react'
import { DateRangePicker, type DateRangeValue } from '@/components/home/date-range-picker'
import { MarkPublishedModal } from '@/components/home/MarkPublishedModal'
import { SocialPlatformMark } from '@/components/ui/SocialPlatformMark'
import {
  buildStructuredPostFields,
  type StoredArticleData,
  type StoredCarouselSlide,
  type StoredSlidesData,
  type StoredThreadItem,
  type SupportedPostType,
} from '@/lib/post-records'
import { formatPlatformLabel, platforms, type Platform } from '@/lib/product'
import {
  getCaptionText,
  getPreviewText,
  inferPostFormat,
  isRecord,
  type PostFormat,
} from '@/lib/social-content'
import { cn } from '@/lib/utils'

type FeedPlatformFilter = 'all' | Platform
type FeedStatusFilter = 'all' | 'backlog' | 'published' | 'scheduled'
type FeedTypeFilter = 'all' | SupportedPostType

export type DashboardPostRow = {
  angle: string | null
  article_data?: unknown
  carousel_slides?: unknown
  content: Record<string, unknown> | null
  created_at: string
  external_post_id?: string | null
  export_metadata?: Record<string, unknown> | null
  format: string | null
  id: string
  image_url?: string | null
  platform: Platform
  post_type?: SupportedPostType | null
  published_at: string | null
  scheduled_at: string | null
  slides_data?: unknown
  status: string | null
  thread_items?: unknown
}

type NormalizedFeedPost = {
  angle: string
  articleData: ReturnType<typeof buildStructuredPostFields>['article_data']
  carouselSlides: ReturnType<typeof buildStructuredPostFields>['carousel_slides']
  content: Record<string, unknown>
  displayDate: string
  externalPostId: string | null
  id: string
  platform: Platform
  postType: SupportedPostType
  primaryImageUrl: string | null
  publishedAt: string | null
  scheduledAt: string | null
  slidesData: ReturnType<typeof buildStructuredPostFields>['slides_data']
  status: string
  threadItems: ReturnType<typeof buildStructuredPostFields>['thread_items']
}

const typeMeta: Record<
  SupportedPostType,
  { emoji: string; icon: typeof Sparkles; label: string }
> = {
  article: { emoji: '📰', icon: Newspaper, label: 'Article' },
  carousel: { emoji: '🎠', icon: Layers3, label: 'Carousel' },
  single_post: { emoji: '✦', icon: SquareStack, label: 'Single Post' },
  slides: { emoji: '🗂', icon: FileStack, label: 'Slides' },
  thread: { emoji: '🧵', icon: Rows3, label: 'Thread' },
}

const typeOptionsByPlatform: Record<FeedPlatformFilter, SupportedPostType[]> = {
  all: ['single_post', 'carousel', 'thread', 'article', 'slides'],
  instagram: ['single_post', 'carousel'],
  linkedin: ['single_post', 'slides'],
  x: ['single_post', 'thread', 'article'],
}

function isStructuredArray<T>(value: unknown): value is T[] {
  return Array.isArray(value)
}

function normalizePost(row: DashboardPostRow): NormalizedFeedPost {
  const content = isRecord(row.content) ? row.content : {}
  const structured = buildStructuredPostFields({
    content,
    export_metadata: row.export_metadata,
    format: (row.format as PostFormat | null) ?? undefined,
    platform: row.platform,
  })

  return {
    angle: row.angle ?? '',
    articleData: isRecord(row.article_data) ? (row.article_data as StoredArticleData) : structured.article_data,
    carouselSlides: isStructuredArray<StoredCarouselSlide>(row.carousel_slides)
      ? row.carousel_slides
      : structured.carousel_slides,
    content,
    displayDate: row.published_at || row.scheduled_at || row.created_at,
    externalPostId: row.external_post_id ?? null,
    id: row.id,
    platform: row.platform,
    postType: row.post_type ?? structured.post_type,
    primaryImageUrl: row.image_url ?? structured.image_url,
    publishedAt: row.published_at,
    scheduledAt: row.scheduled_at,
    slidesData: isStructuredArray<StoredSlidesData>(row.slides_data)
      ? row.slides_data
      : structured.slides_data,
    status: row.status ?? 'draft',
    threadItems: isStructuredArray<StoredThreadItem>(row.thread_items)
      ? row.thread_items
      : structured.thread_items,
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'published':
      return 'Published'
    case 'scheduled':
      return 'Scheduled'
    default:
      return 'Backlog'
  }
}

function getStatusTone(status: string) {
  switch (status) {
    case 'published':
      return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
    case 'scheduled':
      return 'border-sky-500/20 bg-sky-500/10 text-sky-200'
    default:
      return 'border-white/10 bg-white/5 text-[#B5BDCA]'
  }
}

function matchesDateRange(post: NormalizedFeedPost, range: DateRangeValue) {
  if (!range.from && !range.to) {
    return true
  }

  const from = range.from ? new Date(`${range.from}T00:00:00`) : null
  const to = range.to ? new Date(`${range.to}T23:59:59`) : null
  const candidateDates = [post.publishedAt, post.scheduledAt]
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))

  if (candidateDates.length === 0) {
    return false
  }

  return candidateDates.some((date) => {
    if (from && date < from) {
      return false
    }

    if (to && date > to) {
      return false
    }

    return true
  })
}

function ThreadPreview({ items }: { items: NonNullable<NormalizedFeedPost['threadItems']> }) {
  return (
    <div className="space-y-3">
      {items.slice(0, 2).map((item, index) => (
        <div key={item.id} className="rounded-[20px] border border-white/10 bg-[#171B22] p-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#6F7786]">
            <span>Tweet {index + 1}</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#E0E5EB]">{item.text}</p>
          {item.media_url ? (
            <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
              <img src={item.media_url} alt="" className="h-40 w-full object-cover" />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function ArticlePreview({
  articleData,
}: {
  articleData: NonNullable<NormalizedFeedPost['articleData']>
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#171B22]">
      <div className="relative aspect-[16/9] overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top,#B8860B33,transparent_55%),linear-gradient(135deg,#111827,#171B22)]">
        {articleData.cover_image ? (
          <img
            src={articleData.cover_image}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#101417] via-[#101417]/35 to-transparent" />
        <div className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#F6D37A]">
          X Article
        </div>
      </div>
      <div className="space-y-3 p-5">
        <p className="text-xl font-medium text-[#E0E5EB]" style={{ fontFamily: 'var(--font-brand-display)' }}>
          {articleData.title}
        </p>
        <p className="text-sm leading-6 text-[#8D95A6]">{articleData.subtitle}</p>
      </div>
    </div>
  )
}

function CarouselPreview({
  slides,
}: {
  slides: NonNullable<NormalizedFeedPost['carouselSlides']>
}) {
  const visibleSlides = slides.slice(0, 3)

  return (
    <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top,#B8860B1A,transparent_45%),#171B22] p-6">
      {visibleSlides.map((slide, index) => (
        <div
          key={slide.id}
          className="absolute aspect-square w-[72%] overflow-hidden rounded-[24px] border border-white/10 bg-[#212631] shadow-2xl"
          style={{
            transform: `translateX(${(index - 1) * 22}px) rotate(${(index - 1) * 6}deg)`,
            zIndex: index + 1,
          }}
        >
          {slide.image_url ? (
            <img src={slide.image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-end bg-[linear-gradient(145deg,#1F2937,#111827)] p-5">
              <p className="text-sm leading-6 text-[#E0E5EB]">
                {slide.caption || 'Slide visual pendiente'}
              </p>
            </div>
          )}
        </div>
      ))}
      <div className="absolute bottom-4 right-4 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs text-[#E0E5EB]">
        {slides.length} slides
      </div>
    </div>
  )
}

function SlidesPreview({
  slides,
}: {
  slides: NonNullable<NormalizedFeedPost['slidesData']>
}) {
  const firstSlide = slides[0]

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#171B22]">
      <div className="relative aspect-[4/5] overflow-hidden">
        {firstSlide?.image_url ? (
          <img src={firstSlide.image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-[linear-gradient(160deg,#1E293B,#111827)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#101417] via-[#101417]/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-2xl font-medium text-[#E0E5EB]" style={{ fontFamily: 'var(--font-brand-display)' }}>
            {firstSlide?.title || 'Slide principal'}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#B5BDCA]">{firstSlide?.body || 'Contenido del deck.'}</p>
        </div>
        <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs text-[#F6D37A]">
          {slides.length} slides
        </div>
      </div>
    </div>
  )
}

function SinglePostPreview({ post }: { post: NormalizedFeedPost }) {
  const previewText = getPreviewText(
    post.platform,
    inferPostFormat(post.platform, post.content, undefined),
    post.content,
    180
  )

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#171B22]">
      {post.primaryImageUrl ? (
        <div className="aspect-[16/9] overflow-hidden border-b border-white/10">
          <img src={post.primaryImageUrl} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
      <div className="p-5">
        <p className="text-sm leading-7 text-[#E0E5EB]">{previewText}</p>
      </div>
    </div>
  )
}

function PostCard({
  onMarkPublished,
  post,
}: {
  onMarkPublished: (post: NormalizedFeedPost) => void
  post: NormalizedFeedPost
}) {
  const badge = typeMeta[post.postType]
  const previewText = getCaptionText(
    post.platform,
    inferPostFormat(post.platform, post.content, undefined),
    post.content
  )

  return (
    <article className="rounded-[30px] border border-white/10 bg-[#12161D] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <SocialPlatformMark platform={post.platform} />
          </div>
          <div>
            <p className="text-sm font-medium text-[#E0E5EB]">
              {formatPlatformLabel(post.platform)}
            </p>
            <p className="text-xs text-[#6F7786]">
              {format(new Date(post.displayDate), "d MMM yyyy '·' HH:mm", {
                locale: es,
              })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#B8860B]/20 bg-[#B8860B]/10 px-3 py-1.5 text-xs text-[#F6D37A]">
            <badge.icon className="h-3.5 w-3.5" />
            {badge.emoji} {badge.label}
          </span>
          <span className={cn('rounded-full border px-3 py-1.5 text-xs', getStatusTone(post.status))}>
            {getStatusLabel(post.status)}
          </span>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-lg font-medium text-[#E0E5EB]" style={{ fontFamily: 'var(--font-brand-display)' }}>
          {post.angle || previewText.slice(0, 72) || 'Post sin título'}
        </p>
      </div>

      <div className="mt-5">
        {post.postType === 'thread' && post.threadItems ? (
          <ThreadPreview items={post.threadItems} />
        ) : post.postType === 'article' && post.articleData ? (
          <ArticlePreview articleData={post.articleData} />
        ) : post.postType === 'carousel' && post.carouselSlides ? (
          <CarouselPreview slides={post.carouselSlides} />
        ) : post.postType === 'slides' && post.slidesData ? (
          <SlidesPreview slides={post.slidesData} />
        ) : (
          <SinglePostPreview post={post} />
        )}
      </div>

      {post.status !== 'published' ? (
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => onMarkPublished(post)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/[0.08]"
          >
            <CheckCircle2 className="h-4 w-4" />
            Marcar como publicado
          </button>
        </div>
      ) : null}
    </article>
  )
}

export function HomeFeedClient({
  firstName,
  posts,
}: {
  firstName: string
  posts: DashboardPostRow[]
}) {
  const [postRows, setPostRows] = useState(posts)
  const [markPublishedPost, setMarkPublishedPost] = useState<NormalizedFeedPost | null>(null)
  const [notice, setNotice] = useState<{ kind: 'info' | 'success'; message: string } | null>(null)

  useEffect(() => {
    setPostRows(posts)
  }, [posts])

  const normalizedPosts = useMemo(
    () =>
      postRows
        .map(normalizePost)
        .sort(
          (left, right) =>
            new Date(right.displayDate).getTime() - new Date(left.displayDate).getTime()
        ),
    [postRows]
  )
  const [platformFilter, setPlatformFilter] = useState<FeedPlatformFilter>('all')
  const [typeFilter, setTypeFilter] = useState<FeedTypeFilter>('all')
  const [statusFilter, setStatusFilter] = useState<FeedStatusFilter>('all')
  const [dateRange, setDateRange] = useState<DateRangeValue>({ from: null, to: null })

  const availableTypes = typeOptionsByPlatform[platformFilter]

  useEffect(() => {
    if (typeFilter !== 'all' && !availableTypes.includes(typeFilter)) {
      setTypeFilter('all')
    }
  }, [availableTypes, typeFilter])

  const filteredPosts = useMemo(
    () =>
      normalizedPosts.filter((post) => {
        if (platformFilter !== 'all' && post.platform !== platformFilter) {
          return false
        }

        if (typeFilter !== 'all' && post.postType !== typeFilter) {
          return false
        }

        if (
          statusFilter !== 'all' &&
          ((statusFilter === 'backlog' && (post.status === 'published' || post.status === 'scheduled')) ||
            (statusFilter !== 'backlog' && post.status !== statusFilter))
        ) {
          return false
        }

        return matchesDateRange(post, dateRange)
      }),
    [dateRange, normalizedPosts, platformFilter, statusFilter, typeFilter]
  )

  const summary = useMemo(
    () => ({
      backlog: normalizedPosts.filter(
        (post) => post.status !== 'published' && post.status !== 'scheduled'
      ).length,
      published: normalizedPosts.filter((post) => post.status === 'published').length,
      scheduled: normalizedPosts.filter((post) => post.status === 'scheduled').length,
      total: normalizedPosts.length,
    }),
    [normalizedPosts]
  )

  return (
    <div className="space-y-8 pb-20">
      <section className="rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top,#B8860B1A,transparent_35%),linear-gradient(180deg,#1B212B,#101417)] p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.32em] text-[#6F7786]">
              Content OS
            </p>
            <h1
              className="text-4xl font-medium text-[#E0E5EB] sm:text-5xl"
              style={{ fontFamily: 'var(--font-brand-display)' }}
            >
              Hola, {firstName}.
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-[#8D95A6]">
              Todo tu contenido vive en un solo flujo: posts sueltos, carousels,
              threads, artículos y slides. Filtra por plataforma, tipo, estado o
              fecha sin salir de `/home`.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                icon: CalendarRange,
                label: 'Total',
                value: summary.total,
              },
              {
                icon: Sparkles,
                label: 'Published',
                value: summary.published,
              },
              {
                icon: Clock3,
                label: 'Scheduled',
                value: summary.scheduled,
              },
              {
                icon: CalendarClock,
                label: 'Backlog',
                value: summary.backlog,
              },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-[#6F7786]">
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </div>
                <p
                  className="mt-4 text-3xl font-medium text-[#E0E5EB]"
                  style={{ fontFamily: 'var(--font-brand-display)' }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-white/10 bg-[#12161D] p-5">
        {notice ? (
          <div
            className={`mb-5 rounded-[20px] border px-4 py-3 text-sm ${
              notice.kind === 'success'
                ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100'
                : 'border-sky-400/20 bg-sky-400/10 text-sky-100'
            }`}
          >
            {notice.message}
          </div>
        ) : null}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6F7786]">Filtros</p>
            <p className="mt-2 text-sm leading-6 text-[#8D95A6]">
              El filtro de tipo se ajusta automáticamente a la red social activa.
            </p>
          </div>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>

        <div className="mt-5 space-y-5">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-[#4E576A]">Red social</p>
            <div className="flex flex-wrap gap-2">
              {(['all', ...platforms] as FeedPlatformFilter[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPlatformFilter(option)}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm transition-colors',
                    platformFilter === option
                      ? 'bg-white text-black'
                      : 'border border-white/10 text-[#B5BDCA] hover:border-white/20 hover:bg-white/5 hover:text-white'
                  )}
                >
                  {option === 'all' ? 'All' : formatPlatformLabel(option)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-[#4E576A]">Tipo</p>
            <div className="flex flex-wrap gap-2">
              {(['all', ...availableTypes] as FeedTypeFilter[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTypeFilter(option)}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm transition-colors',
                    typeFilter === option
                      ? 'bg-[#B8860B] text-[#101417]'
                      : 'border border-white/10 text-[#B5BDCA] hover:border-white/20 hover:bg-white/5 hover:text-white'
                  )}
                >
                  {option === 'all' ? 'All' : typeMeta[option].label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-[#4E576A]">Estado</p>
            <div className="flex flex-wrap gap-2">
              {(['all', 'published', 'scheduled', 'backlog'] as FeedStatusFilter[]).map(
                (option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setStatusFilter(option)}
                    className={cn(
                      'rounded-full px-4 py-2 text-sm transition-colors',
                      statusFilter === option
                        ? 'bg-white text-black'
                        : 'border border-white/10 text-[#B5BDCA] hover:border-white/20 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    {option === 'all'
                      ? 'All'
                      : option.charAt(0).toUpperCase() + option.slice(1)}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        {platformFilter !== 'all' ? (
          <div className="sticky top-20 z-20 rounded-full border border-white/10 bg-[#101417]/90 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <SocialPlatformMark platform={platformFilter} />
              <span className="text-sm font-medium text-[#E0E5EB]">
                {formatPlatformLabel(platformFilter)}
              </span>
              <span className="text-xs text-[#6F7786]">
                {filteredPosts.length} resultado{filteredPosts.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        ) : null}

        {filteredPosts.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} onMarkPublished={setMarkPublishedPost} />
            ))}
          </div>
        ) : (
          <div className="rounded-[30px] border border-dashed border-white/10 bg-[#101417] p-10 text-center">
            <p className="text-lg font-medium text-[#E0E5EB]" style={{ fontFamily: 'var(--font-brand-display)' }}>
              No encontramos posts con esos filtros.
            </p>
            <p className="mt-2 text-sm leading-6 text-[#8D95A6]">
              Prueba con otra red social, abre el rango de fechas o vuelve a
              `All` para ver todo mezclado.
            </p>
          </div>
        )}
      </section>

      <MarkPublishedModal
        isOpen={Boolean(markPublishedPost)}
        onClose={() => setMarkPublishedPost(null)}
        onSaved={(updatedPost) => {
          setPostRows((current) =>
            current.map((row) =>
              row.id === updatedPost.id
                ? {
                    ...row,
                    external_post_id: updatedPost.external_post_id,
                    published_at: updatedPost.published_at,
                    status: updatedPost.status,
                  }
                : row
            )
          )
          setNotice({
            kind: updatedPost.warning ? 'info' : 'success',
            message:
              updatedPost.warning ||
              'El post se marcó como publicado y ya puede entrar al flujo de métricas.',
          })
        }}
        post={
          markPublishedPost
            ? {
                externalPostId: markPublishedPost.externalPostId,
                id: markPublishedPost.id,
                platform: markPublishedPost.platform,
                publishedAt: markPublishedPost.publishedAt,
              }
            : null
        }
      />
    </div>
  )
}
