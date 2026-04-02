"use client";

import { useEffect, useRef, useState } from "react";
import { StaticCanvas } from "fabric";
import { Check, Edit3, Eye, Sparkles } from "lucide-react";
import { SlideTemplate } from "@/lib/editor/templates";
import { initSlideFromTemplate } from "@/lib/editor/init-from-template";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface TemplateCardProps {
  template: SlideTemplate;
  onSelect: (id: string) => void;
  isSuggested?: boolean;
}

export function TemplateCard({ template, onSelect, isSuggested }: TemplateCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function generatePreview() {
      if (!canvasRef.current || previewUrl) return;

      const NATIVE_SIZE = 1080;
      const DISPLAY_SIZE = 400;
      const multiplier = DISPLAY_SIZE / NATIVE_SIZE;

      const offscreenCanvas = new StaticCanvas(canvasRef.current, {
        width: NATIVE_SIZE,
        height: NATIVE_SIZE,
        renderOnAddRemove: false,
        enableRetinaScaling: true,
      });

      // Mock data for preview
      const mockData = {
        headline: "Titular de Ejemplo",
        body: "Este es un texto de ejemplo para visualizar la plantilla.",
        visual_direction: "DIRECCIÓN VISUAL",
        stat_or_example: "85%",
      };

      initSlideFromTemplate(offscreenCanvas, template, mockData, 1, true);
      
      offscreenCanvas.renderAll();
      
      // Give a tiny bit of time for fonts
      await new Promise(r => setTimeout(r, 50));
      
      if (!cancelled) {
        setPreviewUrl(offscreenCanvas.toDataURL({
          format: "webp",
          quality: 0.9,
          multiplier: multiplier * 2, // 2x for retina-like quality in small size
        }));
      }

      offscreenCanvas.dispose();
    }

    generatePreview();
    return () => { cancelled = true; };
  }, [template]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={cn(
          "relative aspect-square overflow-hidden rounded-[32px] border transition-all duration-500",
          "border-white/8 bg-[#0A0D0F] shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
          isHovered ? "border-white/20 shadow-[0_32px_64px_rgba(0,0,0,0.5)] -translate-y-2" : "border-white/8"
        )}
      >
        {/* Background gradient hint */}
        <div 
          className="absolute inset-0 opacity-20 transition-opacity duration-500 group-hover:opacity-40"
          style={{ background: template.thumbnail }}
        />

        {/* Real Preview Image */}
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={template.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-900/50 backdrop-blur-sm">
            <div className="h-12 w-12 animate-pulse rounded-full bg-white/5" />
          </div>
        )}

        {/* Hidden canvas for generation */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Overlays */}
        <div className={cn(
          "absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/60 opacity-0 transition-opacity duration-300 backdrop-blur-[2px]",
          isHovered && "opacity-100"
        )}>
          <button
            onClick={() => onSelect(template.id)}
            className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-black transition-transform hover:scale-105 active:scale-95"
          >
            <Edit3 className="h-4 w-4" />
            Usar Plantilla
          </button>
          <button className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-md transition-transform hover:bg-white/20 hover:scale-105 active:scale-95">
            <Eye className="h-4 w-4" />
            Vista previa
          </button>
        </div>

        {/* Suggested Badge */}
        {isSuggested && (
          <div className="absolute left-6 top-6 z-30 flex items-center gap-2 rounded-full border border-white/10 bg-[#462D6E]/90 px-3 py-1.5 shadow-lg backdrop-blur-md">
            <Sparkles className="h-3 w-3 text-[#CDB9FF]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white">Sugerido</span>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute right-6 top-6 z-30 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#8D95A6] backdrop-blur-md">
          {template.category}
        </div>
      </div>

      <div className="mt-6 px-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold tracking-tight text-[#E0E5EB]">{template.name}</h3>
          <div className="h-2 w-2 rounded-full bg-[#6C4CE4]" />
        </div>
        <p className="mt-1 text-sm text-[#8D95A6] line-clamp-1">{template.description}</p>
      </div>
    </motion.div>
  );
}
