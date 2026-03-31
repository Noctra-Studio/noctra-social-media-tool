"use client";

import React, { useState } from "react";
import { X, Save } from "lucide-react";
import { type Textbox } from "fabric";
import { cn } from "@/lib/utils";
import { type TextStyle, saveTextStyle } from "@/lib/editor/text-styles";

type SaveTextStyleDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  activeObject: Textbox;
  onSave: () => void;
};

export function SaveTextStyleDialog({ isOpen, onClose, activeObject, onSave }: SaveTextStyleDialogProps) {
  const [name, setName] = useState("");

  if (!isOpen) return null;

  const handleSave = () => {
    const data = (activeObject as any).data || {};
    const shadow = activeObject.shadow as any;
    
    const newStyle: TextStyle = {
      id: `style-${Date.now()}`,
      name: name || "Nuevo Estilo",
      createdAt: Date.now(),
      fontFamily: activeObject.fontFamily || "Inter",
      fontSize: activeObject.fontSize || 36,
      fontWeight: String(activeObject.fontWeight || "400"),
      fontStyle: activeObject.fontStyle || "normal",
      fill: typeof activeObject.fill === 'string' ? activeObject.fill : "#E0E5EB",
      charSpacing: activeObject.charSpacing || 0,
      lineHeight: activeObject.lineHeight || 1.16,
      textAlign: (activeObject as any).textAlign || 'left',
      textTransform: data.textTransform || "none",
      shadow: shadow ? {
        enabled: true,
        color: shadow.color || "rgba(0,0,0,0.5)",
        blur: shadow.blur || 8,
        offsetX: shadow.offsetX || 4,
        offsetY: shadow.offsetY || 4,
      } : null,
      stroke: (activeObject.stroke && activeObject.stroke !== 'transparent') ? {
        enabled: true,
        color: activeObject.stroke as string,
        width: activeObject.strokeWidth || 2,
      } : null,
      gradientFill: data.gradientFill ? {
        enabled: true,
        color1: data.gradientFill.color1,
        color2: data.gradientFill.color2,
        angle: data.gradientFill.angle,
      } : null,
    };

    saveTextStyle(newStyle);
    onSave();
    onClose();
    setName("");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-[400px] rounded-[32px] border border-white/10 bg-[#101417] p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-[#E0E5EB]">Guardar estilo</h3>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-white/5 transition-colors">
            <X className="h-5 w-5 text-[#4E576A]" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Preview */}
          <div className="flex h-24 w-full items-center justify-center rounded-2xl bg-[#14171C] border border-white/5 overflow-hidden">
            <span 
              style={{
                fontFamily: activeObject.fontFamily,
                fontWeight: activeObject.fontWeight,
                fontStyle: activeObject.fontStyle,
                color: (activeObject as any).data?.gradientFill ? 'transparent' : (typeof activeObject.fill === 'string' ? activeObject.fill : '#E0E5EB'),
                background: (activeObject as any).data?.gradientFill ? `linear-gradient(${90 - (activeObject as any).data.gradientFill.angle}deg, ${(activeObject as any).data.gradientFill.color1}, ${(activeObject as any).data.gradientFill.color2})` : 'none',
                WebkitBackgroundClip: (activeObject as any).data?.gradientFill ? 'text' : 'none',
                WebkitTextStroke: (activeObject.stroke && activeObject.stroke !== 'transparent') ? `${(activeObject.strokeWidth || 2) / 4}px ${activeObject.stroke}` : 'none',
                textShadow: activeObject.shadow ? `${(activeObject.shadow as any).offsetX / 4}px ${(activeObject.shadow as any).offsetY / 4}px ${(activeObject.shadow as any).blur / 4}px ${(activeObject.shadow as any).color}` : 'none',
              }}
              className="text-4xl"
            >
              Aa
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#4E576A]">Nombre del estilo</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Titular Negocios"
              className="w-full rounded-2xl border border-white/10 bg-[#14171C] px-4 py-3 text-sm text-[#E0E5EB] outline-none focus:border-[#4E576A]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-2xl bg-white/5 py-3 text-sm font-bold text-[#E0E5EB] transition-colors hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#E0E5EB] py-3 text-sm font-bold text-[#101417] transition-opacity hover:opacity-90"
            >
              <Save className="h-4 w-4" />
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
