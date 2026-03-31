import React, { useState } from 'react'
import { Palette, Baseline, Droplets, Check, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CarouselTheme, PRESET_THEMES } from '@/lib/editor/carousel-theme'
import { ColorPicker } from './color-picker'
import { EDITOR_FONT_OPTIONS } from '@/lib/editor-fonts'

type ThemePanelProps = {
  currentThemeId: string
  onSelectTheme: (id: string) => void
  activeTheme: CarouselTheme
  customThemes: CarouselTheme[]
  onApplyAll: () => void
  editingCustomTheme: CarouselTheme
  setEditingCustomTheme: (theme: CarouselTheme) => void
  onSaveCustomTheme: (theme: CarouselTheme) => void
}

export function ThemePanel({
  currentThemeId,
  onSelectTheme,
  activeTheme,
  customThemes,
  onApplyAll,
  editingCustomTheme,
  setEditingCustomTheme,
  onSaveCustomTheme,
  coherenceScore,
}: ThemePanelProps & { coherenceScore: number }) {
  const [isExpandingCustom, setIsExpandingCustom] = useState(currentThemeId === 'custom')

  const allThemes = [...PRESET_THEMES.filter(t => t.id !== 'custom'), ...customThemes]

  const getCoherenceColor = (score: number) => {
    if (score >= 90) return 'bg-[#22c55e]'
    if (score >= 70) return 'bg-[#eab308]'
    return 'bg-[#ef4444]'
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Coherence Score Section */}
      <section className="rounded-2xl border border-white/8 bg-[#212631]/40 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#4E576A]">Coherencia Visual</span>
          <span className={cn("text-xs font-bold", coherenceScore >= 70 ? "text-[#E0E5EB]" : "text-[#8D95A6]")}>
            {coherenceScore}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <div 
            className={cn("h-full transition-all duration-500", getCoherenceColor(coherenceScore))}
            style={{ width: `${coherenceScore}%` }}
          />
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-[#4E576A]">
          {coherenceScore >= 90 
            ? "¡Excelente! Tu carrusel mantiene una linea visual impecable." 
            : "Aplica el tema global para unificar fuentes y acentos."}
        </p>
      </section>

      <section>
        <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-[#4E576A]">Tema del carrusel</h3>
        <div className="grid grid-cols-2 gap-3">
          {PRESET_THEMES.filter(t => t.id !== 'custom').map((theme) => (
            <button
              key={theme.id}
              onClick={() => onSelectTheme(theme.id)}
              onDoubleClick={onApplyAll}
              className={cn(
                "group relative h-[48px] w-full overflow-hidden rounded-lg border-2 transition-all",
                currentThemeId === theme.id ? "border-[#E0E5EB] scale-[1.02]" : "border-transparent hover:border-white/10"
              )}
            >
              <div className="flex h-full w-full">
                <div style={{ backgroundColor: theme.primary }} className="h-full w-1/2" />
                <div style={{ backgroundColor: theme.accent }} className="h-full w-1/2" />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-black/40 px-1 py-0.5 text-center">
                <span className="text-[9px] font-medium text-white">{theme.name}</span>
              </div>
            </button>
          ))}
          
          <button
              onClick={() => {
                onSelectTheme('custom')
                setIsExpandingCustom(true)
              }}
              className={cn(
                "group relative h-[48px] w-full overflow-hidden rounded-lg border-2 transition-all bg-[#212631]",
                currentThemeId === 'custom' ? "border-[#E0E5EB] scale-[1.02]" : "border-transparent hover:border-white/10"
              )}
            >
              <div className="flex h-full w-full items-center justify-center">
                <Palette className="h-4 w-4 text-[#8D95A6]" />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-black/40 px-1 py-0.5 text-center">
                <span className="text-[9px] font-medium text-white">Personalizado</span>
              </div>
            </button>
        </div>
      </section>

      <div className="space-y-4">
        <button
          onClick={() => setIsExpandingCustom(!isExpandingCustom)}
          className="flex items-center text-[11px] font-medium text-[#8D95A6] hover:text-[#E0E5EB]"
        >
          {isExpandingCustom ? "− Ocultar personalización" : "+ Personalizar tema"}
        </button>

        {isExpandingCustom && (
          <div className="space-y-4 rounded-xl bg-white/5 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] text-[#4E576A]">Primario</label>
                <ColorPicker
                  value={editingCustomTheme.primary}
                  onChange={(color) => setEditingCustomTheme({ ...editingCustomTheme, primary: color })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-[#4E576A]">Acento</label>
                <ColorPicker
                  value={editingCustomTheme.accent}
                  onChange={(color) => setEditingCustomTheme({ ...editingCustomTheme, accent: color })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-[#4E576A]">Texto</label>
                <ColorPicker
                  value={editingCustomTheme.text}
                  onChange={(color) => setEditingCustomTheme({ ...editingCustomTheme, text: color })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-[#4E576A]">Secundario</label>
                <ColorPicker
                  value={editingCustomTheme.secondary}
                  onChange={(color) => setEditingCustomTheme({ ...editingCustomTheme, secondary: color })}
                />
              </div>
            </div>

            <div className="space-y-3">
               <div>
                 <label className="mb-1 block text-[10px] text-[#4E576A]">Fuente Titulares</label>
                 <select
                   value={editingCustomTheme.fontHeading}
                   onChange={(e) => setEditingCustomTheme({ ...editingCustomTheme, fontHeading: e.target.value })}
                   className="w-full rounded-lg bg-[#212631] border-none text-[12px] text-[#E0E5EB] px-2 py-1.5 focus:ring-1 focus:ring-[#462D6E]"
                 >
                   {EDITOR_FONT_OPTIONS.map(f => (<option key={f.id} value={f.family}>{f.label}</option>))}
                 </select>
               </div>
               <div>
                 <label className="mb-1 block text-[10px] text-[#4E576A]">Fuente Cuerpo</label>
                 <select
                   value={editingCustomTheme.fontBody}
                   onChange={(e) => setEditingCustomTheme({ ...editingCustomTheme, fontBody: e.target.value })}
                   className="w-full rounded-lg bg-[#212631] border-none text-[12px] text-[#E0E5EB] px-2 py-1.5 focus:ring-1 focus:ring-[#462D6E]"
                 >
                   {EDITOR_FONT_OPTIONS.map(f => (<option key={f.id} value={f.family}>{f.label}</option>))}
                 </select>
               </div>
            </div>

            <button
              onClick={() => onSaveCustomTheme(editingCustomTheme)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#462D6E] py-2 text-[11px] font-bold text-white transition-opacity hover:opacity-90"
            >
              <Save className="h-3 w-3" />
              Guardar tema
            </button>
          </div>
        )}
      </div>

      <button
        onClick={onApplyAll}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#E0E5EB] py-3 text-sm font-bold text-[#E0E5EB] transition-colors hover:bg-[#E0E5EB] hover:text-[#101417]"
      >
        <Check className="h-4 w-4" />
        Aplicar tema a todos los slides
      </button>
    </div>
  )
}
