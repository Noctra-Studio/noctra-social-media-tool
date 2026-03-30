"use client";

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  AlertTriangle,
  BarChart3,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Flame,
  GripVertical,
  LayoutList,
  Lightbulb,
  Plus,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

type Post = {
  id: string;
  platform: 'instagram' | 'linkedin' | 'x';
  angle: string;
  content: { caption?: string; thread?: string[] } | null;
  scheduled_at: string | null;
  status: string;
  content_ideas?: { raw_idea: string };
};

type Balance = {
  by_platform: Record<string, number>;
  by_angle: Record<string, number>;
  by_pillar: Array<{
    color: string | null;
    count: number;
    id: string;
    name: string;
    percentage: number;
  }>;
  total: number;
  days_with_content: number;
  days_without_content: number;
};

function DraggablePost({ post }: { post: Post }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: post.id,
    data: { type: 'Post', post },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const platformColors = {
    instagram: 'bg-[#D76DB6]',
    linkedin: 'bg-[#7AA2F7]',
    x: 'bg-[#E0E5EB]',
  };

  const title =
    post.content?.caption?.substring(0, 52) ||
    post.content_ideas?.raw_idea?.substring(0, 52) ||
    'Sin título';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`group flex cursor-grab items-center gap-2 rounded-xl border border-transparent bg-[#171B22] px-2.5 py-2 text-xs transition-colors ${
        isDragging ? 'opacity-50' : 'hover:border-white/10 hover:bg-[#1B2028]'
      }`}
    >
      <div className={`h-2 w-2 shrink-0 rounded-full ${platformColors[post.platform]}`} />
      <span className="truncate text-[#D7DCE4]">{title}</span>
      <GripVertical className="ml-auto h-3.5 w-3.5 shrink-0 text-[#4E576A] opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}

function DroppableDay({
  date,
  focusedDate,
  isCurrentMonth,
  posts,
}: {
  date: Date;
  focusedDate: Date | null;
  posts: Post[];
  isCurrentMonth: boolean;
}) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const isToday = isSameDay(date, new Date());
  const isFocused = focusedDate ? isSameDay(date, focusedDate) : false;
  const { setNodeRef, isOver } = useDroppable({
    id: dateStr,
    data: { type: 'Day', dateStr },
  });

  return (
    <div
      ref={setNodeRef}
      className={`group relative min-h-[132px] border-r border-b border-white/6 p-2.5 transition-colors ${
        !isCurrentMonth ? 'bg-[#0D1015] opacity-45' : 'bg-[#101417]'
      } ${isOver ? 'bg-[#171B22]' : ''} ${isFocused ? 'ring-1 ring-inset ring-white/25' : ''}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs ${
            isToday
              ? 'bg-white font-bold text-black'
              : 'text-[#6E7788]'
          }`}
        >
          {format(date, 'd')}
        </span>
        <span className="text-[10px] uppercase tracking-[0.24em] text-[#4E576A] opacity-0 transition-opacity group-hover:opacity-100">
          {posts.length > 0 ? `${posts.length} item${posts.length > 1 ? 's' : ''}` : ''}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {posts.map((post) => (
          <DraggablePost key={post.id} post={post} />
        ))}
      </div>


    </div>
  );
}

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const requestedDate = searchParams.get('date');
  const focusedDate = requestedDate ? parseISO(requestedDate) : null;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [scheduledGrouped, setScheduledGrouped] = useState<Record<string, Post[]>>({});
  const [drafts, setDrafts] = useState<Post[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [repeatWarning, setRepeatWarning] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const loadMonthData = async (date: Date) => {
    try {
      setErrorMsg(null);
      const year = format(date, 'yyyy');
      const month = format(date, 'M');

      const [calendarResponse, balanceResponse] = await Promise.all([
        fetch(`/api/calendar/month?year=${year}&month=${month}`),
        fetch(`/api/calendar/balance?year=${year}&month=${month}`),
      ]);

      const calendarData = (await calendarResponse.json()) as {
        drafts?: Post[];
        error?: string;
        scheduled?: Record<string, Post[]>;
      };
      const balanceData = (await balanceResponse.json()) as Balance & { error?: string };

      if (!calendarResponse.ok) {
        throw new Error(calendarData.error || 'No fue posible cargar el calendario');
      }

      if (!balanceResponse.ok) {
        throw new Error(balanceData.error || 'No fue posible cargar el balance editorial');
      }

      setScheduledGrouped(calendarData.scheduled || {});
      setDrafts(calendarData.drafts || []);
      setBalance(balanceData);
    } catch (error) {
      console.error(error);
      setErrorMsg(
        error instanceof Error ? error.message : 'No fue posible cargar el calendario'
      );
    }
  };

  useEffect(() => {
    void loadMonthData(currentDate);
  }, [currentDate]);

  useEffect(() => {
    if (focusedDate && !Number.isNaN(focusedDate.getTime())) {
      setCurrentDate(focusedDate);
    }
  }, [focusedDate, requestedDate]);

  const checkRepeat = async (idea: string) => {
    try {
      const response = await fetch('/api/calendar/check-repeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea }),
      });
      const data = (await response.json()) as {
        is_repeat?: boolean;
        similarity_reason?: string;
      };

      if (data.is_repeat) {
        setRepeatWarning(`⚠️ Este tema es similar a un post reciente. ${data.similarity_reason || ''}`);
      } else {
        setRepeatWarning(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const post = active.data.current?.post as Post | undefined;

    setActiveId(active.id as string);
    setActivePost(post || null);

    if (post?.status === 'draft') {
      const idea = post.content_ideas?.raw_idea || post.content?.caption;
      if (idea) {
        void checkRepeat(idea);
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActivePost(null);

    if (!over) return;

    const postId = active.id as string;
    const post = active.data.current?.post as Post;
    const targetDate = over.id as string;

    if (targetDate === 'drafts-panel') {
      if (post.status !== 'draft') {
        setScheduledGrouped((current) => {
          const next = { ...current };
          Object.keys(next).forEach((key) => {
            next[key] = next[key].filter((item) => item.id !== postId);
          });
          return next;
        });
        setDrafts((current) => [post, ...current]);

        await fetch('/api/calendar/unschedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: postId }),
        });
        void loadMonthData(currentDate);
      }
      return;
    }

    if (post.status === 'draft' || format(parseISO(post.scheduled_at!), 'yyyy-MM-dd') !== targetDate) {
      const scheduledAt = new Date(`${targetDate}T12:00:00Z`).toISOString();
      const updatedPost = { ...post, scheduled_at: scheduledAt, status: 'scheduled' as const };

      setDrafts((current) => current.filter((item) => item.id !== postId));
      setScheduledGrouped((current) => {
        const next = { ...current };
        Object.keys(next).forEach((key) => {
          next[key] = next[key].filter((item) => item.id !== postId);
        });
        if (!next[targetDate]) {
          next[targetDate] = [];
        }
        next[targetDate].push(updatedPost);
        return next;
      });

      await fetch('/api/calendar/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, scheduled_at: scheduledAt }),
      });
      void loadMonthData(currentDate);
    }

    setRepeatWarning(null);
  };

  const startObj = view === 'month' ? startOfMonth(currentDate) : startOfWeek(currentDate, { weekStartsOn: 1 });
  const endObj = view === 'month' ? endOfMonth(currentDate) : endOfWeek(currentDate, { weekStartsOn: 1 });
  const startDate = startOfWeek(startObj, { weekStartsOn: 1 });
  const endDate = endOfWeek(endObj, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const { setNodeRef: setDraftsRef } = useDroppable({ id: 'drafts-panel' });
  const hasScheduledContent = Boolean(balance?.total);
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const handlePreviousPeriod = () => {
    setCurrentDate((current) => (view === 'month' ? subMonths(current, 1) : subWeeks(current, 1)));
  };
  const handleNextPeriod = () => {
    setCurrentDate((current) => (view === 'month' ? addMonths(current, 1) : addWeeks(current, 1)));
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-5 duration-300">
      <div className="rounded-[32px] border border-white/10 bg-[#212631]/40 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.28em] text-[#4E576A]">Planning</p>
            <h1
              className="flex items-center gap-2 text-3xl font-medium text-[#E0E5EB]"
              style={{ fontFamily: 'var(--font-brand-display)' }}
            >
              <CalendarIcon className="h-5 w-5" /> Calendario editorial
            </h1>
            <p className="text-sm leading-6 text-[#8D95A6]">
              Minimalista, limpio y enfocado en decidir qué va cuándo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-full border border-white/10 bg-[#101417] p-1">
              <button
                onClick={() => setView('month')}
                className={`rounded-full px-4 py-1 text-sm transition-colors ${
                  view === 'month'
                    ? 'bg-white font-medium text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Mes
              </button>
              <button
                onClick={() => setView('week')}
                className={`rounded-full px-4 py-1 text-sm transition-colors ${
                  view === 'week'
                    ? 'bg-white font-medium text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Semana
              </button>
            </div>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-[#E0E5EB] transition-colors hover:bg-white/10"
            >
              Hoy
            </button>
            <Link
              href="/compose"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
            >
              <Plus className="h-4 w-4" />
              Crear post
            </Link>
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-[#101417] p-1">
              <button
                onClick={handlePreviousPeriod}
                className="flex h-8 w-8 items-center justify-center rounded-full p-1 text-[#8D95A6] transition-colors hover:bg-white/10 hover:text-white"
              >
                <ChevronLeft size={16} />
              </button>
              <span
                className="min-w-32 text-center text-base font-semibold text-[#E0E5EB]"
                style={{ fontFamily: 'var(--font-brand-display)' }}
              >
                {format(currentDate, 'MMMM yyyy')}
              </span>
              <button
                onClick={handleNextPeriod}
                className="flex h-8 w-8 items-center justify-center rounded-full p-1 text-[#8D95A6] transition-colors hover:bg-white/10 hover:text-white"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {repeatWarning && (
        <div className="flex items-center gap-3 rounded-2xl border border-yellow-500/40 bg-yellow-500/10 p-3 text-yellow-200">
          <AlertTriangle size={18} />
          <span className="text-sm font-medium">{repeatWarning}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-2xl border border-[#462D6E]/40 bg-[#462D6E]/10 p-3 text-sm text-[#E0E5EB]">
          {errorMsg}
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[#101417]">
            <div className="grid grid-cols-7 border-b border-white/6 bg-[#171B22] text-center text-[11px] font-medium uppercase tracking-[0.22em] text-[#6E7788]">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                <div key={day} className="py-3">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-fr">
              {days.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const postsForDay = scheduledGrouped[dateKey] || [];

                return (
                  <DroppableDay
                    key={dateKey}
                    date={day}
                    focusedDate={focusedDate && !Number.isNaN(focusedDate.getTime()) ? focusedDate : null}
                    posts={postsForDay}
                    isCurrentMonth={isSameMonth(day, currentDate)}
                  />
                );
              })}
            </div>
          </div>

          <div
            ref={setDraftsRef}
            className="flex min-h-[560px] flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[#171B22]"
          >
            <div className="flex items-center justify-between border-b border-white/6 px-4 py-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#4E576A]">Panel</p>
                <h3
                  className="mt-1 flex items-center gap-2 text-lg font-medium text-[#E0E5EB]"
                  style={{ fontFamily: 'var(--font-brand-display)' }}
                >
                  <LayoutList size={16} /> Pendientes
                </h3>
              </div>
              <span
                className={`rounded-full border border-white/10 px-2.5 py-1 text-xs ${
                  drafts.length === 0 ? 'text-zinc-500' : 'text-[#E0E5EB]'
                }`}
              >
                {drafts.length}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
              {drafts.length === 0 ? (
                <EmptyState
                  icon={LayoutList}
                  title="No hay drafts sin agendar"
                  description="Guarda un borrador desde Crear y aparecerá aquí para programarlo cuando toque."
                  action={{ label: 'Crear borrador', href: '/compose' }}
                />
              ) : (
                drafts.map((post) => <DraggablePost key={post.id} post={post} />)
              )}
            </div>
          </div>
        </div>

        <DragOverlay>{activeId && activePost ? <DraggablePost post={activePost} /> : null}</DragOverlay>
      </DndContext>

      {balance && (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-[#212631]/45 p-4">
              <h4 className="mb-3 text-[11px] uppercase tracking-[0.24em] text-[#4E576A]">Distribución</h4>
              {hasScheduledContent ? (
                <div className="flex h-2 overflow-hidden rounded-full bg-[#101417]">
                  {Object.entries(balance.by_platform).map(([platform, count]) => {
                    const percentage = balance.total > 0 ? (count / balance.total) * 100 : 0;
                    const colors: Record<string, string> = {
                      instagram: 'bg-[#D76DB6]',
                      linkedin: 'bg-[#7AA2F7]',
                      x: 'bg-[#E0E5EB]',
                    };

                    return (
                      <div
                        key={platform}
                        style={{ width: `${percentage}%` }}
                        className={`${colors[platform] || 'bg-white'} h-full`}
                        title={`${platform}: ${count}`}
                      />
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={BarChart3}
                  title="Sin distribución todavía"
                  description="Programa tu primer post para empezar a ver cómo se reparte el calendario entre plataformas."
                  action={{ label: 'Crear post', href: '/compose' }}
                />
              )}
            </div>

            <div className="rounded-[24px] border border-white/10 bg-[#212631]/45 p-4">
              <h4 className="mb-3 text-[11px] uppercase tracking-[0.24em] text-[#4E576A]">Ángulos</h4>
              {hasScheduledContent ? (
                <div className="flex h-2 overflow-hidden rounded-full bg-[#101417]">
                  {Object.entries(balance.by_angle).map(([angle, count], index) => {
                    const percentage = balance.total > 0 ? (count / balance.total) * 100 : 0;
                    const colors = ['bg-[#E0E5EB]', 'bg-[#AAB4C8]', 'bg-[#7D889C]', 'bg-[#4E576A]'];

                    return (
                      <div
                        key={angle}
                        style={{ width: `${percentage}%` }}
                        className={`${colors[index % colors.length]} h-full`}
                        title={`${angle}: ${count}`}
                      />
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={Lightbulb}
                  title="Sin ángulos detectados"
                  description="Cuando empieces a agendar ideas, aquí verás qué enfoques dominan y cuáles te faltan."
                  action={{ label: 'Crear post', href: '/compose' }}
                />
              )}
            </div>

            <div className="rounded-[24px] border border-white/10 bg-[#212631]/45 p-4">
              <div className="mb-3 flex items-end justify-between">
                <h4 className="text-[11px] uppercase tracking-[0.24em] text-[#4E576A]">Consistencia</h4>
                <span className="inline-flex items-center gap-1.5 text-sm text-[#E0E5EB]">
                  <Flame className={`h-4 w-4 ${balance.days_with_content > 0 ? 'text-orange-300' : 'text-white/35'}`} />
                  {balance.days_with_content} días
                </span>
              </div>
              {hasScheduledContent ? (
                <div className="flex items-center gap-1">
                  {Array.from({ length: daysInMonth }).map((_, index) => {
                    const dateKey = format(
                      new Date(currentDate.getFullYear(), currentDate.getMonth(), index + 1),
                      'yyyy-MM-dd'
                    );
                    const hasPost = Boolean(scheduledGrouped[dateKey]?.length);

                    return (
                      <div
                        key={index}
                        className={`h-2 flex-1 rounded-sm ${hasPost ? 'bg-[#E0E5EB]' : 'bg-[#101417]'}`}
                        title={`${index + 1}`}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-1.5 text-white/30">
                    {Array.from({ length: 7 }).map((_, index) => (
                      <div key={index} className="flex items-center gap-1.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.02]">
                          <Flame className="h-3.5 w-3.5" />
                        </span>
                        {index < 6 ? <span className="h-px w-3 bg-white/10" /> : null}
                      </div>
                    ))}
                  </div>
                  <EmptyState
                    icon={Flame}
                    title="La racha aún no empieza"
                    description="Agenda algo esta semana para encender el streak del calendario y empezar a construir consistencia."
                    action={{ label: 'Crear post', href: '/compose' }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#212631]/45 p-4">
            <div className="mb-4">
              <h4 className="text-[11px] uppercase tracking-[0.24em] text-[#4E576A]">Balance de pilares</h4>
              <p className="mt-2 text-sm leading-6 text-[#8D95A6]">
                Revisa si el mes realmente está construyendo autoridad en varios frentes, no solo repitiendo el mismo ángulo.
              </p>
            </div>

            {balance.by_pillar.length > 0 ? (
              <div className="space-y-4">
                {balance.by_pillar.map((pillar) => (
                  <div key={pillar.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-[#E0E5EB]">{pillar.name}</span>
                      <span className="text-[#8D95A6]">
                        {pillar.count} post{pillar.count === 1 ? '' : 's'} · {Math.round(pillar.percentage)}%
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-[#101417]">
                      <div
                        className="h-full rounded-full transition-[width]"
                        style={{
                          backgroundColor: pillar.color || '#4E576A',
                          width: `${pillar.percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}

                <div className="space-y-2 border-t border-white/8 pt-4 text-sm text-[#F3D19C]">
                  {balance.by_pillar
                    .filter((pillar) => pillar.count === 0)
                    .map((pillar) => (
                      <p key={pillar.id}>⚠️ Sin posts de &apos;{pillar.name}&apos; este mes</p>
                    ))}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={BarChart3}
                title="Aún no hay pilares configurados"
                description="Define tus pilares en Estrategia para medir si el calendario está construyendo autoridad de forma balanceada."
                action={{ label: 'Ir a estrategia', href: '/settings?section=studio&tab=strategy' }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
