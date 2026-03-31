"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Info, Layout, RotateCcw, X } from "lucide-react";
import { StaticCanvas } from "fabric";
import { InstagramCarouselSlide } from "@/lib/social-content";
import { templates, SlideTemplate } from "@/lib/editor/templates";
import { initSlideFromTemplate } from "@/lib/editor/init-from-template";
import { cn } from "../../lib/utils";

interface TemplateSelectorProps {
  onSelect: (template: SlideTemplate | null, applyToAll?: boolean) => void;
  onKeepCurrent?: () => void;
  currentSlideIndex?: number;
  slideData: InstagramCarouselSlide;
  mode?: "modal" | "compact";
  suggestedTemplateId?: string | null;
}

export function TemplateSelector({
  onSelect,
  onKeepCurrent,
  currentSlideIndex = 0,
  slideData,
  mode = "modal",
  suggestedTemplateId,
}: TemplateSelectorProps) {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [applyToAll, setApplyToAll] = useState(false);

  useEffect(() => {
    // Generate thumbnails for templates on mount
    const generatePreviews = () => {
      const newPreviews: Record<string, string> = {};
      const canvasElement = document.createElement("canvas");
      canvasElement.width = 200;
      canvasElement.height = 200;
      const offscreenCanvas = new StaticCanvas(canvasElement);
      offscreenCanvas.setZoom(200 / 1080);

      Object.values(templates).forEach((template) => {
        initSlideFromTemplate(offscreenCanvas, template, slideData, currentSlideIndex + 1);
        newPreviews[template.id] = offscreenCanvas.toDataURL();
      });

      setPreviews(newPreviews);
      offscreenCanvas.dispose();
    };

    generatePreviews();
  }, [slideData, currentSlideIndex]);

  if (mode === "compact") {
    return (
      <div className="flex flex-col gap-4 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#4E576A]">
          Plantillas
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.values(templates).map((template) => (
            <button
              key={template.id}
              onClick={() => {
                if (confirm("Esto reemplazará los cambios actuales en este slide. ¿Continuar?")) {
                  onSelect(template, false);
                }
              }}
              className="group relative flex flex-col gap-2 transition-all hover:translate-y-[-2px]">
              <div className="relative aspect-square overflow-hidden rounded-lg border border-[#212631] bg-[#101417] transition-all group-hover:border-[#E0E5EB]">
                {previews[template.id] ? (
                  <img
                    src={previews[template.id]}
                    alt={template.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="h-full w-full"
                    style={{ background: template.thumbnail }}
                  />
                )}
                {suggestedTemplateId === template.id && (
                  <div className="absolute top-2 right-2 rounded-full bg-[#462D6E] p-1 shadow-lg">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <span className="text-center text-[10px] font-medium text-[#E0E5EB]">
                {template.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 text-center md:text-left">
        <h2 className="text-2xl font-bold text-[#E0E5EB]">
          Elige un punto de partida
        </h2>
        <p className="text-sm text-[#4E576A]">
          Puedes modificar todo después en el editor.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Object.values(templates).map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template, applyToAll)}
            className={cn(
              "group relative flex flex-col gap-3 rounded-xl border border-[#212631] bg-[#101417]/50 p-3 transition-all hover:border-[#E0E5EB] hover:bg-[#101417]",
              suggestedTemplateId === template.id && "border-[#462D6E]/50 ring-1 ring-[#462D6E]/30",
            )}>
            <div className="relative aspect-square overflow-hidden rounded-lg bg-[#0A0D0F]">
              {previews[template.id] ? (
                <img
                  src={previews[template.id]}
                  alt={template.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="h-full w-full"
                  style={{ background: template.thumbnail }}
                />
              )}
              {suggestedTemplateId === template.id && (
                <div className="absolute top-0 right-0 rounded-bl-lg bg-[#462D6E] px-2 py-1 flex items-center gap-1">
                  <span className="text-[10px] font-bold text-white uppercase tracking-tighter">AI Suggest</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1 text-left">
              <span className="text-xs font-semibold text-[#E0E5EB]">
                {template.name}
              </span>
              <span className="text-[11px] leading-tight text-[#4E576A]">
                {template.description}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 border-t border-[#212631] pt-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
             <button
              onClick={() => onSelect(null, applyToAll)}
              className="flex items-center gap-2 text-xs font-medium text-[#4E576A] transition-colors hover:text-[#E0E5EB]">
              <Layout className="h-4 w-4" />
              Empezar desde cero
            </button>
            <button
              onClick={onKeepCurrent}
              className="flex items-center gap-2 text-xs font-medium text-[#4E576A] transition-colors hover:text-[#E0E5EB]">
              <RotateCcw className="h-4 w-4" />
              Usar diseño actual
            </button>
          </div>

          <label className="flex cursor-pointer items-center gap-2">
            <div className="relative">
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-5 w-9 rounded-full bg-[#212631] transition-colors peer-checked:bg-[#462D6E]" />
              <div className="absolute left-1 top-1 h-3 w-3 rounded-full bg-white transition-all peer-checked:left-5" />
            </div>
            <span className="text-xs text-[#E0E5EB]">
              Aplicar a todos los slides
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
