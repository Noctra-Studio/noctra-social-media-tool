'use client'

import { useEffect, useState } from 'react'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import dynamic from 'next/dynamic'
import { Check, GripVertical, Loader2, Plus, Save, X } from 'lucide-react'

const RichTextEditor = dynamic(
  () => import('@/components/ui/rich-text-editor'),
  { ssr: false }
)
import {
  getLanguageLevelLabel,
  pillarColorOptions,
  type LanguageLevel,
  type PlatformAudience,
  type StrategyResponse,
} from '@/lib/brand-strategy'
import { formatPlatformLabel, platforms, type Platform } from '@/lib/product'

type EditablePillar = {
  color: string
  description: string
  id: string | null
  localId: string
  name: string
  post_count: number
}

type EditableAudience = {
  audience_description: string
  desired_outcomes: string
  language_level: LanguageLevel
  pain_points: string
  platform: Platform
}

const audienceTabs = [...platforms] as Platform[]

function createLocalId() {
  return `pillar-${crypto.randomUUID()}`
}

function createEmptyPillar(index: number): EditablePillar {
  return {
    color: pillarColorOptions[index % pillarColorOptions.length],
    description: '',
    id: null,
    localId: createLocalId(),
    name: '',
    post_count: 0,
  }
}

function buildAudienceState(audiences: PlatformAudience[]) {
  const byPlatform = new Map(audiences.map((audience) => [audience.platform, audience]))

  return audienceTabs.reduce<Record<Platform, EditableAudience>>((accumulator, platform) => {
    const audience = byPlatform.get(platform)

    accumulator[platform] = {
      audience_description: audience?.audience_description || '',
      desired_outcomes: audience?.desired_outcomes || '',
      language_level: audience?.language_level || 'mixed',
      pain_points: audience?.pain_points || '',
      platform,
    }

    return accumulator
  }, {} as Record<Platform, EditableAudience>)
}

function SortablePillarCard({
  index,
  onChange,
  onRemove,
  pillar,
}: {
  index: number
  onChange: (nextPillar: EditablePillar) => void
  onRemove: () => void
  pillar: EditablePillar
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: pillar.localId,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-[28px] border border-white/10 bg-[#101417]/75 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#8D95A6] transition-colors hover:text-white"
            aria-label={`Reordenar pilar ${index + 1}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#4E576A]">Pilar {index + 1}</p>
            <p className="mt-1 text-sm text-[#8D95A6]">{pillar.post_count} posts asociados</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-[#8D95A6] transition-colors hover:border-white/20 hover:text-white"
          aria-label={`Eliminar pilar ${index + 1}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid gap-4">
        <label className="grid gap-2">
          <span className="text-xs font-semibold tracking-[0.16em] text-zinc-400">NOMBRE</span>
          <input
            type="text"
            value={pillar.name}
            maxLength={48}
            onChange={(event) => onChange({ ...pillar, name: event.target.value })}
            placeholder="Claridad digital"
            className="rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm text-[#E0E5EB] placeholder:text-[#4E576A] focus:outline-none focus:ring-2 focus:ring-[#E0E5EB]/10"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-semibold tracking-[0.16em] text-zinc-400">DESCRIPCIÓN</span>
          <textarea
            value={pillar.description}
            onChange={(event) => onChange({ ...pillar, description: event.target.value })}
            placeholder="Desmitificamos lo técnico y lo volvemos útil para tomar decisiones."
            className="min-h-28 rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm text-[#E0E5EB] placeholder:text-[#4E576A] focus:outline-none focus:ring-2 focus:ring-[#E0E5EB]/10"
          />
        </label>

        <div className="grid gap-2">
          <span className="text-xs font-semibold tracking-[0.16em] text-zinc-400">COLOR</span>
          <div className="flex flex-wrap gap-2">
            {pillarColorOptions.map((color) => {
              const active = pillar.color.toUpperCase() === color.toUpperCase()

              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => onChange({ ...pillar, color })}
                  className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs transition-colors ${
                    active
                      ? 'border-white/40 text-white'
                      : 'border-white/10 text-[#8D95A6] hover:border-white/20 hover:text-white'
                  }`}
                >
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                  {color}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export function StrategySettingsForm() {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')
  const [pillars, setPillars] = useState<EditablePillar[]>([])
  const [activeAudiencePlatform, setActiveAudiencePlatform] = useState<Platform>('instagram')
  const [audiences, setAudiences] = useState<Record<Platform, EditableAudience>>(
    buildAudienceState([])
  )

  useEffect(() => {
    let isActive = true

    async function loadStrategy() {
      try {
        const response = await fetch('/api/settings/strategy')
        const data = (await response.json()) as StrategyResponse & { error?: string }

        if (!response.ok) {
          throw new Error(data.error || 'No fue posible cargar la estrategia.')
        }

        if (!isActive) {
          return
        }

        setPillars(
          (data.pillars || []).map((pillar) => ({
            color: pillar.color || pillarColorOptions[0],
            description: pillar.description || '',
            id: pillar.id,
            localId: pillar.id,
            name: pillar.name || '',
            post_count: pillar.post_count || 0,
          }))
        )
        setAudiences(buildAudienceState(data.audiences || []))
      } catch (error) {
        if (isActive) {
          setMessage(error instanceof Error ? error.message : 'No fue posible cargar la estrategia.')
          setSaveState('error')
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    void loadStrategy()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    if (saveState !== 'saved') {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setSaveState('idle')
    }, 2200)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [saveState])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    setPillars((current) => {
      const oldIndex = current.findIndex((pillar) => pillar.localId === active.id)
      const newIndex = current.findIndex((pillar) => pillar.localId === over.id)

      if (oldIndex === -1 || newIndex === -1) {
        return current
      }

      return arrayMove(current, oldIndex, newIndex)
    })
  }

  const updatePillar = (localId: string, nextPillar: EditablePillar) => {
    setPillars((current) =>
      current.map((pillar) => (pillar.localId === localId ? nextPillar : pillar))
    )
  }

  const addPillar = () => {
    setPillars((current) => {
      if (current.length >= 4) {
        return current
      }

      return [...current, createEmptyPillar(current.length)]
    })
  }

  const removePillar = (localId: string) => {
    setPillars((current) => current.filter((pillar) => pillar.localId !== localId))
  }

  const updateAudience = (platform: Platform, nextAudience: EditableAudience) => {
    setAudiences((current) => ({
      ...current,
      [platform]: nextAudience,
    }))
  }

  const saveStrategy = async () => {
    setSaving(true)
    setMessage(null)
    setSaveState('idle')

    try {
      const response = await fetch('/api/settings/strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audiences: audienceTabs.map((platform) => audiences[platform]),
          pillars: pillars.map((pillar, index) => ({
            color: pillar.color,
            description: pillar.description,
            id: pillar.id,
            name: pillar.name,
            sort_order: index,
          })),
        }),
      })

      const data = (await response.json()) as StrategyResponse & { error?: string }

      if (!response.ok) {
        throw new Error(data.error || 'No fue posible guardar la estrategia.')
      }

      setPillars(
        (data.pillars || []).map((pillar) => ({
          color: pillar.color || pillarColorOptions[0],
          description: pillar.description || '',
          id: pillar.id,
          localId: pillar.id,
          name: pillar.name || '',
          post_count: pillar.post_count || 0,
        }))
      )
      setAudiences(buildAudienceState(data.audiences || []))
      setMessage('Estrategia guardada.')
      setSaveState('saved')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible guardar la estrategia.')
      setSaveState('error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-56 items-center justify-center rounded-[28px] border border-white/10 bg-transparent">
        <Loader2 className="h-5 w-5 animate-spin text-[#8D95A6]" />
      </div>
    )
  }

  const activeAudience = audiences[activeAudiencePlatform]

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p
          className="text-2xl font-medium text-[#E0E5EB]"
          style={{ fontFamily: 'var(--font-brand-display)' }}
        >
          Estrategia
        </p>
        <p className="max-w-3xl text-sm leading-6 text-[#8D95A6]">
          Define la arquitectura editorial que guía a la IA: qué territorios quieres
          dominar y cómo cambia la audiencia según la plataforma.
        </p>
      </div>

      <section className="space-y-4 rounded-[28px] border border-white/10 bg-[#171B22]/35 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#4E576A]">A</p>
            <h3
              className="mt-1 text-xl font-medium text-[#E0E5EB]"
              style={{ fontFamily: 'var(--font-brand-display)' }}
            >
              Pilares de contenido
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8D95A6]">
              Hasta 4 pilares para evitar que todo suene correcto pero indistinto.
            </p>
          </div>
          <button
            type="button"
            onClick={addPillar}
            disabled={pillars.length >= 4}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            Añadir pilar
          </button>
        </div>

        {pillars.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-[#101417]/50 p-5 text-sm leading-6 text-[#8D95A6]">
            Todavía no definiste pilares. Empieza por 3 o 4 temas que quieras repetir con
            intención, no solo cuando se te ocurran.
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={pillars.map((pillar) => pillar.localId)} strategy={verticalListSortingStrategy}>
              <div className="grid gap-4">
                {pillars.map((pillar, index) => (
                  <SortablePillarCard
                    key={pillar.localId}
                    index={index}
                    pillar={pillar}
                    onChange={(nextPillar) => updatePillar(pillar.localId, nextPillar)}
                    onRemove={() => removePillar(pillar.localId)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </section>

      <section className="space-y-4 rounded-[28px] border border-white/10 bg-[#171B22]/35 p-4 sm:p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#4E576A]">B</p>
          <h3
            className="mt-1 text-xl font-medium text-[#E0E5EB]"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            Audiencia por plataforma
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8D95A6]">
            El mismo tema necesita distinta profundidad, ejemplos y CTA según quién te lee.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {audienceTabs.map((platform) => (
            <button
              key={platform}
              type="button"
              onClick={() => setActiveAudiencePlatform(platform)}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                activeAudiencePlatform === platform
                  ? 'bg-white text-black'
                  : 'border border-white/10 text-[#B5BDCA] hover:border-white/20 hover:text-white'
              }`}
            >
              {formatPlatformLabel(platform)}
            </button>
          ))}
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <span className="text-xs font-semibold tracking-[0.16em] text-zinc-400">
              ¿QUIÉN TE LEE AQUÍ?
            </span>
            <RichTextEditor
              value={activeAudience.audience_description}
              placeholder="Dueños de PYME, líderes de marketing, directores comerciales..."
              minHeight={120}
              onChange={(html) =>
                updateAudience(activeAudiencePlatform, {
                  ...activeAudience,
                  audience_description: html,
                })
              }
            />
          </div>

          <div className="grid gap-2">
            <span className="text-xs font-semibold tracking-[0.16em] text-zinc-400">
              ¿QUÉ PROBLEMA TIENEN?
            </span>
            <RichTextEditor
              value={activeAudience.pain_points}
              placeholder="Describe los problemas que enfrentan..."
              minHeight={120}
              onChange={(html) =>
                updateAudience(activeAudiencePlatform, {
                  ...activeAudience,
                  pain_points: html,
                })
              }
            />
            <p className="text-xs text-[#4E576A]">Puedes usar listas, negritas e itálicas.</p>
          </div>

          <div className="grid gap-2">
            <span className="text-xs font-semibold tracking-[0.16em] text-zinc-400">
              ¿QUÉ BUSCAN LOGRAR?
            </span>
            <RichTextEditor
              value={activeAudience.desired_outcomes}
              placeholder="Describe qué quieren lograr..."
              minHeight={120}
              onChange={(html) =>
                updateAudience(activeAudiencePlatform, {
                  ...activeAudience,
                  desired_outcomes: html,
                })
              }
            />
            <p className="text-xs text-[#4E576A]">Puedes usar listas, negritas e itálicas.</p>
          </div>

          <div className="grid gap-2">
            <span className="text-xs font-semibold tracking-[0.16em] text-zinc-400">
              NIVEL TÉCNICO DE LA AUDIENCIA
            </span>
            <div className="flex flex-wrap gap-2">
              {(['non-technical', 'mixed', 'technical'] as LanguageLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() =>
                    updateAudience(activeAudiencePlatform, {
                      ...activeAudience,
                      language_level: level,
                    })
                  }
                  className={`rounded-full px-4 py-2 text-sm transition-colors ${
                    activeAudience.language_level === level
                      ? 'bg-white text-black'
                      : 'border border-white/10 text-[#B5BDCA] hover:border-white/20 hover:text-white'
                  }`}
                >
                  {getLanguageLevelLabel(level)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mt-2 rounded-[24px] border-t border-white/8 pt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-5 text-sm">
            {message ? (
              <p className={saveState === 'error' ? 'text-[#F6B3B3]' : 'text-[#8D95A6]'}>{message}</p>
            ) : (
              <p className="text-[#8D95A6]">
                Guarda estos ajustes para que la IA escriba con intención editorial y no solo con tono.
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {saveState === 'saved' && !saving ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                <Check className="h-3.5 w-3.5" />
                Guardado
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => void saveStrategy()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-100 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar estrategia
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
