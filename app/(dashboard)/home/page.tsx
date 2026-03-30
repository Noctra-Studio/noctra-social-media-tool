import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  CalendarDays,
  Clock3,
  Compass,
  Lightbulb,
  Sparkles,
  SquarePen,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/get-user'
import { HomeSuggestions } from '@/components/home/HomeSuggestions'
import { SocialPlatformMark } from '@/components/ui/SocialPlatformMark'
import { formatPlatformLabel, platforms } from '@/lib/product'

function getDateKeyInMexicoCity(input: Date | string) {
  return new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'America/Mexico_City',
    year: 'numeric',
  }).format(new Date(input))
}

function getCurrentStreak(activityKeys: Set<string>) {
  let streak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  while (activityKeys.has(getDateKeyInMexicoCity(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

function getActiveWeeksCount(postDates: Array<string | null>, windowWeeks = 8) {
  const activeWeeks = new Set<string>()

  for (const rawDate of postDates) {
    if (!rawDate) {
      continue
    }

    const date = new Date(rawDate)
    date.setHours(0, 0, 0, 0)
    const day = date.getDay()
    const distance = day === 0 ? 6 : day - 1
    date.setDate(date.getDate() - distance)
    activeWeeks.add(date.toISOString().slice(0, 10))
  }

  return Math.min(activeWeeks.size, windowWeeks)
}

function getGreeting() {
  const hour = new Date().getHours()

  if (hour < 12) {
    return 'Buenos días'
  }

  if (hour < 19) {
    return 'Buenas tardes'
  }

  return 'Buenas noches'
}

function formatDate(date: string | null) {
  if (!date) {
    return 'Ninguno'
  }

  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  }).format(new Date(date))
}

function getWeekStart() {
  const now = new Date()
  const currentDay = now.getDay()
  const distance = currentDay === 0 ? 6 : currentDay - 1
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(now.getDate() - distance)
  return monday.toISOString()
}

export default async function Home() {
  const user = await getUser()
  const supabase = await createClient()
  const eightWeeksAgo = new Date()
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 55)
  eightWeeksAgo.setHours(0, 0, 0, 0)
  const [{ count: postsThisWeek }, { count: savedIdeas }, { data: nextPost }, { data: profile }, { data: recentPosts }, { data: allPosts }, { data: brandPillars }, { count: publishedCount }, { data: contentIdeas }] =
    await Promise.all([
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', getWeekStart()),
      supabase.from('content_ideas').select('*', { count: 'exact', head: true }),
      supabase
        .from('posts')
        .select('scheduled_at, platform')
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('posts')
        .select('created_at')
        .gte('created_at', eightWeeksAgo.toISOString())
        .eq('user_id', user.id),
      supabase
        .from('posts')
        .select('created_at, scheduled_at, pillar_id')
        .eq('user_id', user.id),
      supabase
        .from('brand_pillars')
        .select('id, name, color, sort_order')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true }),
      supabase
        .from('post_feedback')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('used_as_published', true),
      supabase
        .from('content_ideas')
        .select('created_at')
        .eq('user_id', user.id),
    ])

  const preferredName =
    profile?.full_name?.trim() ||
    (user.user_metadata as { full_name?: string } | undefined)?.full_name?.trim() ||
    user.email?.split('@')[0] ||
    'Usuario'
  const firstName = preferredName.split(' ')[0] || preferredName
  const metricCards = [
    {
      icon: CalendarClock,
      label: 'Posts esta semana',
      value: String(postsThisWeek || 0),
    },
    {
      icon: Lightbulb,
      label: 'Ideas guardadas',
      value: String(savedIdeas || 0),
    },
    {
      icon: Clock3,
      label: 'Próximo post programado',
      value: nextPost?.scheduled_at
        ? `${formatDate(nextPost.scheduled_at)} · ${formatPlatformLabel(nextPost.platform)}`
        : 'Ninguno',
    },
  ]
  const activeWeeks = getActiveWeeksCount(
    ((recentPosts as Array<{ created_at: string | null }> | null) || []).map((post) => post.created_at),
    8
  )
  const totalGeneratedPosts = ((allPosts as Array<{ pillar_id: string | null }> | null) || []).length
  const publishedRatio = totalGeneratedPosts > 0 ? Math.round(((publishedCount || 0) / totalGeneratedPosts) * 100) : 0
  const pillarCounts = new Map<string, number>()

  for (const post of (allPosts as Array<{ pillar_id: string | null }> | null) || []) {
    if (!post.pillar_id) {
      continue
    }

    pillarCounts.set(post.pillar_id, (pillarCounts.get(post.pillar_id) || 0) + 1)
  }

  const pillarBalance = ((brandPillars as Array<{ color: string | null; id: string; name: string }> | null) || []).map((pillar) => ({
    ...pillar,
    count: pillarCounts.get(pillar.id) || 0,
  }))
  const topPillar = pillarBalance.reduce<(typeof pillarBalance)[number] | null>(
    (currentTop, pillar) => {
      if (!currentTop || pillar.count > currentTop.count) {
        return pillar
      }

      return currentTop
    },
    null
  )
  const activityKeys = new Set<string>()

  for (const post of (allPosts as Array<{ created_at: string | null; scheduled_at: string | null }> | null) || []) {
    if (post.created_at) {
      activityKeys.add(getDateKeyInMexicoCity(post.created_at))
    }

    if (post.scheduled_at) {
      activityKeys.add(getDateKeyInMexicoCity(post.scheduled_at))
    }
  }

  for (const idea of (contentIdeas as Array<{ created_at: string | null }> | null) || []) {
    if (idea.created_at) {
      activityKeys.add(getDateKeyInMexicoCity(idea.created_at))
    }
  }

  const currentStreak = getCurrentStreak(activityKeys)

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-10 pb-20 duration-300">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_280px]">
        <div className="rounded-[32px] border border-white/10 bg-[#212631]/45 p-6 sm:p-7">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.32em] text-[#4E576A]">Weekly pulse</p>
            <h1
              className="text-4xl font-medium text-[#E0E5EB] sm:text-5xl"
              style={{ fontFamily: 'var(--font-brand-display)' }}
            >
              {getGreeting()}, {firstName}.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-[#8D95A6]">
              Si ya sabes qué quieres hacer, entra directo a crear. Si no, empieza por
              las sugerencias y desbloquea la siguiente pieza.
            </p>
          </div>

          <div className="mt-10 border-t border-white/8 pt-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  href: '/compose?mode=explore',
                  icon: Sparkles,
                  label: 'No sé qué publicar',
                  sublabel: 'La IA propone la mejor siguiente idea.',
                },
                {
                  href: '/compose?mode=idea',
                  icon: SquarePen,
                  label: 'Tengo una idea',
                  sublabel: 'La conviertes en post en pocos pasos.',
                },
                {
                  href: '/calendar',
                  icon: CalendarDays,
                  label: 'Quiero organizar la semana',
                  sublabel: 'Ve borradores y agenda con calma.',
                },
              ].map(({ href, icon: Icon, label, sublabel }) => (
                <Link
                  key={href}
                  href={href}
                  className="group rounded-[24px] border border-white/10 bg-[#101417]/70 p-5 transition-all hover:border-white/30 hover:bg-white/5"
                >
                  <Icon className="h-5 w-5 text-[#E0E5EB]" />
                  <p
                    className="mt-8 text-lg font-medium text-[#E0E5EB]"
                    style={{ fontFamily: 'var(--font-brand-display)' }}
                  >
                    {label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#8D95A6]">{sublabel}</p>
                  <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-[#E0E5EB] transition-all group-hover:border-white/30 group-hover:bg-white/10">
                    Abrir
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 border-l-2 border-l-white/20 bg-[#101417] p-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[#4E576A]">
            <Compass className="h-4 w-4" />
            Cómo empezar
          </div>
          <div className="mt-5 space-y-4">
            {[
              'Revisa sugerencias si no tienes claro el tema.',
              'Guarda cualquier insight rápido con el botón flotante.',
              'Agenda solo lo que ya esté suficientemente claro.',
            ].map((step, index) => (
              <div key={step} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 text-sm font-medium text-[#E0E5EB]">
                  {index + 1}
                </div>
                <p className="text-sm leading-6 text-[#8D95A6]">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {metricCards.map(({ icon: Icon, label, value }) => {
          const isEmpty = value === '0' || value === 'Ninguno'

          return (
            <div key={label} className="rounded-[22px] border border-white/10 bg-[#212631]/55 px-4 py-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-[#4E576A]">
                <Icon className="h-3.5 w-3.5" />
                <p>{label}</p>
              </div>
              <p
                className={`mt-4 ${
                  value.includes('·') ? 'text-lg sm:text-xl' : 'text-4xl font-bold'
                } ${isEmpty ? 'text-zinc-500' : 'text-[#E0E5EB]'}`}
                style={{ fontFamily: 'var(--font-brand-display)' }}
              >
                {value}
              </p>
            </div>
          )
        })}
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#4E576A]">Sugerencias IA</p>
          <h2
            className="mt-1 text-2xl font-medium text-[#E0E5EB]"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            Qué mover hoy
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#8D95A6]">
            Prioridades sugeridas para no quedarte pensando frente al lienzo vacío.
          </p>
        </div>
        <HomeSuggestions />
      </section>

      <section id="audiencia" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#4E576A]">Tutorial</p>
            <h2
              className="mt-1 text-2xl font-medium text-[#E0E5EB]"
              style={{ fontFamily: 'var(--font-brand-display)' }}
            >
              Construcción de audiencia
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8D95A6]">
              Publicar mantiene el canal vivo. Construir autoridad hace que la gente te recuerde,
              te entienda y te busque por criterio, no solo por frecuencia.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/settings?section=studio&tab=voice"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5"
            >
              Voz de marca
            </Link>
            <Link
              href="/settings?section=studio&tab=strategy"
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-100"
            >
              Ir a estrategia
            </Link>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[28px] border border-white/10 bg-[#212631]/55 p-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#4E576A]">1</p>
              <p
                className="mt-4 text-lg font-medium text-[#E0E5EB]"
                style={{ fontFamily: 'var(--font-brand-display)' }}
              >
                Publicar no es lo mismo que construir autoridad
              </p>
              <p className="mt-3 text-sm leading-6 text-[#8D95A6]">
                Una marca puede publicar diario y seguir sonando genérica. La autoridad aparece
                cuando tus piezas repiten una tesis, un criterio y un territorio reconocible.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[#212631]/55 p-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#4E576A]">2</p>
              <p
                className="mt-4 text-lg font-medium text-[#E0E5EB]"
                style={{ fontFamily: 'var(--font-brand-display)' }}
              >
                Estrategia de pilares con ejemplos Noctra
              </p>
              <p className="mt-3 text-sm leading-6 text-[#8D95A6]">
                Piensa en pilares como “Claridad digital”, “Decisiones de sitio web”, “Errores
                comunes en marketing” o “Casos reales”. Así el calendario no depende del humor del día.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[#212631]/55 p-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#4E576A]">3</p>
              <p
                className="mt-4 text-lg font-medium text-[#E0E5EB]"
                style={{ fontFamily: 'var(--font-brand-display)' }}
              >
                La audiencia cambia por plataforma
              </p>
              <p className="mt-3 text-sm leading-6 text-[#8D95A6]">
                En LinkedIn quizá te leen directores que valoran claridad estratégica; en Instagram,
                dueños de PYME que necesitan ejemplos concretos y lenguaje menos técnico. El tema puede ser el mismo; la entrada no.
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#101417] p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#4E576A]">Checklist</p>
            <p
              className="mt-3 text-xl font-medium text-[#E0E5EB]"
              style={{ fontFamily: 'var(--font-brand-display)' }}
            >
              ¿Ya definiste tus 4 pilares?
            </p>
            <div className="mt-5 space-y-3 text-sm text-[#8D95A6]">
              {[
                'Cada pilar tiene nombre, descripción y color.',
                'Tus pilares no se pisan entre sí.',
                'Definiste una audiencia distinta para Instagram, LinkedIn y X.',
                'La IA ya tiene contexto suficiente para sugerir el pilar correcto.',
              ].map((item) => (
                <div key={item} className="flex gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#E0E5EB]" />
                  <p className="leading-6">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#4E576A]">Acciones rápidas</p>
          <h2
            className="mt-1 text-2xl font-medium text-[#E0E5EB]"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            Entra directo a trabajar
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              description: 'Empieza con una idea y conviértela en una pieza lista para publicar.',
              href: '/compose?mode=idea',
              icon: SquarePen,
              label: 'Crear post rápido',
            },
            {
              description: 'Revisa el ritmo de tu semana y agenda lo que ya está listo.',
              href: '/calendar',
              icon: CalendarDays,
              label: 'Ver semana',
            },
            {
              description: 'Recupera temas guardados y conviértelos en contenido accionable.',
              href: '/ideas',
              icon: Lightbulb,
              label: 'Ver ideas guardadas',
            },
          ].map(({ href, icon: Icon, label, description }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-[28px] border border-white/10 bg-[#212631]/55 p-5 transition-all hover:border-[#E0E5EB]/30 hover:bg-white/5"
            >
              <Icon className="h-6 w-6 min-h-6 min-w-6 text-[#E0E5EB]" />
              <div className="mt-7 flex items-center justify-between gap-3">
                <div className="space-y-2">
                  <span
                    className="block text-lg font-medium text-[#E0E5EB]"
                    style={{ fontFamily: 'var(--font-brand-display)' }}
                  >
                    {label}
                  </span>
                  <p className="text-sm leading-6 text-[#8D95A6]">{description}</p>
                </div>
                <span
                  className="inline-flex shrink-0 items-center justify-center rounded-full border border-white/10 p-2 text-[#8D95A6] transition-all group-hover:border-white/30 group-hover:bg-white/10 group-hover:text-[#E0E5EB]"
                  style={{ fontFamily: 'var(--font-brand-display)' }}
                >
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#4E576A]">Métricas</p>
          <h2
            className="mt-1 text-2xl font-medium text-[#E0E5EB]"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            Conexiones pendientes
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {platforms.map((platform) => {
            return (
              <div
                key={platform}
                className="rounded-[28px] border border-dashed border-[#4E576A] bg-transparent p-5"
              >
                <div className="flex items-center gap-2">
                  <SocialPlatformMark platform={platform} />
                  <p className="text-sm text-[#E0E5EB]">{formatPlatformLabel(platform)}</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#8D95A6]">
                  Conecta tu cuenta para ver métricas, rendimiento y señales de publicación.
                </p>
                <button
                  type="button"
                  aria-disabled="true"
                  className="mt-5 rounded-full border border-white/30 px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#E0E5EB] transition-colors hover:bg-white/10"
                >
                  Conectar
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#4E576A]">Tu huella de marca</p>
          <h2
            className="mt-1 text-2xl font-medium text-[#E0E5EB]"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            Tu huella de marca
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#8D95A6]">
            Indicadores de consistencia editorial, no de vanidad.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[28px] border border-white/10 bg-[#212631]/55 p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#4E576A]">Consistencia</p>
            <p
              className="mt-4 text-3xl font-medium text-[#E0E5EB]"
              style={{ fontFamily: 'var(--font-brand-display)' }}
            >
              {activeWeeks} de 8
            </p>
            <p className="mt-2 text-sm text-[#8D95A6]">semanas activas</p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#212631]/55 p-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-[#4E576A]">
              <BarChart3 className="h-3.5 w-3.5" />
              Balance
            </div>
            <p
              className="mt-4 text-xl font-medium text-[#E0E5EB]"
              style={{ fontFamily: 'var(--font-brand-display)' }}
            >
              Pilar más usado: {topPillar?.name || 'Sin datos'}
            </p>
            <div className="mt-4 flex items-end gap-2">
              {pillarBalance.length > 0 ? (
                pillarBalance.map((pillar) => {
                  const maxCount = Math.max(...pillarBalance.map((item) => item.count), 1)
                  const height = pillar.count > 0 ? Math.max(18, (pillar.count / maxCount) * 56) : 10

                  return (
                    <div key={pillar.id} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-[10px]"
                        style={{
                          backgroundColor: pillar.color || '#4E576A',
                          height,
                        }}
                      />
                      <span className="text-[11px] text-[#8D95A6]">{pillar.count}</span>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-[#8D95A6]">Define tus pilares para empezar a medir balance.</p>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#212631]/55 p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#4E576A]">Ratio de uso</p>
            <p
              className="mt-4 text-3xl font-medium text-[#E0E5EB]"
              style={{ fontFamily: 'var(--font-brand-display)' }}
            >
              {publishedRatio}%
            </p>
            <p className="mt-2 text-sm leading-6 text-[#8D95A6]">
              de posts generados terminan marcados como publicados.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#212631]/55 p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#4E576A]">Racha actual</p>
            <p
              className="mt-4 text-3xl font-medium text-[#E0E5EB]"
              style={{ fontFamily: 'var(--font-brand-display)' }}
            >
              {currentStreak} días
            </p>
            <p className="mt-2 text-sm leading-6 text-[#8D95A6]">
              con actividad de generación, captura o calendarización.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
