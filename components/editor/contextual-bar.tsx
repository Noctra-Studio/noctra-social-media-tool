"use client";

import React, { useState, useEffect } from "react";
import { 
  Type, 
  ImageIcon, 
  Layers, 
  ChevronUp, 
  ChevronDown, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Baseline,
  Palette,
  Ghost,
  Sparkles,
  Search,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ColorPicker } from "./color-picker";
import { 
  EDITOR_FONT_OPTIONS, 
  findEditorFontByFamily, 
  type EditorFontOption 
} from "@/lib/editor-fonts";
import { 
  type Canvas, 
  type FabricObject, 
  ActiveSelection,
  Textbox
} from "fabric";

type ContextualBarProps = {
  canvas: Canvas | null;
  selectedObject: FabricObject | null;
  onCommit: () => void;
};

export function ContextualBar({ canvas, selectedObject, onCommit }: ContextualBarProps) {
  if (!canvas || !selectedObject) return null;

  const isMultiple = selectedObject instanceof ActiveSelection;
  const isText = selectedObject.type === 'textbox' || selectedObject.type === 'text';
  const isImage = selectedObject.type === 'image';
  
  // Local state for immediate feedback
  const [fontSize, setFontSize] = useState<number>(
    isText ? (selectedObject as Textbox).fontSize || 40 : 0
  );
  const [opacity, setOpacity] = useState<number>(selectedObject.opacity || 1);

  useEffect(() => {
    if (isText) setFontSize((selectedObject as Textbox).fontSize || 40);
    setOpacity(selectedObject.opacity || 1);
  }, [selectedObject, isText]);

  const updateProperty = (prop: string, value: any) => {
    if (!canvas || !selectedObject) return;
    
    if (isMultiple) {
      (selectedObject as ActiveSelection).getObjects().forEach(obj => obj.set(prop as any, value));
    } else {
      selectedObject.set(prop as any, value);
    }
    
    canvas.renderAll();
    onCommit();
  };

  const adjustFontSize = (delta: number) => {
    const next = Math.max(8, fontSize + delta);
    setFontSize(next);
    updateProperty('fontSize', next);
  };

  return (
    <div className="flex items-center gap-1.5 rounded-3xl border border-white/10 bg-[#101417]/95 p-1.5 pr-4 backdrop-blur-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] animate-in fade-in slide-in-from-top-4">
      {/* Type Indicator */}
      <div className="flex h-10 items-center gap-2.5 rounded-2xl bg-white/5 pl-3 pr-4">
        {isText ? <Type className="h-4 w-4 text-[#A855F7]" /> : isImage ? <ImageIcon className="h-4 w-4 text-[#3B82F6]" /> : <Layers className="h-4 w-4 text-[#8D95A6]" />}
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#E0E5EB]">
          {isMultiple ? `${(selectedObject as ActiveSelection).getObjects().length} Objetos` : isText ? 'Texto' : isImage ? 'Imagen' : 'Objeto'}
        </span>
      </div>

      <div className="h-6 w-px bg-white/10 mx-1" />

      {/* --- TEXT CONTROLS --- */}
      {isText && (
        <>
          {/* Font Size Controls */}
          <div className="flex items-center gap-1 bg-white/5 rounded-2xl px-2 h-10">
            <button onClick={() => adjustFontSize(-2)} className="p-1 text-[#4E576A] hover:text-[#E0E5EB]"><Minus size={14} /></button>
            <input 
              type="number" 
              value={fontSize} 
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setFontSize(val);
                updateProperty('fontSize', val);
              }}
              className="w-10 bg-transparent text-center text-xs font-bold text-[#E0E5EB] outline-none" 
            />
            <button onClick={() => adjustFontSize(2)} className="p-1 text-[#4E576A] hover:text-[#E0E5EB]"><Plus size={14} /></button>
          </div>

          <div className="h-6 w-px bg-white/10 mx-1" />

          {/* Alignment */}
          <div className="flex items-center gap-0.5">
            <ToolbarButton 
              active={(selectedObject as Textbox).textAlign === 'left'}
              onClick={() => updateProperty('textAlign', 'left')}
              icon={AlignLeft}
            />
            <ToolbarButton 
              active={(selectedObject as Textbox).textAlign === 'center'}
              onClick={() => updateProperty('textAlign', 'center')}
              icon={AlignCenter}
            />
            <ToolbarButton 
              active={(selectedObject as Textbox).textAlign === 'right'}
              onClick={() => updateProperty('textAlign', 'right')}
              icon={AlignRight}
            />
          </div>
        </>
      )}

      {/* --- IMAGE CONTROLS --- */}
      {isImage && (
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#A855F7]/10 text-[10px] font-bold text-[#A855F7] hover:bg-[#A855F7]/20 transition-all border border-[#A855F7]/20 uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            Vibe / Moods
          </button>
        </div>
      )}

      <div className="h-6 w-px bg-white/10 mx-1" />

      {/* --- COMMON CONTROLS --- */}
      <div className="flex items-center gap-2 pl-2">
        <div className="flex items-center gap-1 mr-2">
          <ColorPicker 
            value={selectedObject.fill as string || "#E0E5EB"}
            onChange={(hex) => updateProperty('fill', hex)}
            label=""
            showLabel={false}
          />
        </div>

        <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-2xl h-10">
          <Ghost className="h-3.5 w-3.5 text-[#4E576A]" />
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05"
            value={opacity} 
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setOpacity(val);
              updateProperty('opacity', val);
            }}
            className="w-16 accent-[#E0E5EB]"
          />
        </div>

        <div className="h-6 w-px bg-white/10 mx-1" />

        <div className="flex items-center gap-1">
          <ToolbarButton onClick={() => { canvas.bringObjectToFront(selectedObject); canvas.renderAll(); onCommit(); }} icon={ChevronUp} title="Traer al frente" />
          <ToolbarButton onClick={() => { canvas.sendObjectToBack(selectedObject); canvas.renderAll(); onCommit(); }} icon={ChevronDown} title="Enviar al fondo" />
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({ 
  onClick, 
  icon: Icon, 
  title, 
  active = false 
}: { 
  onClick: () => void; 
  icon: any; 
  title?: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-xl transition-all",
        active 
          ? "bg-[#212631] text-[#E0E5EB] shadow-inner" 
          : "text-[#4E576A] hover:bg-white/5 hover:text-[#E0E5EB]"
      )}
      title={title}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
