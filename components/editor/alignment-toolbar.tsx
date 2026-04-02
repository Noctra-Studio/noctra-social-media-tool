"use client";

import React from "react";
import { 
  AlignStartHorizontal, 
  AlignCenterHorizontal, 
  AlignEndHorizontal, 
  AlignStartVertical, 
  AlignCenterVertical, 
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  Palette,
  Type,
  ChevronUp,
  ChevronDown,
  Layers,
  Ghost
} from "lucide-react";
import { ColorPicker } from "./color-picker";
import { type Canvas, type FabricObject, ActiveSelection } from "fabric";

type AlignmentToolbarProps = {
  canvas: Canvas | null;
  selectedObject: FabricObject | null;
  onCommit: () => void;
};

export function AlignmentToolbar({ canvas, selectedObject, onCommit }: AlignmentToolbarProps) {
  if (!canvas || !selectedObject) return null;

  const isMultiple = selectedObject instanceof ActiveSelection;
  const isTextbox = selectedObject?.type === 'textbox' || selectedObject?.type === 'itext';
  const isCurved = selectedObject?.type === 'group' && (selectedObject as any).data?.type === 'arc-text';
  const CANVAS_SIZE = 1080;

  const align = (type: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => {
    const obj = selectedObject;
    const rect = obj.getBoundingRect();

    if (isMultiple) {
      // Align relative to selection group
      const selection = obj as ActiveSelection;
      selection.getObjects().forEach((child) => {
        const childRect = child.getBoundingRect();
        switch (type) {
          case 'left': child.set({ left: selection.left }); break;
          case 'center-h': child.set({ left: selection.left + (selection.width / 2) - (childRect.width / 2) }); break;
          case 'right': child.set({ left: selection.left + selection.width - childRect.width }); break;
          case 'top': child.set({ top: selection.top }); break;
          case 'center-v': child.set({ top: selection.top + (selection.height / 2) - (childRect.height / 2) }); break;
          case 'bottom': child.set({ top: selection.top + selection.height - childRect.height }); break;
        }
      });
    } else {
      // Align relative to canvas
      switch (type) {
        case 'left': obj.set({ left: 0 }); break;
        case 'center-h': obj.set({ left: CANVAS_SIZE / 2 - (rect.width / 2) }); break;
        case 'right': obj.set({ left: CANVAS_SIZE - rect.width }); break;
        case 'top': obj.set({ top: 0 }); break;
        case 'center-v': obj.set({ top: CANVAS_SIZE / 2 - (rect.height / 2) }); break;
        case 'bottom': obj.set({ top: CANVAS_SIZE - rect.height }); break;
      }
    }

    canvas.requestRenderAll();
    onCommit();
  };

  const distribute = (direction: 'h' | 'v') => {
    if (!isMultiple) return;
    const selection = selectedObject as ActiveSelection;
    const objects = selection.getObjects();
    
    if (objects.length < 3) return;

    if (direction === 'h') {
      const sorted = [...objects].sort((a, b) => a.left - b.left);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const totalWidth = last.left - first.left;
      const spacing = totalWidth / (objects.length - 1);
      
      sorted.forEach((obj, i) => {
        obj.set({ left: first.left + (i * spacing) });
      });
    } else {
      const sorted = [...objects].sort((a, b) => a.top - b.top);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const totalHeight = last.top - first.top;
      const spacing = totalHeight / (objects.length - 1);
      
      sorted.forEach((obj, i) => {
        obj.set({ top: first.top + (i * spacing) });
      });
    }

    canvas.requestRenderAll();
    onCommit();
  };

  return (
    <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-[#101417]/90 p-1.5 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-1">
        <AlignmentButton onClick={() => align('left')} icon={AlignStartHorizontal} title="Alinear a la izquierda" />
        <AlignmentButton onClick={() => align('center-h')} icon={AlignCenterHorizontal} title="Centrar horizontalmente" />
        <AlignmentButton onClick={() => align('right')} icon={AlignEndHorizontal} title="Alinear a la derecha" />
      </div>
      <div className="h-4 w-px bg-white/10" />
      <div className="flex items-center gap-1">
        <AlignmentButton onClick={() => align('top')} icon={AlignStartVertical} title="Alinear arriba" />
        <AlignmentButton onClick={() => align('center-v')} icon={AlignCenterVertical} title="Centrar verticalmente" />
        <AlignmentButton onClick={() => align('bottom')} icon={AlignEndVertical} title="Alinear abajo" />
      </div>
      
      {isMultiple && (
        <>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-1">
            <AlignmentButton onClick={() => distribute('h')} icon={AlignHorizontalDistributeCenter} title="Distribuir horizontal" />
            <AlignmentButton onClick={() => distribute('v')} icon={AlignVerticalDistributeCenter} title="Distribuir vertical" />
          </div>
        </>
      )}

      <div className="h-4 w-px bg-white/10" />

      {/* Layer Order */}
      <div className="flex items-center gap-1">
        <AlignmentButton onClick={() => { canvas.bringObjectToFront(selectedObject); canvas.renderAll(); onCommit(); }} icon={ChevronUp} title="Traer al frente" />
        <AlignmentButton onClick={() => { canvas.sendObjectToBack(selectedObject); canvas.renderAll(); onCommit(); }} icon={ChevronDown} title="Enviar al fondo" />
      </div>

      <div className="h-4 w-px bg-white/10" />

      {/* Opacity */}
      <div className="flex items-center gap-2 px-2 group relative">
        <Ghost className="h-3.5 w-3.5 text-[#4E576A]" />
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.1" 
          value={selectedObject.opacity} 
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (isMultiple) {
              (selectedObject as ActiveSelection).getObjects().forEach(o => o.set('opacity', val));
            } else {
              selectedObject.set('opacity', val);
            }
            canvas.renderAll();
            onCommit();
          }}
          className="w-16 accent-[#E0E5EB]"
        />
      </div>

      <div className="h-4 w-px bg-white/10" />
      
      {/* Quick Color */}
      <div className="relative flex items-center px-1">
        <ColorPicker 
          value={String(selectedObject.stroke !== 'transparent' && selectedObject.fill === 'transparent' ? selectedObject.stroke : selectedObject.fill || "#E0E5EB").slice(0, 7)}
          onChange={(hex) => {
            if (isMultiple) {
              (selectedObject as ActiveSelection).getObjects().forEach(o => o.set('fill', hex));
            } else {
              selectedObject.set(selectedObject.fill === 'transparent' ? 'stroke' : 'fill', hex);
              // Handle per-character if selected
              if ((selectedObject as any).isEditing) {
                (selectedObject as any).setSelectionStyles({ fill: hex });
              }
            }
            canvas.renderAll();
            onCommit();
          }}
          label=""
          showLabel={false}
        />
      </div>

      {isCurved && (
        <>
          <div className="h-4 w-px bg-white/10" />
          <button 
            onClick={() => (canvas as any).fire('text:edit-curved', { target: selectedObject })}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 text-[11px] font-bold text-[#E0E5EB] hover:bg-white/10"
          >
            <Type className="h-3.5 w-3.5" />
            Editar texto
          </button>
        </>
      )}
    </div>
  );
}

function AlignmentButton({ onClick, icon: Icon, title }: { onClick: () => void; icon: any; title: string }) {
  return (
    <button
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8D95A6] transition-colors hover:bg-white/5 hover:text-[#E0E5EB]"
      title={title}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
