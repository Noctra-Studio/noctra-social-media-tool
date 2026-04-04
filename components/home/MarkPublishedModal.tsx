'use client'

import { Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { formatPlatformLabel, type Platform } from '@/lib/product'

type MarkPublishedModalProps = {
  isOpen: boolean
  onClose: () => void
  onSaved: (payload: {
    external_post_id: string | null
    id: string
    published_at: string
    status: string
    warning?: string | null
  }) => void
  post: {
    externalPostId: string | null
    id: string
    platform: Platform
    publishedAt: string | null
  } | null
}

function toLocalDateTime(value: string | null) {
  const date = value ? new Date(value) : new Date()

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const pad = (input: number) => `${input}`.padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`
}

export function MarkPublishedModal({
  isOpen,
  onClose,
  onSaved,
  post,
}: MarkPublishedModalProps) {
  const [postUrl, setPostUrl] = useState('')
  const [externalPostId, setExternalPostId] = useState('')
  const [publishedAt, setPublishedAt] = useState(toLocalDateTime(null))
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setPostUrl('')
    setExternalPostId(post?.externalPostId ?? '')
    setPublishedAt(toLocalDateTime(post?.publishedAt ?? null))
    setError(null)
  }, [post?.externalPostId, post?.id, post?.publishedAt])

  if (!post) {
    return null
  }

  const currentPost = post

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/posts/mark-published', {
        body: JSON.stringify({
          external_post_id: externalPostId || undefined,
          post_id: currentPost.id,
          post_url: postUrl || undefined,
          published_at: publishedAt ? new Date(publishedAt).toISOString() : undefined,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      const data = (await response.json()) as {
        error?: string
        post?: {
          external_post_id: string | null
          id: string
          published_at: string
          status: string
        }
        warning?: string | null
      }

      if (!response.ok || !data.post) {
        throw new Error(data.error || 'No fue posible marcar el post como publicado.')
      }

      onSaved({
        ...data.post,
        warning: data.warning,
      })
      onClose()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No fue posible marcar el post como publicado.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.form
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            onSubmit={handleSubmit}
            className="relative z-10 w-full max-w-xl rounded-[28px] border border-white/10 bg-[#11161D] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#6F7786]">Publicación manual</p>
                <h3
                  className="mt-2 text-2xl font-medium text-[#E0E5EB]"
                  style={{ fontFamily: 'var(--font-brand-display)' }}
                >
                  Marca tu post como publicado
                </h3>
                <p className="mt-2 max-w-lg text-sm leading-6 text-[#8D95A6]">
                  Pega la URL o el ID del post en {formatPlatformLabel(currentPost.platform)} para que
                  Noctra pueda vincular métricas más tarde.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-[#6F7786] transition-colors hover:bg-white/5 hover:text-[#E0E5EB]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[#D7DCE4]">URL del post</span>
                <input
                  type="url"
                  value={postUrl}
                  onChange={(event) => setPostUrl(event.target.value)}
                  placeholder={
                    currentPost.platform === 'instagram'
                      ? 'https://www.instagram.com/p/ABC123/'
                      : currentPost.platform === 'linkedin'
                        ? 'https://www.linkedin.com/feed/update/urn:li:share:123456789/'
                        : 'https://x.com/usuario/status/123456789'
                  }
                  className="rounded-2xl border border-white/10 bg-[#171C24] px-4 py-3 text-sm text-[#E0E5EB] placeholder:text-[#4E576A] focus:outline-none focus:ring-2 focus:ring-white/10"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-[#D7DCE4]">ID externa del post</span>
                <input
                  type="text"
                  value={externalPostId}
                  onChange={(event) => setExternalPostId(event.target.value)}
                  placeholder="Opcional si ya pegaste la URL"
                  className="rounded-2xl border border-white/10 bg-[#171C24] px-4 py-3 text-sm text-[#E0E5EB] placeholder:text-[#4E576A] focus:outline-none focus:ring-2 focus:ring-white/10"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-[#D7DCE4]">Fecha de publicación</span>
                <input
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(event) => setPublishedAt(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-[#171C24] px-4 py-3 text-sm text-[#E0E5EB] focus:outline-none focus:ring-2 focus:ring-white/10"
                />
              </label>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs leading-5 text-[#6F7786]">
                Si no tienes el ID exacto, puedes marcarlo como publicado igual y añadirlo más tarde.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full px-4 py-2 text-sm text-[#8D95A6] transition-colors hover:text-[#E0E5EB]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white text-sm font-medium text-black px-4 py-2 transition-transform hover:scale-[1.01] disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Guardar publicación
                </button>
              </div>
            </div>
          </motion.form>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
