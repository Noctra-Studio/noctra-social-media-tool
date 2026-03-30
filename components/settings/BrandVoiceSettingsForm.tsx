'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Loader2, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { TagInput } from '@/components/ui/tag-input'

type BrandVoiceRow = {
  example_posts: string[] | null
  forbidden_words: string[] | string | null
  id: string
  tone: string | null
  values: string[] | string | null
}

function readStringList(value: string[] | string | null | undefined) {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

export function BrandVoiceSettingsForm() {
  const supabase = useMemo(() => createClient(), [])
  const [id, setId] = useState<string | null>(null)
  const [tone, setTone] = useState('')
  const [values, setValues] = useState<string[]>([])
  const [forbiddenWords, setForbiddenWords] = useState<string[]>([])
  const [examplePosts, setExamplePosts] = useState<string[]>(['', '', ''])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')

  useEffect(() => {
    let isActive = true

    async function loadBrandVoice() {
      try {
        const { data, error } = await supabase
          .from('brand_voice')
          .select('*')
          .limit(1)
          .maybeSingle()

        if (error) {
          throw error
        }

        const brandVoice = data as BrandVoiceRow | null

        if (brandVoice && isActive) {
          setId(brandVoice.id)
          setTone(brandVoice.tone || '')
          setValues(readStringList(brandVoice.values))
          setForbiddenWords(readStringList(brandVoice.forbidden_words))

          const loadedExamples = brandVoice.example_posts || []
          const paddedExamples = [
            ...loadedExamples,
            ...Array(Math.max(0, 3 - loadedExamples.length)).fill(''),
          ].slice(0, 5)

          setExamplePosts(paddedExamples)
        }
      } catch (error) {
        console.error('Failed to load brand voice', error)
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadBrandVoice()

    return () => {
      isActive = false
    }
  }, [supabase])

  const handleExampleChange = (index: number, value: string) => {
    setExamplePosts((current) => current.map((post, currentIndex) => (currentIndex === index ? value : post)))
  }

  const addExample = () => {
    setExamplePosts((current) => (current.length < 5 ? [...current, ''] : current))
  }

  const save = async () => {
    setSaving(true)
    setMessage(null)
    setSaveState('idle')

    try {
      const payload = {
        example_posts: examplePosts.filter((post) => post.trim() !== ''),
        forbidden_words: forbiddenWords,
        tone,
        values,
      }

      if (id) {
        const { error } = await supabase.from('brand_voice').update(payload).eq('id', id)

        if (error) {
          throw error
        }
      } else {
        const { data, error } = await supabase
          .from('brand_voice')
          .insert([payload])
          .select()
          .single()

        const brandVoice = data as BrandVoiceRow | null

        if (error) {
          throw error
        }

        if (brandVoice) {
          setId(brandVoice.id)
        }
      }

      setMessage('Voz de marca guardada.')
      setSaveState('saved')
    } catch (error) {
      console.error(error)
      setMessage('No fue posible guardar la voz de marca.')
      setSaveState('error')
    } finally {
      setSaving(false)
    }
  }

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

  if (loading) {
    return (
      <div className="flex min-h-56 items-center justify-center rounded-[28px] border border-white/10 bg-transparent">
        <Loader2 className="h-5 w-5 animate-spin text-[#8D95A6]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5">
        <label className="grid gap-2">
          <span className="mb-1 text-xs font-semibold tracking-[0.16em] text-zinc-400">TONO</span>
          <input
            type="text"
            value={tone}
            onChange={(event) => setTone(event.target.value)}
            placeholder="Directo, moderno, preciso"
            className="rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm text-[#E0E5EB] placeholder:text-[#4E576A] focus:outline-none focus:ring-2 focus:ring-[#E0E5EB]/10"
          />
          <span className="text-xs text-zinc-500">
            Describe el tono de comunicación de tu marca (ej. directo, cercano, técnico)
          </span>
        </label>

        <label className="grid gap-2">
          <span className="mb-1 text-xs font-semibold tracking-[0.16em] text-zinc-400">VALORES</span>
          <TagInput
            value={values}
            placeholder="claridad, criterio, resultados"
            maxTags={12}
            onChange={setValues}
          />
          <span className="text-xs text-zinc-500">
            Palabras clave que representan tus valores de marca
          </span>
        </label>

        <label className="grid gap-2">
          <span className="mb-1 text-xs font-semibold tracking-[0.16em] text-zinc-400">
            PALABRAS PROHIBIDAS
          </span>
          <TagInput
            value={forbiddenWords}
            placeholder="barato, humo, complejo"
            maxTags={20}
            onChange={setForbiddenWords}
          />
          <span className="text-xs text-zinc-500">
            Términos que la IA debe evitar al generar contenido
          </span>
        </label>

        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-4">
            <span className="mb-1 text-xs font-semibold tracking-[0.16em] text-zinc-400">
              POSTS DE REFERENCIA
            </span>
            {examplePosts.length < 5 && (
              <button
                type="button"
                onClick={addExample}
                className="rounded border border-zinc-600 px-2 py-0.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700"
              >
                Añadir
              </button>
            )}
          </div>
          {examplePosts.map((post, index) => (
            <textarea
              key={`${index}-${post.length}`}
              value={post}
              onChange={(event) => handleExampleChange(index, event.target.value)}
              placeholder={
                index === 0
                  ? 'Pega aquí un post tuyo que funcionó bien...'
                  : index === 1
                    ? 'Otro ejemplo de tu estilo de escritura...'
                    : index === 2
                      ? 'Un tercer ejemplo (opcional)...'
                      : `Ejemplo adicional ${index - 2}`
              }
              className="min-h-24 rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm text-[#E0E5EB] placeholder:text-[#4E576A] focus:outline-none focus:ring-2 focus:ring-[#E0E5EB]/10"
            />
          ))}
        </div>
      </div>

      <div className="mt-2 rounded-[24px] border-t border-white/8 pt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-5 text-sm">
            {message ? (
              <p className={saveState === 'error' ? 'text-[#F6B3B3]' : 'text-[#8D95A6]'}>{message}</p>
            ) : (
              <p className="text-[#8D95A6]">Guarda estos ajustes para afinar cómo escribe la IA.</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {saveState === 'saved' && !saving && (
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                <Check className="h-3.5 w-3.5" />
                Guardado
              </span>
            )}
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-[#E0E5EB] px-5 py-2.5 text-sm text-[#101417] transition-colors hover:bg-white disabled:opacity-60"
              style={{ fontFamily: 'var(--font-brand-display)' }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saveState === 'saved' ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saving ? 'Guardando...' : saveState === 'saved' ? 'Guardado' : 'Guardar voz'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
