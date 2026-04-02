"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  FabricObject,
  Textbox,
  Shadow,
  Gradient,
  Canvas,
  type GradientOptions,
} from "fabric";
import {
  ChevronDown,
  Search,
  Bookmark,
  Upload,
  Type,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Baseline,
  Palette,
  RefreshCw,
  Loader2,
  Minimize2,
  Maximize2
} from "lucide-react";
import { 
  TYPE_SCALE_RATIOS, 
  generateTypeScale, 
  applyTypeScaleToCanvas, 
  type TypeScale, 
  type TypeScaleRatioKey 
} from "@/lib/typography/type-scale";
import { ColorPicker } from "@/components/editor/color-picker";
import {
  ensureEditorFontLoaded,
  findEditorFontByFamily,
  findEditorFontById,
  EDITOR_FONT_OPTIONS,
  type EditorFontOption,
} from "@/lib/editor-fonts";
import {
  saveGradient,
} from "@/lib/editor-preferences";
import {
  normalizeGradientConfig,
  gradientConfigToCss,
  BRAND_GRADIENT_SUGGESTIONS,
  type CarouselGradientConfig,
} from "@/lib/carousel-backgrounds";
import { 
  type CarouselEditorBackground,
  type CarouselEditorSlide,
} from "@/lib/instagram-carousel-editor";
import { 
  type TextStyle, 
  DEFAULT_TEXT_STYLES, 
  getTextStyles, 
  applyTextStyle,
  deleteTextStyle
} from "@/lib/editor/text-styles";
import { SaveTextStyleDialog } from "./save-style-dialog";
import { cn } from "@/lib/utils";

// --- Helper Components ---

function PropertySection({ children, title, defaultExpanded = true, id }: { children: React.ReactNode; title: string, defaultExpanded?: boolean, id?: string }) {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window !== 'undefined' && id) {
      const saved = window.localStorage.getItem(`noctra:editor:section:${id}`);
      if (saved !== null) return saved === 'true';
    }
    return defaultExpanded;
  });

  const toggle = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    if (id) {
      window.localStorage.setItem(`noctra:editor:section:${id}`, String(next));
    }
  };

  return (
    <section className="space-y-3 rounded-2xl border border-white/6 bg-[#0F1317] p-3">
      <button 
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between text-[11px] font-medium uppercase tracking-[0.18em] text-[#4E576A] hover:text-[#8D95A6]"
      >
        <span>{title}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform", !isExpanded && "-rotate-90")} />
      </button>
      {isExpanded && <div className="space-y-3 pt-1">{children}</div>}
    </section>
  );
}

function PropertyButton({
  active = false,
  children,
  onClick,
  className,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3 py-2 text-xs transition-colors",
        active
          ? "border-[#4E576A] bg-[#212631] text-[#E0E5EB]"
          : "border-white/8 text-[#8D95A6] hover:border-[#4E576A] hover:text-[#E0E5EB]",
        className
      )}
    >
      {children}
    </button>
  );
}

function AngleWheel({
  onChange,
  value,
}: {
  onChange: (nextAngle: number) => void;
  value: number;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const safeValue = ((value % 360) + 360) % 360;
  const radians = ((safeValue - 90) * Math.PI) / 180;
  const handleX = 50 + Math.cos(radians) * 34;
  const handleY = 50 + Math.sin(radians) * 34;

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = (Math.atan2(clientY - centerY, clientX - centerX) * 180) / Math.PI;
      onChange(Math.round((angle + 90 + 360) % 360));
    },
    [onChange]
  );

  const startDrag = (event: React.PointerEvent<SVGSVGElement>) => {
    updateFromPointer(event.clientX, event.clientY);
    const handleMove = (moveEvent: PointerEvent) => updateFromPointer(moveEvent.clientX, moveEvent.clientY);
    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      className="h-24 w-24 cursor-crosshair"
      onPointerDown={startDrag}
    >
      <circle cx="50" cy="50" r="34" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.12)" />
      <line x1="50" y1="50" x2={handleX} y2={handleY} stroke="#E0E5EB" strokeWidth="3" strokeLinecap="round" />
      <circle cx={handleX} cy={handleY} r="6" fill="#101417" stroke="#E0E5EB" strokeWidth="2" />
    </svg>
  );
}

function FontFamilyPicker({
  onChange,
  recentFontIds,
  value,
}: {
  onChange: (fontFamily: string, fontId: string) => void;
  recentFontIds: string[];
  value: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const activeOption = findEditorFontByFamily(value);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  const visibleOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return EDITOR_FONT_OPTIONS.filter((option) =>
      normalizedQuery ? option.label.toLowerCase().includes(normalizedQuery) : true
    );
  }, [query]);

  const recentOptions = recentFontIds
    .map((fontId) => findEditorFontById(fontId))
    .filter((option): option is EditorFontOption => option !== null)
    .filter((option) => visibleOptions.some((visible) => visible.id === option.id));

  const groupedOptions = visibleOptions.reduce<Record<string, EditorFontOption[]>>((result, option) => {
    const existing = result[option.category] ?? [];
    result[option.category] = [...existing, option];
    return result;
  }, {});

  return (
    <div ref={containerRef} className="relative space-y-1 text-xs text-[#8D95A6]">
      <span>Familia</span>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-xl border border-white/8 bg-[#14171C] px-3 py-2 text-sm text-[#E0E5EB]"
      >
        <span style={{ fontFamily: activeOption?.previewFamily ?? value }}>{activeOption?.label ?? value}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-full rounded-2xl border border-white/10 bg-[#0F1317] p-3 shadow-[0_16px_50px_rgba(0,0,0,0.45)]">
          <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-[#14171C] px-3 py-2">
            <Search className="h-4 w-4 text-[#4E576A]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar tipografía..."
              className="w-full bg-transparent text-sm text-[#E0E5EB] placeholder:text-[#4E576A] focus:outline-none"
            />
          </div>
          <div className="mt-3 max-h-72 space-y-3 overflow-y-auto pr-1">
            {recentOptions.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#4E576A]">Recientes</p>
                <div className="space-y-1">
                  {recentOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        void ensureEditorFontLoaded(option).then(() => onChange(option.family, option.id));
                        setIsOpen(false);
                      }}
                      className="w-full rounded-xl border border-white/6 px-3 py-2 text-left text-sm text-[#E0E5EB] transition-colors hover:border-[#4E576A] hover:bg-white/[0.03]"
                      style={{ fontFamily: option.previewFamily }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {Object.entries(groupedOptions).map(([category, options]) => (
              <div key={category} className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#4E576A]">{category}</p>
                <div className="space-y-1">
                  {options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        void ensureEditorFontLoaded(option).then(() => onChange(option.family, option.id));
                        setIsOpen(false);
                      }}
                      className="w-full rounded-xl border border-white/6 px-3 py-2 text-left text-sm text-[#E0E5EB] transition-colors hover:border-[#4E576A] hover:bg-white/[0.03]"
                      style={{ fontFamily: option.previewFamily }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Effects Logic Helpers ---

function applyGradientToText(
  obj: Textbox,
  color1: string,
  color2: string,
  angle: number
): void {
  const rad = (angle * Math.PI) / 180;
  const x1 = 0.5 - Math.cos(rad) * 0.5;
  const y1 = 0.5 - Math.sin(rad) * 0.5;
  const x2 = 0.5 + Math.cos(rad) * 0.5;
  const y2 = 0.5 + Math.sin(rad) * 0.5;

  const gradient = new Gradient({
    type: "linear",
    gradientUnits: "percentage",
    coords: { x1, y1, x2, y2 },
    colorStops: [
      { offset: 0, color: color1 },
      { offset: 1, color: color2 },
    ],
  });

  obj.set("fill", gradient);
  (obj as any).set("data", {
    ...(obj as any).data,
    gradientFill: { color1, color2, angle }
  });
  obj.canvas?.renderAll();
}

// --- Main Component ---

interface PropertiesPanelProps {
  activeObject: FabricObject | null;
  activeBackground: CarouselEditorBackground | undefined;
  updateTextboxProperty: (props: any) => void;
  updateShapeProperty: (props: any) => void;
  updateSelectedObjectProperty: (props: any) => void;
  applyBackgroundUpdate: (updater: (bg: CarouselEditorBackground) => CarouselEditorBackground) => Promise<void>;
  layerActions: Array<{ label: string; onClick: () => void }>;
  gradientDraft: CarouselGradientConfig;
  setGradientDraft: React.Dispatch<React.SetStateAction<CarouselGradientConfig>>;
  handleDuplicateSlide: () => void;
  handleDeleteSlide: () => void;
  recentFontIds: string[];
  onOpenImages: () => void;
  handleBackgroundFile: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  savedGradients: CarouselGradientConfig[];
  setSavedGradients: (gradients: CarouselGradientConfig[]) => void;
  commitCanvasMutation: () => void;
  canvas?: Canvas | null;
}

export function PropertiesPanel({
  activeObject,
  activeBackground,
  updateTextboxProperty,
  updateShapeProperty,
  updateSelectedObjectProperty,
  applyBackgroundUpdate,
  layerActions,
  gradientDraft,
  setGradientDraft,
  handleDuplicateSlide,
  handleDeleteSlide,
  recentFontIds,
  onOpenImages,
  handleBackgroundFile,
  savedGradients,
  setSavedGradients,
  commitCanvasMutation,
  canvas
}: PropertiesPanelProps) {
  
  const isTextbox = (obj: any): obj is Textbox => obj instanceof Textbox || obj?.type === 'textbox' || obj?.type === 'itext';
  const isIcon = (obj: any) => obj?.data?.role === 'icon';

  const [savedStyles, setSavedStyles] = useState<TextStyle[]>([]);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  useEffect(() => {
    setSavedStyles(getTextStyles());
  }, []);

  const refreshStyles = () => {
    setSavedStyles(getTextStyles());
  };

  const allStyles = useMemo(() => {
    return [...DEFAULT_TEXT_STYLES, ...savedStyles];
  }, [savedStyles]);

  const handleDeleteStyle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("¿Eliminar este estilo guardado?")) {
      deleteTextStyle(id);
      refreshStyles();
    }
  };
  
  // --- Effects State ---
  const [effectsState, setEffectsState] = useState({
    shadow: {
      enabled: false,
      color: "rgba(0,0,0,0.5)",
      blur: 8,
      offsetX: 4,
      offsetY: 4,
    },
    stroke: {
      enabled: false,
      color: "#462D6E",
      width: 2,
      type: 'solid' as 'solid' | 'gradient',
      gradient: {
        enabled: false,
        color1: '#E0E5EB',
        color2: '#462D6E',
        angle: 45
      }
    },
    gradient: {
      enabled: false,
      color1: "#E0E5EB",
      color2: "#462D6E",
      angle: 45,
    },
    shape: {
      type: 'rect' as 'rect' | 'arc' | 'circle',
      arc: { radius: 300, startAngle: -90, endAngle: 90 }
    },
    background: {
      enabled: false,
      color: 'rgba(70, 45, 110, 0.2)',
      padding: 10,
      radius: 8
    }
  });

  // Sync internal UI state with selected object
  useEffect(() => {
    if (activeObject && isTextbox(activeObject)) {
      const shadow = activeObject.shadow as Shadow | undefined;
      const data = (activeObject as any).data || {};
      
      setEffectsState(prev => ({
        ...prev,
        shadow: {
          enabled: !!shadow,
          color: (shadow?.color as string) || "rgba(0,0,0,0.5)",
          blur: shadow?.blur || 8,
          offsetX: shadow?.offsetX || 4,
          offsetY: shadow?.offsetY || 4,
        },
        stroke: {
          enabled: (!!activeObject.stroke && activeObject.stroke !== 'transparent') || !!data.gradientStroke?.enabled,
          color: (activeObject.stroke as string) || "#462D6E",
          width: activeObject.strokeWidth || 2,
          type: data.gradientStroke?.enabled ? 'gradient' : 'solid',
          gradient: data.gradientStroke || { enabled: false, color1: '#E0E5EB', color2: '#462D6E', angle: 45 }
        },
        gradient: {
          enabled: activeObject.fill instanceof Gradient || !!data.gradientFill,
          color1: data.gradientFill?.color1 || "#E0E5EB",
          color2: data.gradientFill?.color2 || "#462D6E",
          angle: data.gradientFill?.angle || 45,
        },
        shape: {
          type: data.type === 'arc-text' ? (data.arcOptions?.type || 'arc') : 'rect',
          arc: data.arcOptions || { radius: 300, startAngle: -90, endAngle: 90 }
        },
        background: data.backgroundHighlight || { enabled: false, color: 'rgba(70, 45, 110, 0.2)', padding: 10, radius: 8 }
      }));
    }
  }, [activeObject]);
 
  // Typographic Scale State
  const canvasData = (canvas as any)?.data || {};
  const currentScale = canvasData.typeScale as TypeScale | undefined;
  const autoScale = canvasData.autoTypeScale ?? true;

  const handleScaleChange = (ratioKey: TypeScaleRatioKey) => {
    if (!canvas) return;
    const base = currentScale?.base || 36;
    const nextScale = generateTypeScale(base, ratioKey);
    
    // Update canvas data
    (canvas as any).data = { ...canvasData, typeScale: nextScale };
    
    // Apply to objects
    applyTypeScaleToCanvas(canvas, ratioKey, base);
    commitCanvasMutation();
  };

  const toggleAutoScale = () => {
    if (!canvas) return;
    (canvas as any).data = { ...canvasData, autoTypeScale: !autoScale };
    commitCanvasMutation();
  };

  const updateIconSize = (size: number) => {
    if (!activeObject) return;
    const currentWidth = activeObject.width || 1;
    const currentHeight = activeObject.height || 1;
    const scale = size / Math.max(currentWidth, currentHeight);
    
    activeObject.set({
      scaleX: scale,
      scaleY: scale
    });
    
    activeObject.canvas?.renderAll();
    commitCanvasMutation();
  };

  const handleShadowChange = (updates: Partial<typeof effectsState.shadow>) => {
    if (!activeObject || !isTextbox(activeObject)) return;
    const next = { ...effectsState.shadow, ...updates };
    setEffectsState(s => ({ ...s, shadow: next }));
    if (next.enabled) {
      activeObject.set("shadow", new Shadow({ color: next.color, blur: next.blur, offsetX: next.offsetX, offsetY: next.offsetY }));
    } else {
      activeObject.set("shadow", null);
    }
    activeObject.canvas?.renderAll();
    commitCanvasMutation();
  };

  const handleGradientChange = (updates: Partial<typeof effectsState.gradient>) => {
    if (!activeObject || !isTextbox(activeObject)) return;
    const next = { ...effectsState.gradient, ...updates };
    setEffectsState(s => ({ ...s, gradient: next }));
    if (next.enabled) {
      applyGradientToText(activeObject as Textbox, next.color1, next.color2, next.angle);
    } else {
      activeObject.set("fill", "#E0E5EB");
      (activeObject as any).set("data", { ...(activeObject as any).data, gradientFill: null });
    }
    activeObject.canvas?.renderAll();
    commitCanvasMutation();
  };

  const handleTextTransform = (mode: 'original' | 'upper' | 'lower' | 'cap') => {
    if (!activeObject || !isTextbox(activeObject)) return;
    const data = (activeObject as any).data || {};
    if (!data.originalText) data.originalText = (activeObject as Textbox).text;
    let nextText = data.originalText;
    if (mode === 'upper') nextText = nextText.toUpperCase();
    if (mode === 'lower') nextText = nextText.toLowerCase();
    if (mode === 'cap') nextText = nextText.replace(/\b\w/g, (c: string) => c.toUpperCase());
    activeObject.set({ text: nextText, data: { ...data, textTransform: mode } } as any);
    activeObject.canvas?.renderAll();
    commitCanvasMutation();
  };

  const getCharSpacingLabel = (val: number) => val === 0 ? "Normal" : val > 0 ? `+${val}` : `${val}`;

  return (
    <div className="flex flex-col gap-4">
      {activeObject && isTextbox(activeObject) ? (
        <div className="space-y-4">
          <div className="space-y-2 p-3 rounded-2xl border border-white/6 bg-[#0F1317]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#4E576A]">Estilos guardados</span>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
              {allStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => { applyTextStyle(activeObject as Textbox, style, activeObject.canvas!); commitCanvasMutation(); }}
                  className="group relative flex h-9 w-20 flex-shrink-0 flex-col items-center justify-center rounded-xl border border-white/8 bg-[#14171C] transition-all hover:border-[#4E576A] hover:bg-[#212631]"
                >
                   <span style={{ fontFamily: style.fontFamily, fontWeight: style.fontWeight, color: style.fill as string }} className="text-sm font-bold">Aa</span>
                </button>
              ))}
              <button
                onClick={() => setIsSaveDialogOpen(true)}
                className="flex h-9 w-20 flex-shrink-0 items-center justify-center rounded-xl border border-dashed border-white/10 bg-transparent text-[9px] font-bold text-[#4E576A] hover:border-[#4E576A] hover:text-[#E0E5EB]"
              > + </button>
            </div>
          </div>

          <PropertySection title="Tipografía" id="typography">
             <FontFamilyPicker
              value={activeObject.fontFamily ?? "Inter"}
              recentFontIds={recentFontIds}
              onChange={(family) => updateTextboxProperty({ fontFamily: family })}
            />
            <div className="space-y-1 text-xs text-[#8D95A6]">
              <div className="flex justify-between items-center"><span>Tamaño</span><span className="font-mono">{activeObject.fontSize}px</span></div>
              <input type="range" min={12} max={400} value={activeObject.fontSize} onChange={(e) => updateTextboxProperty({ fontSize: Number(e.target.value) })} className="w-full" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-[#4E576A] uppercase tracking-wider">Grosor</span>
                <select className="w-full rounded-xl border border-white/8 bg-[#14171C] px-2 py-1.5 text-xs text-[#E0E5EB] outline-none" value={String(activeObject.fontWeight ?? "400")} onChange={(e) => updateTextboxProperty({ fontWeight: e.target.value })}>
                  <option value="300">Book (300)</option><option value="400">Regular (400)</option><option value="500">Medium (500)</option><option value="700">Bold (700)</option><option value="900">Black (900)</option>
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-[#4E576A] uppercase tracking-wider">Alineación</span>
                <div className="flex gap-1 h-[32px]">
                  {(["left", "center", "right"] as const).map((align) => (
                    <button key={align} onClick={() => updateTextboxProperty({ textAlign: align })} className={cn("flex-1 flex items-center justify-center rounded-lg border transition-all", (activeObject.textAlign ?? "left") === align ? "border-[#4E576A] bg-[#212631] text-white" : "border-white/5 text-[#4E576A] hover:text-[#8D95A6]")}>
                      {align === 'left' && <AlignLeft size={14} />}
                      {align === 'center' && <AlignCenter size={14} />}
                      {align === 'right' && <AlignRight size={14} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </PropertySection>

          <PropertySection title="Espaciado" id="spacing" defaultExpanded={false}>
            <div className="space-y-4">
               {/* Icon Size Presets */}
               {isIcon(activeObject) && (
                <PropertySection title="Tamaño del ícono" id="icon-size">
                  <div className="flex flex-wrap gap-2">
                    {([
                      { label: 'XS', size: 40 },
                      { label: 'S', size: 60 },
                      { label: 'M', size: 80 },
                      { label: 'L', size: 120 },
                      { label: 'XL', size: 200 }
                    ] as const).map(preset => (
                      <button
                        key={preset.label}
                        onClick={() => updateIconSize(preset.size)}
                        className={cn(
                          "flex-1 rounded-xl border border-white/8 bg-[#14171C] py-2 text-[10px] font-bold text-[#8D95A6] transition-all hover:border-[#4E576A] hover:text-[#E0E5EB]",
                          Math.round(Math.max(activeObject.width! * activeObject.scaleX!, activeObject.height! * activeObject.scaleY!)) === preset.size && "border-[#4E576A] bg-[#212631] text-[#E0E5EB]"
                        )}
                      >
                        {preset.label} ({preset.size}px)
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-[#4E576A] uppercase tracking-wider">Ajuste fino</span>
                      <span className="font-mono text-[#8D95A6]">{Math.round(Math.max(activeObject.width! * activeObject.scaleX!, activeObject.height! * activeObject.scaleY!))}px</span>
                    </div>
                    <input 
                      type="range" 
                      min={20} 
                      max={400} 
                      value={Math.round(Math.max(activeObject.width! * activeObject.scaleX!, activeObject.height! * activeObject.scaleY!))} 
                      onChange={(e) => updateIconSize(Number(e.target.value))} 
                      className="w-full"
                    />
                  </div>
                </PropertySection>
              )}

              {isIcon(activeObject) && (
                <PropertySection title="Color del ícono" id="icon-color">
                   <ColorPicker label="Color" value={activeObject.fill as string || "#E0E5EB"} onChange={(hex) => { activeObject.set('fill', hex); activeObject.canvas?.renderAll(); commitCanvasMutation(); }} />
                   <p className="mt-2 text-[9px] text-[#4E576A]">
                    Tip: Los íconos se sincronizan con el color de acento automáticamente, pero puedes forzar uno manual aquí.
                   </p>
                </PropertySection>
              )}

              <label className="block space-y-1 text-xs text-[#8D95A6]"><div className="flex justify-between"><span>Interlineado</span><span className="font-mono">{Number(activeObject.lineHeight ?? 1.16).toFixed(2)}</span></div><input type="range" min={0.8} max={2.5} step={0.05} value={Number(activeObject.lineHeight ?? 1.16)} onChange={(e) => updateTextboxProperty({ lineHeight: Number(e.target.value) })} className="w-full" /></label>
              <label className="block space-y-1 text-xs text-[#8D95A6]"><div className="flex justify-between"><span>Espaciado letras</span><span className="font-mono">{activeObject.charSpacing ?? 0}</span></div><input type="range" min={-200} max={500} value={activeObject.charSpacing ?? 0} onChange={(e) => updateTextboxProperty({ charSpacing: Number(e.target.value) })} className="w-full" /></label>
            </div>
          </PropertySection>

          <PropertySection title="Color y Relleno" id="fill">
            <div className="space-y-4">
              <div className="flex gap-2 p-1 rounded-xl bg-black/20 border border-white/5">
                {['solid', 'gradient', 'outline'].map(type => (
                  <button key={type} onClick={() => {
                    if (type === 'outline') updateTextboxProperty({ fill: 'transparent', stroke: '#E0E5EB', strokeWidth: 2, paintFirst: 'stroke' });
                    else updateTextboxProperty({ fill: '#E0E5EB', stroke: 'transparent', strokeWidth: 0 });
                  }} className={cn("flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all", (activeObject.fill === 'transparent' && type === 'outline') || (activeObject.fill !== 'transparent' && type !== 'outline') ? "bg-[#212631] text-white" : "text-[#4E576A]")}>{type === 'solid' ? 'Sólido' : type === 'gradient' ? 'Gradiente' : 'Contorno'}</button>
                ))}
              </div>
              {activeObject.fill !== 'transparent' && <ColorPicker label="Color Principal" value={String(activeObject.fill ?? "#E0E5EB").slice(0, 7)} onChange={(hex) => updateTextboxProperty({ fill: hex })} />}
              {activeObject.fill === 'transparent' && <ColorPicker label="Color Contorno" value={String(activeObject.stroke ?? "#E0E5EB").slice(0, 7)} onChange={(hex) => updateTextboxProperty({ stroke: hex })} />}
            </div>
          </PropertySection>

          <PropertySection title="Efectos" id="effects" defaultExpanded={false}>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer"><span className="text-xs text-[#E0E5EB]">Sombra</span><div className={cn("relative h-5 w-9 rounded-full transition-colors", effectsState.shadow.enabled ? "bg-[#E0E5EB]" : "bg-[#212631]")} onClick={() => handleShadowChange({ enabled: !effectsState.shadow.enabled })}><div className={cn("absolute top-1 h-3 w-3 rounded-full bg-[#101417] transition-all", effectsState.shadow.enabled ? "left-5" : "left-1")} /></div></label>
              {effectsState.shadow.enabled && (
                <div className="space-y-3 pl-2 border-l border-white/5 mx-1">
                  <ColorPicker label="Color" value={effectsState.shadow.color} onChange={(hex) => handleShadowChange({ color: hex })} />
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block space-y-1 text-[10px] text-[#4E576A]"><span>Brad: {effectsState.shadow.blur}px</span><input type="range" min={0} max={40} value={effectsState.shadow.blur} onChange={(e) => handleShadowChange({ blur: Number(e.target.value) })} className="w-full h-1" /></label>
                    <label className="block space-y-1 text-[10px] text-[#4E576A]"><span>Offset: {effectsState.shadow.offsetX}px</span><input type="range" min={-20} max={20} value={effectsState.shadow.offsetX} onChange={(e) => handleShadowChange({ offsetX: Number(e.target.value), offsetY: Number(e.target.value) })} className="w-full h-1" /></label>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-3 pt-3 border-t border-white/5">
              <label className="flex items-center justify-between cursor-pointer"><span className="text-xs text-[#E0E5EB]">Contorno</span><div className={cn("relative h-5 w-9 rounded-full transition-colors", effectsState.stroke.enabled ? "bg-[#E0E5EB]" : "bg-[#212631]")} onClick={() => {
                const enabled = !effectsState.stroke.enabled;
                if (enabled) updateTextboxProperty({ stroke: effectsState.stroke.color, strokeWidth: effectsState.stroke.width });
                else updateTextboxProperty({ stroke: 'transparent', strokeWidth: 0, gradientStroke: { enabled: false } });
              }}><div className={cn("absolute top-1 h-3 w-3 rounded-full bg-[#101417] transition-all", effectsState.stroke.enabled ? "left-5" : "left-1")} /></div></label>
              {effectsState.stroke.enabled && (
                <div className="space-y-3 pl-2 border-l border-white/5 mx-1">
                  <div className="flex gap-2 p-1 rounded-lg bg-black/20 border border-white/5">
                    {['solid', 'gradient'].map(type => (
                      <button key={type} onClick={() => {
                        if (type === 'gradient') updateTextboxProperty({ gradientStroke: { ...effectsState.stroke.gradient, enabled: true } });
                        else updateTextboxProperty({ gradientStroke: { enabled: false }, stroke: effectsState.stroke.color });
                      }} className={cn("flex-1 py-1 text-[9px] font-bold rounded-md transition-all", effectsState.stroke.type === type ? "bg-[#212631] text-white" : "text-[#4E576A]")}>{type === 'solid' ? 'Sólido' : 'Gradiente'}</button>
                    ))}
                  </div>
                  {effectsState.stroke.type === 'solid' ? (<ColorPicker label="Color" value={effectsState.stroke.color} onChange={(hex) => updateTextboxProperty({ stroke: hex })} />) : (
                    <div className="space-y-2"><div className="grid grid-cols-2 gap-2"><ColorPicker label="C1" value={effectsState.stroke.gradient.color1} onChange={(c) => updateTextboxProperty({ gradientStroke: { ...effectsState.stroke.gradient, color1: c, enabled: true } })} /><ColorPicker label="C2" value={effectsState.stroke.gradient.color2} onChange={(c) => updateTextboxProperty({ gradientStroke: { ...effectsState.stroke.gradient, color2: c, enabled: true } })} /></div><input type="range" min={0} max={360} value={effectsState.stroke.gradient.angle} onChange={(e) => updateTextboxProperty({ gradientStroke: { ...effectsState.stroke.gradient, angle: Number(e.target.value), enabled: true } })} className="w-full h-1" /></div>
                  )}
                  <input type="range" min={1} max={30} value={effectsState.stroke.width} onChange={(e) => updateTextboxProperty({ strokeWidth: Number(e.target.value) })} className="w-full h-1" />
                </div>
              )}
            </div>
            <div className="space-y-3 pt-3 border-t border-white/5">
              <span className="text-[10px] text-[#4E576A] uppercase tracking-wider">Forma</span>
              <div className="flex gap-2">{[{ id: 'rect', label: 'Recto' }, { id: 'arc', label: 'Arco' }, { id: 'circle', label: 'Círculo' }].map(shape => (<button key={shape.id} onClick={() => updateTextboxProperty({ pathText: { type: shape.id, enabled: shape.id !== 'rect' } })} className={cn("flex-1 py-1.5 text-[10px] font-bold rounded-xl border transition-all", effectsState.shape.type === shape.id ? "border-[#4E576A] bg-[#212631] text-white" : "border-white/5 text-[#4E576A] hover:text-[#8D95A6]")}>{shape.label}</button>))}</div>
            </div>
          </PropertySection>

          <PropertySection title="Fondo de Texto" id="background" defaultExpanded={false}>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer"><span className="text-xs text-[#E0E5EB]">Highlight</span><div className={cn("relative h-5 w-9 rounded-full transition-colors", effectsState.background.enabled ? "bg-[#E0E5EB]" : "bg-[#212631]")} onClick={() => updateTextboxProperty({ backgroundHighlight: { enabled: !effectsState.background.enabled } })}><div className={cn("absolute top-1 h-3 w-3 rounded-full bg-[#101417] transition-all", effectsState.background.enabled ? "left-5" : "left-1")} /></div></label>
              {effectsState.background.enabled && (
                <div className="space-y-3 pl-2 border-l border-white/5 mx-1">
                  <ColorPicker label="Color" value={effectsState.background.color} onChange={(c) => updateTextboxProperty({ backgroundHighlight: { color: c } })} />
                  <div className="grid grid-cols-2 gap-2"><label className="block space-y-1 text-[10px] text-[#4E576A]"><span>Padding</span><input type="range" min={0} max={50} value={effectsState.background.padding} onChange={(e) => updateTextboxProperty({ backgroundHighlight: { padding: Number(e.target.value) } })} className="w-full h-1" /></label><label className="block space-y-1 text-[10px] text-[#4E576A]"><span>Radio</span><input type="range" min={0} max={30} value={effectsState.background.radius} onChange={(e) => updateTextboxProperty({ backgroundHighlight: { radius: Number(e.target.value) } })} className="w-full h-1" /></label></div>
                </div>
              )}
            </div>
          </PropertySection>
        </div>
      ) : activeObject && !isTextbox(activeObject) && activeObject.type !== 'image' ? (
        <PropertySection title="Forma" id="shape">
          <ColorPicker label="Llenado" value={String(activeObject.fill ?? "#212631").slice(0, 7)} onChange={(hex) => updateShapeProperty({ fill: hex })} />
          <ColorPicker label="Contorno" value={String(activeObject.stroke ?? "#4E576A").slice(0, 7)} onChange={(hex) => updateShapeProperty({ stroke: hex })} />
          <label className="block space-y-1 text-xs text-[#8D95A6]"><span>Opacidad</span><input type="range" min={0} max={1} step={0.01} value={Number(activeObject.opacity ?? 1)} onChange={(e) => updateShapeProperty({ opacity: Number(e.target.value) })} className="w-full" /></label>
        </PropertySection>
      ) : activeObject && activeObject.type === 'image' ? (
        <PropertySection title="Imagen" id="image">
          <label className="block space-y-1 text-xs text-[#8D95A6]"><span>Opacidad</span><input type="range" min={0} max={1} step={0.01} value={Number(activeObject.opacity ?? 1)} onChange={(e) => updateSelectedObjectProperty({ opacity: Number(e.target.value) })} className="w-full" /></label>
          <div className="flex flex-col gap-2 pt-2"><PropertyButton onClick={() => layerActions[0]?.onClick()}>Ajustar a canvas</PropertyButton><PropertyButton onClick={() => layerActions[1]?.onClick()}>Enviar al fondo</PropertyButton></div>
        </PropertySection>
      ) : (
        <>
          <PropertySection title="Fondo del slide" id="background">
             <div className="flex gap-2">{(["solid", "gradient", "image"] as const).map((type) => (<PropertyButton key={type} active={activeBackground?.type === type} onClick={() => { if (type === "gradient") setGradientDraft(normalizeGradientConfig(activeBackground?.gradientConfig ?? BRAND_GRADIENT_SUGGESTIONS[0]?.config)); void applyBackgroundUpdate((bg) => ({ ...bg, type })); }} className="flex-1">{type === "solid" ? "Sólido" : type === "gradient" ? "Gradiente" : "Imagen"}</PropertyButton>))}</div>
            {activeBackground?.type === "solid" && <ColorPicker label="Color sólido" value={activeBackground.solidColor ?? "#101417"} onChange={(hex) => applyBackgroundUpdate(bg => ({ ...bg, solidColor: hex }))} />}
            {activeBackground?.type === "gradient" && (
              <div className="space-y-3">
                <div className="flex gap-2">{(["linear", "radial"] as const).map(t => (<PropertyButton key={t} active={gradientDraft.type === t} onClick={() => setGradientDraft(c => normalizeGradientConfig({ ...c, type: t }))} className="flex-1">{t}</PropertyButton>))}</div>
                <div className="grid grid-cols-2 gap-2"><ColorPicker label="C1" value={gradientDraft.stops[0]} onChange={(h) => setGradientDraft(c => ({ ...c, stops: [h, c.stops[1]] }))} /><ColorPicker label="C2" value={gradientDraft.stops[1]} onChange={(h) => setGradientDraft(c => ({ ...c, stops: [c.stops[0], h] }))} /></div>
                <div className="flex gap-2"><PropertyButton onClick={() => setSavedGradients(saveGradient(gradientDraft))} className="w-9"><Bookmark size={14} /></PropertyButton><button onClick={() => applyBackgroundUpdate(bg => ({ ...bg, gradientConfig: gradientDraft, type: 'gradient' }))} className="flex-1 rounded-xl bg-[#E0E5EB] py-2 text-sm font-medium text-[#101417]">Aplicar</button></div>
              </div>
            )}
            {activeBackground?.type === "image" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2"><label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/8 bg-[#14171C] py-2 text-xs text-[#E0E5EB]"><Upload size={12} />Subir<input type="file" className="hidden" onChange={handleBackgroundFile} /></label><PropertyButton onClick={onOpenImages}>Unsplash</PropertyButton></div>
                <input type="range" min={0} max={0.8} step={0.01} value={activeBackground.overlayOpacity ?? 0.55} onChange={(e) => applyBackgroundUpdate(bg => ({ ...bg, overlayOpacity: Number(e.target.value) }))} className="w-full" />
              </div>
            )}
          </PropertySection>

          <PropertySection title="Escala tipográfica" id="type-scale">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-[#E0E5EB]">
                    Base: {currentScale?.base || 36}px
                  </p>
                  <p className="text-[9px] text-[#4E576A]">
                    Ratio: {currentScale?.ratio.toFixed(3) || '1.200'}
                  </p>
                </div>
                <button 
                  onClick={toggleAutoScale}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2 py-1 text-[9px] font-bold transition-all",
                    autoScale ? "bg-green-500/10 text-green-500" : "bg-white/5 text-[#4E576A]"
                  )}
                >
                  <RefreshCw className={cn("h-3 w-3", autoScale && "animate-spin-slow")} />
                  {autoScale ? 'AUTO' : 'MANUAL'}
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {([
                  { id: 'major_second', label: 'Compacto' },
                  { id: 'minor_third', label: 'Equilibrado' },
                  { id: 'major_third', label: 'Editorial' },
                  { id: 'perfect_fourth', label: 'Dramático' },
                  { id: 'perfect_fifth', label: 'Bold' },
                  { id: 'golden_ratio', label: 'Máximo' }
                ] as { id: TypeScaleRatioKey; label: string }[]).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleScaleChange(preset.id)}
                    className={cn(
                      "rounded-lg border px-2 py-1 text-[10px] font-medium transition-all",
                      currentScale?.ratioKey === preset.id
                        ? "border-[#4E576A] bg-[#212631] text-[#E0E5EB]"
                        : "border-white/5 text-[#4E576A] hover:border-white/10 hover:text-[#8D95A6]"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Scale Visualization */}
              <div className="space-y-1 pt-2">
                {[5, 4, 3, 2, 1, 0, -1].map((step, i) => {
                  const items = ['display', 'headingLarge', 'heading', 'bodyLarge', 'body', 'caption'];
                  const label = ['Display', 'H1', 'H2', 'Sub', 'Body', 'Cap'][i] || '';
                  const size = Math.round((currentScale?.base || 36) * Math.pow(currentScale?.ratio || 1.2, step));
                  const maxWidth = 100;
                  const width = (size / 100) * maxWidth; // visual approximation
                  
                  return (
                    <div key={step} className="group flex items-center gap-3">
                      <span className="w-8 text-[8px] uppercase tracking-tighter text-[#4E576A] group-hover:text-[#8D95A6]">{label}</span>
                      <div className="relative h-1.5 flex-1 rounded-full bg-white/5 overflow-hidden">
                        <div 
                          className="h-full bg-[#4E576A] transition-all duration-500 group-hover:bg-[#8D95A6]" 
                          style={{ width: `${Math.min(width, 100)}%` }} 
                        />
                      </div>
                      <span className="w-6 text-[8px] font-mono text-[#4E576A] text-right">{size}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </PropertySection>

          <PropertySection title="Slide" id="slide-mgmt"><div className="grid grid-cols-2 gap-2"><PropertyButton onClick={handleDuplicateSlide}>Duplicar</PropertyButton><PropertyButton onClick={handleDeleteSlide}>Eliminar</PropertyButton></div></PropertySection>
        </>
      )}
      {activeObject && (<PropertySection title="Capas" id="layers" defaultExpanded={false}><div className="grid grid-cols-2 gap-2">{layerActions.map(a => (<PropertyButton key={a.label} onClick={a.onClick}>{a.label}</PropertyButton>))}</div></PropertySection>)}
      <SaveTextStyleDialog isOpen={isSaveDialogOpen} onClose={() => setIsSaveDialogOpen(false)} activeObject={activeObject as Textbox} onSave={refreshStyles} />
    </div>
  );
}
