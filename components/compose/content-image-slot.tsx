'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Image as ImageIcon, Search, Trash2, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ImageSource } from '@/lib/post-records'

type ContentImageSlotProps = {
  aspectRatio?: 'landscape' | 'portrait' | 'square'
  buttonLabel?: string
  collapsedByDefault?: boolean
  hint?: string
  imageSource?: ImageSource | null
  imageUrl?: string | null
  label: string
  onOpenPicker: () => void
  onRemove: () => void
  onUpload: (file: File) => Promise<void>
}

const ratioClasses: Record<NonNullable<ContentImageSlotProps['aspectRatio']>, string> = {
  landscape: 'aspect-[16/9]',
  portrait: 'aspect-[4/5]',
  square: 'aspect-square',
}

export function ContentImageSlot({
  aspectRatio = 'landscape',
  buttonLabel = '+ Imagen',
  collapsedByDefault = false,
  hint,
  imageSource,
  imageUrl,
  label,
  onOpenPicker,
  onRemove,
  onUpload,
}: ContentImageSlotProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(!collapsedByDefault || Boolean(imageUrl))

  useEffect(() => {
    if (imageUrl) {
      setIsExpanded(true)
    }
  }, [imageUrl])

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setIsUploading(true)

    try {
      await onUpload(file)
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  return (
    <div className="rounded-[22px] border border-white/10 bg-[#101417]">
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-medium text-[#E0E5EB]">{label}</p>
          {hint ? <p className="mt-1 text-xs text-[#6F7786]">{hint}</p> : null}
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#8D95A6]">
          {imageUrl ? 'Lista' : 'Opcional'}
        </span>
      </button>

      {isExpanded ? (
        <div className="space-y-4 border-t border-white/5 px-4 pb-4 pt-4">
          {imageUrl ? (
            <div
              className={cn(
                'relative overflow-hidden rounded-[20px] border border-white/10 bg-[#171B22]',
                ratioClasses[aspectRatio]
              )}
            >
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/20 to-transparent px-4 py-3 text-xs text-white/80">
                <span>{imageSource ? `Fuente: ${imageSource}` : 'Imagen seleccionada'}</span>
                <button
                  type="button"
                  onClick={onRemove}
                  className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[11px] text-white transition-colors hover:bg-black/50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Quitar
                </button>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                'flex items-center justify-center rounded-[20px] border border-dashed border-white/10 bg-[#171B22] text-center',
                ratioClasses[aspectRatio]
              )}
            >
              <div className="space-y-2 px-6">
                <ImageIcon className="mx-auto h-6 w-6 text-[#6F7786]" />
                <p className="text-sm text-[#B5BDCA]">Sin imagen seleccionada</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onOpenPicker}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5"
            >
              <Search className="h-4 w-4" />
              Buscar con IA
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-2 rounded-full border border-[#B8860B]/30 bg-[#B8860B]/10 px-4 py-2 text-sm text-[#F6D37A] transition-colors hover:bg-[#B8860B]/15 disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {isUploading ? 'Subiendo...' : 'Subir archivo'}
            </button>
          </div>

          {/* TODO MOBILE TEST: iOS Safari - abrir galería */}
          {/* TODO MOBILE TEST: iOS Safari - tomar foto */}
          {/* TODO MOBILE TEST: Android Chrome - galería */}
          {/* TODO MOBILE TEST: Android Chrome - cámara */}
          {/* TODO MOBILE TEST: Desktop - drag & drop */}
          {/* TODO MOBILE TEST: Desktop - click to select */}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture={undefined}
            className="hidden"
            onChange={(event) => {
              void handleFileChange(event)
            }}
          />

          {!imageUrl ? (
            <button
              type="button"
              onClick={onOpenPicker}
              className="text-xs text-[#8D95A6] transition-colors hover:text-[#E0E5EB]"
            >
              {buttonLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
