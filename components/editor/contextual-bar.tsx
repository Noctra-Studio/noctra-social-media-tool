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
  Minus,
  Copy,
  Trash2,
  Lock,
  Unlock,
  MoveUp,
  MoveDown,
  AlignCenterVertical as VerticalCenter
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
  onDelete?: () => void;
  onDuplicate?: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onToggleLock?: () => void;
  onVerticalAlign?: (align: 'top' | 'middle' | 'bottom') => void;
};

export function ContextualBar({ 
  canvas, 
  selectedObject, 
  onCommit,
  onDelete,
  onDuplicate,
  onBringForward,
  onSendBackward,
  onToggleLock,
  onVerticalAlign
}: ContextualBarProps) {
  if (!canvas || !selectedObject) return null;

  const isMultiple = selectedObject instanceof ActiveSelection;
  const isText = selectedObject.type === 'textbox' || selectedObject.type === 'text';
  const isImage = selectedObject.type === 'image';
  const isLocked = Boolean(selectedObject.get('isLocked'));
  
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
    <div className="flex items-center gap-1.5 rounded-[24px] border border-white/10 bg-[#0F1318]/95 p-1.5 pr-3 backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-200">
      {/* Type Indicator */}
      <div className="flex h-10 items-center gap-2.5 rounded-2xl bg-white/5 pl-3 pr-4 border border-white/5">
        {isText ? <Type className="h-4 w-4 text-[#A855F7]" /> : isImage ? <ImageIcon className="h-4 w-4 text-[#3B82F6]" /> : <Layers className="h-4 w-4 text-[#8D95A6]" />}
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#E0E5EB]">
          {isMultiple ? `${(selectedObject as ActiveSelection).getObjects().length} Obj` : isText ? 'Texto' : isImage ? 'Imagen' : 'Objeto'}
        </span>
      </div>

      <div className="h-6 w-px bg-white/10 mx-0.5" />

      {/* --- TEXT CONTROLS --- */}
      {isText && !isLocked && (
        <>
          <div className="flex items-center gap-1 bg-white/5 rounded-2xl px-2 h-10 border border-white/5">
            <button onClick={() => adjustFontSize(-2)} className="h-7 w-7 flex items-center justify-center text-[#4E576A] hover:text-[#E0E5EB] rounded-lg hover:bg-white/5"><Minus size={12} /></button>
            <input 
              type="number" 
              value={fontSize} 
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) {
                  setFontSize(val);
                  updateProperty('fontSize', val);
                }
              }}
              className="w-9 bg-transparent text-center text-xs font-bold text-[#E0E5EB] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
            />
            <button onClick={() => adjustFontSize(2)} className="h-7 w-7 flex items-center justify-center text-[#4E576A] hover:text-[#E0E5EB] rounded-lg hover:bg-white/5"><Plus size={12} /></button>
          </div>

          <div className="h-6 w-px bg-white/10 mx-0.5" />

          {/* Alignment Cluster */}
          <div className="flex items-center gap-0.5">
            {/* Horizontal */}
            <div className="flex items-center p-0.5 bg-white/5 rounded-xl border border-white/5 mr-1">
              <ToolbarButton 
                active={(selectedObject as Textbox).textAlign === 'left'}
                onClick={() => updateProperty('textAlign', 'left')}
                icon={AlignLeft}
                title="Izquierda"
              />
              <ToolbarButton 
                active={(selectedObject as Textbox).textAlign === 'center'}
                onClick={() => updateProperty('textAlign', 'center')}
                icon={AlignCenter}
                title="Centro"
              />
              <ToolbarButton 
                active={(selectedObject as Textbox).textAlign === 'right'}
                onClick={() => updateProperty('textAlign', 'right')}
                icon={AlignRight}
                title="Derecha"
              />
            </div>

            {/* Vertical Presets */}
            <div className="flex items-center p-0.5 bg-white/5 rounded-xl border border-white/5">
              <ToolbarButton 
                onClick={() => onVerticalAlign?.('top')}
                icon={ChevronUp}
                title="Arriba (Preset)"
              />
              <ToolbarButton 
                onClick={() => onVerticalAlign?.('middle')}
                icon={VerticalCenter}
                title="Centro (Preset)"
              />
              <ToolbarButton 
                onClick={() => onVerticalAlign?.('bottom')}
                icon={ChevronDown}
                title="Abajo (Preset)"
              />
            </div>
          </div>
          
          <div className="h-6 w-px bg-white/10 mx-0.5" />
        </>
      )}

      {/* --- COMMON ACTIONS --- */}
      {!isLocked && (
        <div className="flex items-center gap-1">
          <ToolbarButton onClick={onDuplicate} icon={Copy} title="Duplicar (⌘D)" />
          
          <div className="flex items-center p-0.5 bg-white/5 rounded-xl border border-white/5">
            <ToolbarButton onClick={onBringForward} icon={MoveUp} title="Traer" />
            <ToolbarButton onClick={onSendBackward} icon={MoveDown} title="Enviar" />
          </div>
        </div>
      )}

      <div className="h-6 w-px bg-white/10 mx-0.5" />

      {/* Appearance */}
      <div className="flex items-center gap-2 pr-1 ml-1">
        <ColorPicker 
          value={selectedObject.fill as string || "#E0E5EB"}
          onChange={(hex) => updateProperty('fill', hex)}
          label=""
          showLabel={false}
        />

        <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1.5 rounded-2xl h-10 border border-white/5">
          <Ghost className="h-3 w-3 text-[#4E576A]" />
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
            className="w-14 accent-[#A855F7] h-1"
          />
        </div>
      </div>

      <div className="h-6 w-px bg-white/10 mx-0.5" />

      {/* State & Danger */}
      <div className="flex items-center gap-1 ml-1">
        <ToolbarButton 
          active={isLocked}
          onClick={onToggleLock} 
          icon={isLocked ? Lock : Unlock} 
          title={isLocked ? "Desbloquear" : "Bloquear"} 
          className={cn(isLocked && "text-[#A855F7] bg-[#A855F7]/10")}
        />
        <ToolbarButton 
          onClick={onDelete} 
          icon={Trash2} 
          title="Eliminar" 
          className="text-[#F43F5E] hover:bg-[#F43F5E]/10 hover:text-[#F43F5E]"
        />
      </div>
    </div>
  );
}

function ToolbarButton({ 
  onClick, 
  icon: Icon, 
  title, 
  active = false,
  className
}: { 
  onClick?: () => void; 
  icon: any; 
  title?: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
        active 
          ? "bg-[#212631] text-white shadow-inner border border-white/10" 
          : "text-[#8D95A6] hover:bg-white/5 hover:text-[#E0E5EB] opacity-70 hover:opacity-100",
        className
      )}
      title={title}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
