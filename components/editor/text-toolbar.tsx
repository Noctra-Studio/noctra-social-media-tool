'use client'

import { useEffect, useRef, useState } from 'react'
import { Canvas, Textbox } from 'fabric'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignJustify,
  Bold,
  ChevronDown,
  Italic,
  Minus,
  Plus,
  Type,
  Underline,
} from 'lucide-react'
import { EDITOR_FONT_OPTIONS, ensureEditorFontLoaded } from '@/lib/editor-fonts'
import { cn } from '@/lib/utils'

type TextToolbarProps = {
  canvas: Canvas | null
  object: Textbox
  onCommit: () => void
  position: { x: number; y: number } // posicion en pantalla
}

export function TextToolbar({ canvas, object, onCommit, position }: TextToolbarProps) {
  const [fontSize, setFontSize] = useState(object.fontSize || 40)
  const [fontFamily, setFontFamily] = useState(object.fontFamily || 'Inter')
  const [fontWeight, setFontWeight] = useState(String(object.fontWeight || '400'))
  const [textAlign, setTextAlign] = useState(object.textAlign || 'left')
  const [color, setColor] = useState(String(object.fill || '#E0E5EB'))
  const [showFontList, setShowFontList] = useState(false)
  const [fontSearch, setFontSearch] = useState('')
  const rootRef = useRef<HTMLDivElement | null>(null)

  // Sync con el objeto activo
  useEffect(() => {
    setFontSize(object.fontSize || 40)
    setFontFamily(object.fontFamily || 'Inter')
    setFontWeight(String(object.fontWeight || '400'))
    setTextAlign(object.textAlign || 'left')
    setColor(String(object.fill || '#E0E5EB'))
  }, [object])

  useEffect(() => {
    if (!showFontList) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) {
        return
      }

      setShowFontList(false)
      setFontSearch('')
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [showFontList])

  const update = (props: Record<string, unknown>) => {
    if (!canvas) return
    object.set(props as any)
    object.setCoords()
    setColor(String(object.fill || '#E0E5EB'))
    canvas.renderAll()
    onCommit()
  }

  const filteredFonts = EDITOR_FONT_OPTIONS.filter((font) =>
    font.label.toLowerCase().includes(fontSearch.toLowerCase())
  )

  return (
    <div
      ref={rootRef}
      className="flex items-center gap-1 rounded-[20px] border border-white/10
        bg-[#0F1318]/98 p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)]
        backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150"
      style={{
        position: 'fixed',
        left: Math.max(8, position.x),
        top: Math.max(8, position.y - 56),
        zIndex: 100,
        maxWidth: 'calc(100vw - 16px)',
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {/* Font Family Picker */}
      <div className="relative">
        <button
          onClick={() => setShowFontList((value) => !value)}
          className="flex h-9 min-w-[120px] items-center justify-between gap-2
            rounded-2xl bg-white/5 px-3 text-[12px] text-[#E0E5EB]
            hover:bg-white/10 border border-white/5"
          type="button"
        >
          <span style={{ fontFamily }} className="max-w-[80px] truncate">
            {EDITOR_FONT_OPTIONS.find((font) => font.family === fontFamily)?.label || fontFamily}
          </span>
          <ChevronDown className="h-3 w-3 flex-shrink-0 text-[#4E576A]" />
        </button>

        {showFontList && (
          <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-48
            rounded-2xl border border-white/10 bg-[#0F1317] p-2 shadow-2xl">
            <input
              value={fontSearch}
              onChange={(event) => setFontSearch(event.target.value)}
              placeholder="Buscar..."
              className="w-full rounded-xl bg-white/5 px-2 py-1.5 text-[11px]
                text-[#E0E5EB] placeholder:text-[#4E576A] outline-none mb-2"
              autoFocus
            />
            <div className="max-h-48 space-y-0.5 overflow-y-auto">
              {filteredFonts.map((font) => (
                <button
                  key={font.id}
                  onClick={async () => {
                    await ensureEditorFontLoaded(font)
                    setFontFamily(font.family)
                    update({ fontFamily: font.family })
                    setShowFontList(false)
                    setFontSearch('')
                  }}
                  className={cn(
                    'w-full rounded-lg px-3 py-1.5 text-left text-[12px] text-[#E0E5EB] hover:bg-white/5',
                    fontFamily === font.family && 'bg-white/10'
                  )}
                  style={{ fontFamily: font.previewFamily }}
                  type="button"
                >
                  {font.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="h-5 w-px bg-white/10" />

      {/* Font Size */}
      <div className="flex items-center gap-0.5 rounded-2xl bg-white/5
        px-1.5 border border-white/5">
        <button
          onClick={() => {
            const next = Math.max(8, fontSize - 2)
            setFontSize(next)
            update({ fontSize: next })
          }}
          className="flex h-8 w-7 items-center justify-center rounded-lg text-[#4E576A] hover:text-[#E0E5EB]"
          type="button"
        >
          <Minus className="h-3 w-3" />
        </button>
        <input
          type="number"
          value={fontSize}
          onChange={(event) => {
            const next = parseInt(event.target.value, 10) || 40
            setFontSize(next)
            update({ fontSize: next })
          }}
          className="w-10 bg-transparent text-center text-[12px] font-bold text-[#E0E5EB] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          onClick={() => {
            const next = fontSize + 2
            setFontSize(next)
            update({ fontSize: next })
          }}
          className="flex h-8 w-7 items-center justify-center rounded-lg text-[#4E576A] hover:text-[#E0E5EB]"
          type="button"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      <div className="h-5 w-px bg-white/10" />

      {/* Font Weight */}
      <select
        value={fontWeight}
        onChange={(event) => {
          setFontWeight(event.target.value)
          update({ fontWeight: event.target.value })
        }}
        className="h-9 rounded-2xl bg-white/5 px-2 text-[11px] text-[#E0E5EB]
          outline-none border border-white/5"
      >
        {[
          ['300', 'Book'],
          ['400', 'Regular'],
          ['500', 'Medium'],
          ['700', 'Bold'],
          ['900', 'Black'],
        ].map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <div className="h-5 w-px bg-white/10" />

      {/* Alignment */}
      <div className="flex items-center rounded-2xl bg-white/5 p-0.5 border border-white/5">
        {[
          { align: 'left', Icon: AlignLeft },
          { align: 'center', Icon: AlignCenter },
          { align: 'right', Icon: AlignRight },
        ].map(({ align, Icon }) => (
          <button
            key={align}
            onClick={() => {
              setTextAlign(align)
              update({ textAlign: align })
            }}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-xl transition-all',
              textAlign === align ? 'bg-[#212631] text-white' : 'text-[#4E576A] hover:text-[#E0E5EB]'
            )}
            type="button"
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>

      <div className="h-5 w-px bg-white/10" />

      {/* Color swatch */}
      <button
        onClick={() => {
          // Trigger el ColorPicker del sidebar — emitir evento
          document.dispatchEvent(new CustomEvent('noctra:focus-text-color'))
        }}
        className="h-8 w-8 flex-shrink-0 rounded-full border-2 border-white/20"
        style={{ backgroundColor: color }}
        title="Color del texto (editar en panel derecho)"
        type="button"
      />
    </div>
  )
}
