'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragEndEvent,
  DragStartEvent
} from '@dnd-kit/core'
import { GripVertical, PackageOpen } from 'lucide-react'

// Tipos base
type DraftItem = {
  id: string
  title: string
  type: string
  dayId: number | null // null si está en el sidebar, número si está en un día
}

type DayItem = {
  id: number
  dayNumber: number | null
  isToday: boolean
}

// -------------------------------------------------------------
// Componente 1: DraggableDraft
// -------------------------------------------------------------
function DraggableDraft({ draft }: { draft: DraftItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `draft-${draft.id}`,
    data: { type: 'Draft', draft },
  })

  // Estilos de arrastre aplicados al transform
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group flex cursor-grab items-center gap-3 rounded-md border border-zinc-800 bg-zinc-800 p-3 shadow-sm transition-opacity hover:border-zinc-700 hover:bg-zinc-800/80 active:cursor-grabbing ${
        isDragging ? 'opacity-50' : 'opacity-100 z-50'
      }`}
    >
      <GripVertical
        strokeWidth={2}
        className="h-4 w-4 shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-400"
      />
      <div className="flex flex-col min-w-0">
        <span className="truncate text-xs font-medium text-zinc-200">
          {draft.title}
        </span>
        <span className="text-[10px] text-zinc-500">{draft.type}</span>
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// Componente 2: DroppableCalendarDay
// -------------------------------------------------------------
function DroppableCalendarDay({
  day,
  dayDrafts,
}: {
  day: DayItem
  dayDrafts: DraftItem[]
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${day.id}`,
    data: { type: 'Day', dayId: day.id },
  })

  // Feedback visual si se está pasando algo por encima
  const isOverStyle = isOver ? 'bg-zinc-800/50 border-zinc-600' : ''
  const emptyStyle = !day.dayNumber ? 'bg-zinc-900/10' : 'hover:bg-zinc-900/20'

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[120px] flex-col gap-2 border-b border-r border-zinc-800 p-2 transition-colors ${emptyStyle} ${isOverStyle}`}
    >
      {day.dayNumber && (
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
            day.isToday
              ? 'bg-white font-semibold text-black'
              : 'text-zinc-500'
          }`}
        >
          {day.dayNumber}
        </span>
      )}

      {/* Renderizar los borradores caídos en este día */}
      <div className="flex flex-col gap-1.5 flex-1">
        {dayDrafts.map((draft) => (
          <DraggableDraft key={draft.id} draft={draft} />
        ))}
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// Componente 3: DroppableSidebarPanel
// -------------------------------------------------------------
function DroppableSidebarPanel({
  sidebarDrafts,
}: {
  sidebarDrafts: DraftItem[]
}) {
  // Configurado para poder devolver cosas al sidebar
  const { setNodeRef, isOver } = useDroppable({
    id: 'sidebar-droppable',
    data: { type: 'Sidebar' },
  })

  return (
    <aside
      ref={setNodeRef}
      className={`flex w-[320px] shrink-0 flex-col border-l border-zinc-800 bg-zinc-900/30 p-5 transition-colors ${
        isOver ? 'bg-zinc-800/20 shadow-inner' : ''
      }`}
    >
      <h2 className="mb-5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Pendientes
      </h2>

      {sidebarDrafts.length === 0 ? (
        <div className="mb-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 py-10 px-6 text-center">
          <PackageOpen strokeWidth={1.5} className="mb-4 h-12 w-12 text-zinc-600" />
          <p className="text-sm text-zinc-400">No hay borradores sin agendar</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sidebarDrafts.map((draft) => (
            <DraggableDraft key={draft.id} draft={draft} />
          ))}
        </div>
      )}
    </aside>
  )
}

// -------------------------------------------------------------
// MAIN: EditorialCalendar View con DndContext
// -------------------------------------------------------------
export function EditorialCalendar() {
  // Estado local simulado (Días y Borradores)
  const [days] = useState<DayItem[]>(
    Array.from({ length: 35 }, (_, i) => {
      const dayNumber = i - 2 > 0 && i - 2 <= 31 ? i - 2 : null
      return { id: i, dayNumber, isToday: dayNumber === 15 }
    })
  )

  const [drafts, setDrafts] = useState<DraftItem[]>([
    { id: 'draft-1', title: 'Campaña Q3: Anuncio inicial', type: 'Carrusel', dayId: null },
    { id: 'draft-2', title: 'Proceso creativo del diseño', type: 'Reel', dayId: null },
    { id: 'draft-3', title: 'Hilo sobre consistencia', type: 'Post Escrito', dayId: null },
  ])

  // DragOverlay State (para renderizar qué se arrastra encima)
  const [activeDraft, setActiveDraft] = useState<DraftItem | null>(null)

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const draftData = active.data.current?.draft as DraftItem
    if (draftData) setActiveDraft(draftData)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDraft(null)

    const { active, over } = event
    if (!over) return // Lo soltaron en la nada

    const activeId = active.id
    const overId = over.id
    const overData = over.data.current

    setDrafts((prev) =>
      prev.map((d) => {
        if (`draft-${d.id}` === activeId) {
          // Si lo soltaron sobre un día del calendario
          if (overData?.type === 'Day') {
            return { ...d, dayId: overData.dayId }
          }
          // Si lo devolvieron al panel derecho ('sidebar-droppable')
          if (overData?.type === 'Sidebar') {
            return { ...d, dayId: null }
          }
        }
        return d
      })
    )
  }

  const sidebarDrafts = drafts.filter((d) => d.dayId === null)

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-full min-h-screen bg-zinc-950 font-sans text-white">
        
        {/* --- CENTRO: Calendario --- */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
            <h1 className="text-xl font-medium text-zinc-100">Octubre 2026</h1>
          </header>

          <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-900/30">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
              <div
                key={day}
                className="py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid flex-1 auto-rows-fr grid-cols-7 bg-zinc-950">
            {days.map((day) => (
              <DroppableCalendarDay
                key={`day-${day.id}`}
                day={day}
                dayDrafts={drafts.filter((d) => d.dayId === day.id)}
              />
            ))}
          </div>
        </div>

        {/* --- DERECHA: Pendientes --- */}
        <DroppableSidebarPanel sidebarDrafts={sidebarDrafts} />

        {/* --- OVERLAY: Estado visual persiguiendo el cursor --- */}
        <DragOverlay>
          {activeDraft ? (
            <div className="group flex cursor-grabbing items-center gap-3 rounded-md border border-zinc-700 bg-zinc-800 shadow-xl p-3 opacity-90 scale-105 transition-transform rotate-2 w-[280px]">
              <GripVertical className="h-4 w-4 shrink-0 text-zinc-400" />
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs font-medium text-white">
                  {activeDraft.title}
                </span>
                <span className="text-[10px] text-zinc-400">{activeDraft.type}</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>

      </div>
    </DndContext>
  )
}
