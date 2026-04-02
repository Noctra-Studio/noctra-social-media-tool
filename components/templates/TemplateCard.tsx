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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const processingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let canvasInstance: StaticCanvas | null = null;

    async function generatePreview() {
      if (previewUrl || processingRef.current) return;
      
      processingRef.current = true;

      try {
        const NATIVE_SIZE = 1080;
        const DISPLAY_SIZE = 400;
        const multiplier = DISPLAY_SIZE / NATIVE_SIZE;

        // Use a detached offscreen canvas instead of a DOM ref
        const tempElement = document.createElement("canvas");
        tempElement.width = NATIVE_SIZE;
        tempElement.height = NATIVE_SIZE;

        canvasInstance = new StaticCanvas(tempElement, {
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

        initSlideFromTemplate(canvasInstance, template, mockData, 1, true);
        canvasInstance.renderAll();
        
        // Give a tiny bit of time for fonts to potentially resolve
        await new Promise(r => setTimeout(r, 150));
        
        if (!cancelled && canvasInstance) {
          const dataUrl = canvasInstance.toDataURL({
            format: "webp",
            quality: 0.9,
            multiplier: multiplier * 2,
          });
          setPreviewUrl(dataUrl);
        }
      } catch (err) {
        console.error("Error generating template preview:", err);
      } finally {
        if (canvasInstance) {
          canvasInstance.dispose();
          canvasInstance = null;
        }
        processingRef.current = false;
      }
    }

    generatePreview();
    return () => { 
      cancelled = true; 
      if (canvasInstance) {
        canvasInstance.dispose();
        canvasInstance = null;
      }
    };
  }, [template]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={cn(
          "relative aspect-square overflow-hidden rounded-2xl border transition-all duration-700 ease-out",
          "border-white/5 bg-[#0D1012] shadow-[0_4px_24px_rgba(0,0,0,0.2)]",
          isHovered ? "border-white/20 shadow-[0_40px_80px_rgba(0,0,0,0.6)]" : "border-white/5"
        )}
      >
        {/* Background gradient hint */}
        <div 
          className="absolute inset-0 opacity-10 transition-opacity duration-700 group-hover:opacity-30"
          style={{ background: template.thumbnail }}
        />

        {/* Real Preview Image */}
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={template.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-900/30 backdrop-blur-sm">
            <div className="h-10 w-10 animate-pulse rounded-full bg-white/5" />
          </div>
        )}

        {/* Kittl-style Overlay */}
        <div className={cn(
          "absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 backdrop-blur-[2px]",
          isHovered && "opacity-100"
        )}>
          <button
            onClick={() => onSelect(template.id)}
            className="flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-[13px] font-black uppercase tracking-wider text-black shadow-2xl transition-transform hover:scale-105 active:scale-95"
          >
            <Edit3 className="h-4 w-4" />
            Editar Diseño
          </button>
        </div>

        {/* Labels & Badges */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 p-6 opacity-0 translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
           {/* Possible gradient for label legibility if card is too light */}
           <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-none" />
        </div>

        {/* Suggested Badge (Top Left) */}
        {isSuggested && (
          <div className="absolute left-5 top-5 z-30 flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 shadow-xl">
            <Sparkles className="h-3 w-3 text-[#6C4CE4]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-[#101417]">TOP</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-1 px-1">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-bold tracking-tight text-[#E0E5EB] group-hover:text-white transition-colors">
            {template.name}
          </h3>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#4E576A]">
            {template.category}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
