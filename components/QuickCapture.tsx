'use client'

import { usePathname, useRouter } from 'next/navigation'
import { startTransition, useEffect, useEffectEvent, useRef, useState } from 'react'
import { Check, Loader2, Plus, Sparkles, X } from 'lucide-react'
import { OPEN_QUICK_CAPTURE_EVENT } from '@/lib/quick-capture'
import { createClient } from '@/lib/supabase/client'

export default function QuickCapture() {
  const router = useRouter()
  const pathname = usePathname()
  const timeoutRef = useRef<number | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [idea, setIdea] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()
  const isIdeasPage = pathname === '/ideas'

  const handleOpenRequest = useEffectEvent((seedText?: string) => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    setSuccess(false)
    if (seedText) {
      setIdea(seedText)
    }
    setIsOpen(true)
  })

  function closeCapture() {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    setIsOpen(false)
    setSuccess(false)
  }

  useEffect(() => {
    function handleOpen(event: Event) {
      const customEvent = event as CustomEvent<{ seedText?: string }>
      handleOpenRequest(customEvent.detail?.seedText)
    }

    window.addEventListener(OPEN_QUICK_CAPTURE_EVENT, handleOpen)

    return () => {
      window.removeEventListener(OPEN_QUICK_CAPTURE_EVENT, handleOpen)

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!idea.trim()) {
      return
    }

    setLoading(true)
    setSuccess(false)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Unauthorized')
      }

      const { error } = await supabase
        .from('content_ideas')
        .insert([{ raw_idea: idea.trim(), status: 'raw', user_id: user.id }])

      if (error) {
        throw error
      }

      setSuccess(true)
      setIdea('')
      startTransition(() => {
        router.refresh()
      })

      timeoutRef.current = window.setTimeout(() => {
        closeCapture()
      }, 1200)
    } catch (error) {
      console.error('Error saving idea:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-5 right-4 z-50 md:bottom-6 md:right-6">
      {isOpen ? (
        <div className="w-[min(24rem,calc(100vw-2rem))] rounded-[28px] border border-white/10 bg-[#212631] p-4 text-white shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[#8D95A6]">
                <Sparkles className="h-3.5 w-3.5" />
                Captura rápida
              </div>
              <h3
                className="mt-3 text-lg font-medium text-[#E0E5EB]"
                style={{ fontFamily: 'var(--font-brand-display)' }}
              >
                Guarda la idea antes de que se escape
              </h3>
              <p className="mt-1 text-xs text-[#8D95A6]">
                Una nota basta para volverla contenido después.
              </p>
            </div>
            <button
              type="button"
              onClick={closeCapture}
              className="text-zinc-400 transition-colors hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <textarea
              value={idea}
              onChange={(event) => setIdea(event.target.value)}
              placeholder="Idea, insight, observación o hook..."
              className="min-h-[132px] w-full resize-none rounded-2xl border border-white/10 bg-[#101417] p-3 text-sm text-[#E0E5EB] transition-all placeholder:text-[#4E576A] focus:outline-none focus:ring-2 focus:ring-[#E0E5EB]/20"
              autoFocus
            />

            <button
              type="submit"
              disabled={!idea.trim() || loading || success}
              title={!idea.trim() && !loading && !success ? 'Escribe una idea primero' : undefined}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#E0E5EB] py-2.5 text-sm font-medium text-[#101417] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              style={{ fontFamily: 'var(--font-brand-display)' }}
            >
              {loading ? (
                <Loader2 className="h-[18px] w-[18px] animate-spin" />
              ) : success ? (
                <>
                  <Check className="h-[18px] w-[18px] text-green-600" />
                  Idea guardada
                </>
              ) : (
                <>
                  <Plus className="h-[18px] w-[18px]" />
                  Guardar idea
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="group relative">
          <div className="pointer-events-none absolute inset-[-6px] rounded-full bg-[#E0E5EB]/12 opacity-70 blur-md" />
          <div className="pointer-events-none absolute inset-[-4px] rounded-full border border-[#E0E5EB]/35 opacity-60 animate-ping" />
          <div className="pointer-events-none absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 rounded-full border border-white/10 bg-[#161a22] px-3 py-1 text-xs text-zinc-100 opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 md:block">
            Capturar idea rápida
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className={`relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-[#F7FAFF] via-[#E7EDF7] to-[#CCD6E6] text-[#101417] shadow-[0_18px_40px_rgba(0,0,0,0.35)] transition-transform hover:scale-105 active:scale-95 ${
              isIdeasPage ? 'md:hidden' : 'md:h-auto md:w-auto md:gap-2 md:px-5 md:py-3'
            }`}
            aria-label="Capturar idea rápida"
          >
            <Plus size={24} />
            <span
              className="hidden text-sm font-medium md:inline"
              style={{ fontFamily: 'var(--font-brand-display)' }}
            >
              Capturar idea
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
