"use client";

import { useEffect, useState } from "react";
import { Check, Layout, RotateCcw } from "lucide-react";
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
    let cancelled = false;

    async function generatePreviews() {
      const NATIVE_SIZE = 1080;
      const OUTPUT_SIZE = 320;
      const multiplier = OUTPUT_SIZE / NATIVE_SIZE;

      const newPreviews: Record<string, string> = {};

      const canvasElement = document.createElement("canvas");
      canvasElement.width = NATIVE_SIZE;
      canvasElement.height = NATIVE_SIZE;

      const offscreenCanvas = new StaticCanvas(canvasElement, {
        width: NATIVE_SIZE,
        height: NATIVE_SIZE,
        renderOnAddRemove: false,
        enableRetinaScaling: false,
      });

      for (const template of Object.values(templates)) {
        if (cancelled) break;

        initSlideFromTemplate(
          offscreenCanvas,
          template,
          slideData,
          currentSlideIndex + 1,
          true
        );

        offscreenCanvas.setWidth(NATIVE_SIZE);
        offscreenCanvas.setHeight(NATIVE_SIZE);
        offscreenCanvas.renderAll();

        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

        newPreviews[template.id] = offscreenCanvas.toDataURL({
          format: "jpeg",
          quality: 0.88,
          multiplier,
        });

        offscreenCanvas.clear();
      }

      if (!cancelled) {
        setPreviews(newPreviews);
      }

      offscreenCanvas.dispose();
    }

    void generatePreviews();

    return () => {
      cancelled = true;
    };
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
      <div className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_top_left,_rgba(100,122,255,0.18),_transparent_38%),linear-gradient(180deg,_rgba(255,255,255,0.03),_rgba(255,255,255,0.01))] px-6 py-7">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.02)_100%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#7C86A1]">
              Template Gallery
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#F5F7FB] sm:text-4xl">
              Elige un diseño con vista previa real
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#8D95A6] sm:text-[15px]">
              Explora cada plantilla como una portada terminada. La idea es que puedas
              decidir por estética, no a ciegas, y entrar al editor con una base clara.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#667089]">
                Slide actual
              </p>
              <p className="mt-1 text-lg font-semibold text-[#F5F7FB]">
                {String(currentSlideIndex + 1).padStart(2, "0")}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#667089]">
                Templates
              </p>
              <p className="mt-1 text-lg font-semibold text-[#F5F7FB]">
                {Object.keys(templates).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Object.values(templates).map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template, applyToAll)}
            className={cn(
              "group relative flex flex-col overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-4 text-left transition-all duration-300 hover:-translate-y-1.5 hover:border-white/20 hover:shadow-[0_24px_80px_rgba(0,0,0,0.35)]",
              suggestedTemplateId === template.id && "border-[#6C4CE4]/50 shadow-[0_18px_60px_rgba(70,45,110,0.28)]",
            )}>
            <div
              className="relative w-full overflow-hidden rounded-[22px] border border-white/8 bg-[#0A0D0F] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
              style={{ aspectRatio: "1 / 1" }}>
              <div className="absolute inset-0 z-10 bg-[linear-gradient(180deg,transparent_0%,transparent_72%,rgba(5,8,12,0.72)_100%)] opacity-60 transition-opacity duration-300 group-hover:opacity-80" />
              {previews[template.id] ? (
                <img
                  src={previews[template.id]}
                  alt={template.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                />
              ) : (
                <div
                  className="h-full w-full animate-pulse"
                  style={{ background: template.thumbnail }}
                />
              )}
              {suggestedTemplateId === template.id && (
                <div className="absolute left-4 top-4 z-20 rounded-full border border-white/10 bg-[#462D6E]/95 px-3 py-1.5 shadow-lg backdrop-blur-md">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                    Sugerido
                  </span>
                </div>
              )}
              <div className="absolute bottom-3 left-3 right-3 z-20 flex items-end justify-end gap-2">
                <div className="shrink-0 rounded-full border border-white/20 bg-white shadow-xl px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-black opacity-0 transition-all duration-300 group-hover:opacity-100">
                  Seleccionar
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 px-1 pb-1 pt-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-lg font-semibold tracking-tight text-[#F1F4FA]">
                    {template.name}
                  </span>
                  <p className="mt-1 text-[13px] leading-5 text-[#7E879D]">
                    {template.description}
                  </p>
                </div>
                {suggestedTemplateId === template.id ? (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#462D6E]/20 text-[#CDB9FF]">
                    <Check className="h-4 w-4" />
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between border-t border-white/6 pt-3">
                <span className="text-[11px] uppercase tracking-[0.18em] text-[#5E687E]">
                  Instagram Post
                </span>
                <span className="text-sm font-medium text-[#E7EBF3] transition-transform duration-300 group-hover:translate-x-1">
                  Usar plantilla
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 border-t border-white/6 pt-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => onSelect(null, applyToAll)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-2.5 text-sm font-medium text-[#8D95A6] transition-colors hover:border-white/16 hover:text-[#E0E5EB]">
              <Layout className="h-4 w-4" />
              Empezar desde cero
            </button>
            <button
              onClick={() => {
                if (suggestedTemplateId && templates[suggestedTemplateId]) {
                  onSelect(templates[suggestedTemplateId], applyToAll);
                } else if (onKeepCurrent) {
                  onKeepCurrent();
                }
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-2.5 text-sm font-medium text-[#8D95A6] transition-colors hover:border-white/16 hover:text-[#E0E5EB]">
              <RotateCcw className="h-4 w-4" />
              Usar diseño actual
            </button>
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[#E0E5EB]">
                Aplicar a todos los slides
              </p>
              <p className="text-[11px] text-[#667089]">
                Usa esta misma dirección visual en todo el carrusel
              </p>
            </div>
            <div className="relative shrink-0">
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-[#212631] transition-colors peer-checked:bg-[#5A3BB7]" />
              <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-all peer-checked:left-6" />
            </div>
          </label>
        </div>

        <p className="text-center text-[12px] leading-5 text-[#667089]">
          También puedes acceder al editor desde Plantillas en el menú principal.
        </p>
      </div>
    </div>
  );
}
