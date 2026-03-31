"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Trash2, 
  Edit2, 
  Download, 
  Upload, 
  Check, 
  X, 
  Plus, 
  Type, 
  FileJson 
} from "lucide-react";
import { 
  type TextStyle, 
  getTextStyles, 
  saveTextStyle, 
  deleteTextStyle, 
  TEXT_STYLES_STORAGE_KEY 
} from "@/lib/editor/text-styles";
import { cn } from "@/lib/utils";

export function TextStylesSettings() {
  const [styles, setStyles] = useState<TextStyle[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStyles(getTextStyles());
  }, []);

  const refresh = () => setStyles(getTextStyles());

  const handleRename = (style: TextStyle) => {
    const nextStyle = { ...style, name: editName };
    saveTextStyle(nextStyle);
    setEditingId(null);
    refresh();
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Seguro que quieres eliminar este estilo?")) {
      deleteTextStyle(id);
      refresh();
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(styles, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'noctra-text-styles.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as TextStyle[];
        if (Array.isArray(imported)) {
          // Merge with existing
          const current = getTextStyles();
          const merged = [...current];
          imported.forEach(newStyle => {
            if (!merged.find(s => s.id === newStyle.id)) {
              merged.push(newStyle);
            }
          });
          localStorage.setItem(TEXT_STYLES_STORAGE_KEY, JSON.stringify(merged.slice(0, 20)));
          refresh();
          alert("Estilos importados con éxito.");
        }
      } catch (err) {
        alert("Error al importar el archivo JSON.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-medium text-[#E0E5EB]" style={{ fontFamily: 'var(--font-brand-display)' }}>
          Estilos de texto
        </h2>
        <p className="text-sm text-[#8D95A6] max-w-2xl">
          Administra tus combinaciones de texto preferidas. Estos estilos aparecen en el panel lateral del editor para acceso rápido.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <button 
          onClick={handleExport}
          disabled={styles.length === 0}
          className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-[#E0E5EB] transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Exportar JSON
        </button>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-[#E0E5EB] transition-colors hover:bg-white/10"
        >
          <Upload className="h-4 w-4" />
          Importar estilos
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImport} 
            accept=".json" 
            className="hidden" 
          />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {styles.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 rounded-[32px] border border-dashed border-white/10">
            <Type className="h-12 w-12 text-[#4E576A] mb-4" />
            <p className="text-[#8D95A6] text-sm">No tienes estilos guardados todavía.</p>
            <p className="text-[#4E576A] text-xs mt-1">Guarda uno desde el editor para verlo aquí.</p>
          </div>
        )}

        {styles.map((style) => (
          <div 
            key={style.id}
            className="group relative flex flex-col rounded-[32px] border border-white/10 bg-[#14171C] p-6 transition-all hover:border-white/20"
          >
            {/* Preview Area */}
            <div className="flex h-32 w-full items-center justify-center rounded-2xl bg-[#0F1115] border border-white/5 mb-6 overflow-hidden">
               <span 
                style={{
                  fontFamily: style.fontFamily,
                  fontWeight: style.fontWeight,
                  fontStyle: style.fontStyle,
                  color: style.gradientFill?.enabled ? 'transparent' : style.fill,
                  background: style.gradientFill?.enabled ? `linear-gradient(${90 - style.gradientFill.angle}deg, ${style.gradientFill.color1}, ${style.gradientFill.color2})` : 'none',
                  WebkitBackgroundClip: style.gradientFill?.enabled ? 'text' : 'none',
                }}
                className="text-4xl"
              >
                Aa
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              {editingId === style.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 bg-transparent border-b border-white/20 text-sm text-[#E0E5EB] outline-none py-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(style);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                  <button onClick={() => handleRename(style)} className="text-emerald-400">
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-[#4E576A]">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-1 flex-col min-w-0">
                  <span className="text-sm font-medium text-[#E0E5EB] truncate">{style.name}</span>
                  <span className="text-[10px] text-[#4E576A] mt-0.5 uppercase tracking-wider font-bold">
                    {style.fontFamily} • {style.fontWeight}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => {
                    setEditingId(style.id);
                    setEditName(style.name);
                  }}
                  className="p-2 rounded-full hover:bg-white/5 text-[#4E576A] hover:text-[#E0E5EB] transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDelete(style.id)}
                  className="p-2 rounded-full hover:bg-white/5 text-[#4E576A] hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-1.5">
              {style.gradientFill?.enabled && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] text-indigo-300 font-bold uppercase tracking-wider">
                  Gradient
                </span>
              )}
              {style.shadow?.enabled && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] text-amber-300 font-bold uppercase tracking-wider">
                  Shadow
                </span>
              )}
              {style.textTransform !== 'none' && (
                <span className="px-2 py-0.5 rounded-full bg-zinc-500/10 border border-zinc-500/20 text-[9px] text-zinc-300 font-bold uppercase tracking-wider">
                  {style.textTransform}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
