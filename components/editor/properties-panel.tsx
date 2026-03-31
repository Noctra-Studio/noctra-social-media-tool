"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  FabricObject,
  Textbox,
  Shadow,
  Gradient,
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
} from "lucide-react";
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
  } as any);

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
  openUnsplashModal: (mode: any) => void;
  handleBackgroundFile: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  savedGradients: CarouselGradientConfig[];
  setSavedGradients: (gradients: CarouselGradientConfig[]) => void;
  commitCanvasMutation: () => void;
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
  openUnsplashModal,
  handleBackgroundFile,
  savedGradients,
  setSavedGradients,
  commitCanvasMutation,
}: PropertiesPanelProps) {
  
  const isTextbox = (obj: any): obj is Textbox => obj instanceof Textbox;

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
    },
    gradient: {
      enabled: false,
      color1: "#E0E5EB",
      color2: "#462D6E",
      angle: 45,
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
          enabled: !!activeObject.stroke && activeObject.stroke !== 'transparent',
          color: (activeObject.stroke as string) || "#462D6E",
          width: activeObject.strokeWidth || 2,
        },
        gradient: {
          enabled: activeObject.fill instanceof Gradient || !!data.gradientFill,
          color1: data.gradientFill?.color1 || "#E0E5EB",
          color2: data.gradientFill?.color2 || "#462D6E",
          angle: data.gradientFill?.angle || 45,
        }
      }));
    }
  }, [activeObject]);

  const handleShadowChange = (updates: Partial<typeof effectsState.shadow>) => {
    if (!activeObject || !isTextbox(activeObject)) return;
    
    const next = { ...effectsState.shadow, ...updates };
    setEffectsState(s => ({ ...s, shadow: next }));

    if (next.enabled) {
      activeObject.set("shadow", new Shadow({
        color: next.color,
        blur: next.blur,
        offsetX: next.offsetX,
        offsetY: next.offsetY,
      }));
    } else {
      activeObject.set("shadow", null);
    }
    activeObject.canvas?.renderAll();
    commitCanvasMutation();
  };

  const handleStrokeChange = (updates: Partial<typeof effectsState.stroke>) => {
    if (!activeObject || !isTextbox(activeObject)) return;
    
    const next = { ...effectsState.stroke, ...updates };
    setEffectsState(s => ({ ...s, stroke: next }));

    if (next.enabled) {
      activeObject.set({
        stroke: next.color,
        strokeWidth: next.width,
      });
    } else {
      activeObject.set({
        stroke: "transparent",
        strokeWidth: 0,
      });
    }
    activeObject.canvas?.renderAll();
    commitCanvasMutation();
  };

  const handleGradientChange = (updates: Partial<typeof effectsState.gradient>) => {
    if (!activeObject || !isTextbox(activeObject)) return;
    
    const next = { ...effectsState.gradient, ...updates };
    setEffectsState(s => ({ ...s, gradient: next }));

    if (next.enabled) {
      applyGradientToText(activeObject, next.color1, next.color2, next.angle);
    } else {
      // Revert to solid color if we have a record of it, or default
      const defaultColor = "#E0E5EB"; 
      activeObject.set("fill", defaultColor);
      (activeObject as any).set("data", { ...(activeObject as any).data, gradientFill: null });
    }
    activeObject.canvas?.renderAll();
    commitCanvasMutation();
  };

  const handleTextTransform = (mode: 'original' | 'upper' | 'lower' | 'cap') => {
    if (!activeObject || !isTextbox(activeObject)) return;
    
    // Store original if not already stored
    const data = (activeObject as any).data || {};
    if (!data.originalText) {
      data.originalText = activeObject.text;
    }
    
    let nextText = data.originalText;
    if (mode === 'upper') nextText = nextText.toUpperCase();
    if (mode === 'lower') nextText = nextText.toLowerCase();
    if (mode === 'cap') nextText = nextText.replace(/\b\w/g, (c: string) => c.toUpperCase());
    
    activeObject.set({
      text: nextText,
      data: { ...data, textTransform: mode } as any
    });
    activeObject.canvas?.renderAll();
    commitCanvasMutation();
  };

  const getCharSpacingLabel = (val: number) => {
    if (val === 0) return "Normal";
    return val > 0 ? `+${val}` : `${val}`;
  };

  return (
    <div className="flex flex-col gap-4">
      {activeObject && isTextbox(activeObject) ? (
        <PropertySection title="Texto" id="text">
          {/* Saved Styles Row */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#4E576A]">Estilos guardados</span>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar" style={{ scrollbarWidth: 'none' }}>
              {allStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => {
                    applyTextStyle(activeObject, style, activeObject.canvas!);
                    commitCanvasMutation();
                  }}
                  onContextMenu={(e) => {
                    if (style.id.startsWith('default-')) return;
                    e.preventDefault();
                    handleDeleteStyle(style.id, e as any);
                  }}
                  className="group relative flex h-9 w-20 flex-shrink-0 flex-col items-center justify-center rounded-xl border border-white/8 bg-[#14171C] transition-all hover:border-[#4E576A] hover:bg-[#212631]"
                >
                  <span 
                    style={{
                      fontFamily: style.fontFamily,
                      fontWeight: style.fontWeight,
                      color: style.gradientFill?.enabled ? 'transparent' : style.fill,
                      background: style.gradientFill?.enabled ? `linear-gradient(${90 - style.gradientFill.angle}deg, ${style.gradientFill.color1}, ${style.gradientFill.color2})` : 'none',
                      WebkitBackgroundClip: style.gradientFill?.enabled ? 'text' : 'none',
                    }}
                    className="text-sm font-bold"
                  >
                    Aa
                  </span>
                  <span className="absolute -bottom-5 left-0 right-0 truncate text-center text-[9px] text-[#4E576A] opacity-0 transition-opacity group-hover:opacity-100">
                    {style.name}
                  </span>
                </button>
              ))}
              <button
                onClick={() => setIsSaveDialogOpen(true)}
                className="flex h-9 w-20 flex-shrink-0 items-center justify-center rounded-xl border border-dashed border-white/10 bg-transparent text-[9px] font-bold text-[#4E576A] transition-colors hover:border-[#4E576A] hover:text-[#E0E5EB]"
              >
                + Guardar
              </button>
            </div>
          </div>

          <FontFamilyPicker
            value={activeObject.fontFamily ?? "Inter"}
            recentFontIds={recentFontIds}
            onChange={(family, id) => updateTextboxProperty({ fontFamily: family })}
          />

          <div className="space-y-1 text-xs text-[#8D95A6]">
            <span>Tamaño {activeObject.fontSize}px</span>
            <div className="flex gap-2">
              <input
                type="range"
                min={12}
                max={400}
                value={activeObject.fontSize}
                onChange={(event) => updateTextboxProperty({ fontSize: Number(event.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-1 text-xs text-[#8D95A6]">
            <span>Grosor</span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Book", value: "300" },
                { label: "Medium", value: "500" },
                { label: "Bold", value: "700" },
              ].map((weight) => (
                <PropertyButton
                  key={weight.value}
                  active={String(activeObject.fontWeight ?? "400") === weight.value}
                  onClick={() => updateTextboxProperty({ fontWeight: weight.value })}
                >
                  {weight.label}
                </PropertyButton>
              ))}
            </div>
          </div>

          <div className="space-y-1 text-xs text-[#8D95A6]">
            <span>Estilo</span>
            <div className="flex gap-2">
              <PropertyButton 
                active={(activeObject.fontStyle ?? "normal") === "normal"} 
                onClick={() => updateTextboxProperty({ fontStyle: "normal" })}
                className="flex-1"
              >
                Normal
              </PropertyButton>
              <PropertyButton 
                active={activeObject.fontStyle === "italic"} 
                onClick={() => updateTextboxProperty({ fontStyle: "italic" })}
                className="flex-1"
              >
                <Italic className="h-3 w-3 inline mr-1" /> Italic
              </PropertyButton>
            </div>
          </div>

          {!effectsState.gradient.enabled && (
            <ColorPicker
              label="Color"
              value={String(activeObject.fill ?? "#E0E5EB").slice(0, 7)}
              onChange={(hex) => updateTextboxProperty({ fill: hex })}
            />
          )}

          <div className="space-y-1 text-xs text-[#8D95A6]">
            <span>Alineación</span>
            <div className="flex gap-2">
              {(["left", "center", "right"] as const).map((align) => (
                <PropertyButton 
                  key={align} 
                  active={(activeObject.textAlign ?? "left") === align} 
                  onClick={() => updateTextboxProperty({ textAlign: align })}
                  className="flex-1"
                >
                  {align === 'left' && <AlignLeft className="h-3 w-3" />}
                  {align === 'center' && <AlignCenter className="h-3 w-3" />}
                  {align === 'right' && <AlignRight className="h-3 w-3" />}
                </PropertyButton>
              ))}
            </div>
          </div>

          <label className="space-y-1 text-xs text-[#8D95A6]">
            <span>Interlineado {Number(activeObject.lineHeight ?? 1.16).toFixed(2)}</span>
            <input 
              type="range" 
              min={0.8} 
              max={2.5} 
              step={0.05} 
              value={Number(activeObject.lineHeight ?? 1.16)} 
              onChange={(event) => updateTextboxProperty({ lineHeight: Number(event.target.value) })} 
              className="w-full" 
            />
          </label>
        </PropertySection>
      ) : null}

      {activeObject && isTextbox(activeObject) ? (
        <PropertySection title="Efectos" id="effects" defaultExpanded={false}>
          {/* Live Preview Box */}
          <div className="mb-4 flex h-16 w-full items-center justify-center rounded-xl bg-[#101417] border border-white/5 overflow-hidden">
            <span 
              className="text-lg truncate max-w-[90%] pointer-events-none"
              style={{
                fontFamily: activeObject.fontFamily,
                fontWeight: activeObject.fontWeight,
                fontStyle: activeObject.fontStyle,
                color: effectsState.gradient.enabled ? 'transparent' : (activeObject.fill as string),
                background: effectsState.gradient.enabled ? `linear-gradient(${90 - effectsState.gradient.angle}deg, ${effectsState.gradient.color1}, ${effectsState.gradient.color2})` : 'none',
                WebkitBackgroundClip: effectsState.gradient.enabled ? 'text' : 'none',
                WebkitTextStroke: effectsState.stroke.enabled ? `${effectsState.stroke.width / 4}px ${effectsState.stroke.color}` : 'none',
                textShadow: effectsState.shadow.enabled ? `${effectsState.shadow.offsetX / 4}px ${effectsState.shadow.offsetY / 4}px ${effectsState.shadow.blur / 4}px ${effectsState.shadow.color}` : 'none',
              }}
            >
              {activeObject.text?.split('\n')[0] || "Preview"}
            </span>
          </div>

          {/* Shadow Effect */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-[#E0E5EB]">Sombra</span>
              <div 
                className={cn(
                  "relative h-5 w-9 rounded-full transition-colors",
                  effectsState.shadow.enabled ? "bg-[#E0E5EB]" : "bg-[#212631]"
                )}
                onClick={() => handleShadowChange({ enabled: !effectsState.shadow.enabled })}
              >
                <div className={cn(
                  "absolute top-1 h-3 w-3 rounded-full bg-[#101417] transition-all",
                  effectsState.shadow.enabled ? "left-5" : "left-1"
                )} />
              </div>
            </label>
            
            {effectsState.shadow.enabled && (
              <div className="space-y-3 pl-2 border-l border-white/5 animate-in fade-in slide-in-from-left-2 duration-200">
                <ColorPicker
                  label="Color Sombra"
                  value={effectsState.shadow.color}
                  onChange={(hex) => handleShadowChange({ color: hex })}
                />
                <label className="block space-y-1 text-[10px] text-[#8D95A6]">
                  <span>Difuminado: {effectsState.shadow.blur}px</span>
                  <input 
                    type="range" min={0} max={40} 
                    value={effectsState.shadow.blur} 
                    onChange={(e) => handleShadowChange({ blur: Number(e.target.value) })}
                    className="w-full h-1"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1 text-[10px] text-[#8D95A6]">
                    <span>Offset X: {effectsState.shadow.offsetX}</span>
                    <input 
                      type="range" min={-20} max={20} 
                      value={effectsState.shadow.offsetX} 
                      onChange={(e) => handleShadowChange({ offsetX: Number(e.target.value) })}
                      className="w-full h-1"
                    />
                  </label>
                  <label className="block space-y-1 text-[10px] text-[#8D95A6]">
                    <span>Offset Y: {effectsState.shadow.offsetY}</span>
                    <input 
                      type="range" min={-20} max={20} 
                      value={effectsState.shadow.offsetY} 
                      onChange={(e) => handleShadowChange({ offsetY: Number(e.target.value) })}
                      className="w-full h-1"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Stroke Effect */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-[#E0E5EB]">Contorno</span>
              <div 
                className={cn(
                  "relative h-5 w-9 rounded-full transition-colors",
                  effectsState.stroke.enabled ? "bg-[#E0E5EB]" : "bg-[#212631]"
                )}
                onClick={() => handleStrokeChange({ enabled: !effectsState.stroke.enabled })}
              >
                <div className={cn(
                  "absolute top-1 h-3 w-3 rounded-full bg-[#101417] transition-all",
                  effectsState.stroke.enabled ? "left-5" : "left-1"
                )} />
              </div>
            </label>
            
            {effectsState.stroke.enabled && (
              <div className="space-y-3 pl-2 border-l border-white/5 animate-in fade-in slide-in-from-left-2 duration-200">
                <ColorPicker
                  label="Color Contorno"
                  value={effectsState.stroke.color}
                  onChange={(hex) => handleStrokeChange({ color: hex })}
                />
                <label className="block space-y-1 text-[10px] text-[#8D95A6]">
                  <span>Grosor: {effectsState.stroke.width}px</span>
                  <input 
                    type="range" min={1} max={20} 
                    value={effectsState.stroke.width} 
                    onChange={(e) => handleStrokeChange({ width: Number(e.target.value) })}
                    className="w-full h-1"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Letter Spacing */}
          <div className="space-y-2 pt-2">
            <span className="text-[10px] uppercase tracking-wider text-[#4E576A]">Espaciado de letras</span>
            <div className="flex items-center gap-3">
              <input 
                type="range" min={-200} max={500} 
                value={activeObject.charSpacing ?? 0} 
                onChange={(e) => updateTextboxProperty({ charSpacing: Number(e.target.value) })}
                className="flex-1 h-1"
              />
              <span className="w-12 text-right text-[11px] font-mono text-[#E0E5EB]">
                {getCharSpacingLabel(activeObject.charSpacing ?? 0)}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[
                { label: "Tight", value: -80 },
                { label: "Normal", value: 0 },
                { label: "Wide", value: 150 },
                { label: "Extra", value: 400 },
              ].map(preset => (
                <button
                  key={preset.label}
                  onClick={() => updateTextboxProperty({ charSpacing: preset.value })}
                  className={cn(
                    "rounded-lg border py-1 text-[9px] transition-colors",
                    (activeObject.charSpacing ?? 0) === preset.value
                      ? "border-[#4E576A] bg-[#212631] text-[#E0E5EB]"
                      : "border-white/5 text-[#4E576A] hover:text-[#8D95A6]"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text Transform */}
          <div className="space-y-2 pt-2">
            <span className="text-[10px] uppercase tracking-wider text-[#4E576A]">Transformar texto</span>
            <div className="flex gap-2">
              {[
                { mode: 'original' as const, label: 'Aa' },
                { mode: 'upper' as const, label: 'AA' },
                { mode: 'lower' as const, label: 'aa' },
                { mode: 'cap' as const, label: 'Ab' },
              ].map(item => (
                <button
                  key={item.mode}
                  onClick={() => handleTextTransform(item.mode)}
                  className={cn(
                    "flex-1 h-9 rounded-xl border text-xs transition-colors",
                    ((activeObject as any).data?.textTransform || 'original') === item.mode
                      ? "border-[#4E576A] bg-[#212631] text-[#E0E5EB]"
                      : "border-white/8 text-[#8D95A6] hover:border-[#4E576A] hover:text-[#E0E5EB]"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Gradient Text Fill */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-[#E0E5EB]">Relleno gradiente</span>
              <div 
                className={cn(
                  "relative h-5 w-9 rounded-full transition-colors",
                  effectsState.gradient.enabled ? "bg-[#E0E5EB]" : "bg-[#212631]"
                )}
                onClick={() => handleGradientChange({ enabled: !effectsState.gradient.enabled })}
              >
                <div className={cn(
                  "absolute top-1 h-3 w-3 rounded-full bg-[#101417] transition-all",
                  effectsState.gradient.enabled ? "left-5" : "left-1"
                )} />
              </div>
            </label>
            
            {effectsState.gradient.enabled && (
              <div className="space-y-3 pl-2 border-l border-white/5 animate-in fade-in slide-in-from-left-2 duration-200">
                <div className="grid grid-cols-2 gap-2">
                  <ColorPicker
                    label="Color 1"
                    value={effectsState.gradient.color1}
                    onChange={(hex) => handleGradientChange({ color1: hex })}
                  />
                  <ColorPicker
                    label="Color 2"
                    value={effectsState.gradient.color2}
                    onChange={(hex) => handleGradientChange({ color2: hex })}
                  />
                </div>
                <div className="flex items-center gap-4 rounded-xl border border-white/8 bg-[#14171C] p-3">
                  <AngleWheel
                    value={effectsState.gradient.angle}
                    onChange={(nextAngle) => handleGradientChange({ angle: nextAngle })}
                  />
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] text-[#8D95A6]">Ángulo: {effectsState.gradient.angle}°</span>
                    <input 
                      type="range" min={0} max={360} 
                      value={effectsState.gradient.angle} 
                      onChange={(e) => handleGradientChange({ angle: Number(e.target.value) })}
                      className="w-full h-1"
                    />
                  </div>
                </div>
                <button 
                  onClick={() => handleGradientChange({ enabled: false })}
                  className="text-[10px] text-[#4E576A] underline underline-offset-2 hover:text-[#8D95A6]"
                >
                  Desactivar gradiente → Color sólido
                </button>
              </div>
            )}
          </div>
        </PropertySection>
      ) : null}

      {/* --- Shape Properties --- */}
      {activeObject && !isTextbox(activeObject) && activeObject.type !== 'image' ? (
        <PropertySection title="Forma" id="shape">
          <ColorPicker
            label="Fill"
            value={String(activeObject.fill ?? "#212631").slice(0, 7)}
            onChange={(hex) => updateShapeProperty({ fill: hex })}
          />
          <ColorPicker
            label="Stroke"
            value={String(activeObject.stroke ?? "#4E576A").slice(0, 7)}
            onChange={(hex) => updateShapeProperty({ stroke: hex })}
          />
          <label className="space-y-1 text-xs text-[#8D95A6]">
            <span>Stroke width</span>
            <input 
              type="number" min={0} max={20} 
              value={Number(activeObject.strokeWidth ?? 0)} 
              onChange={(event) => updateShapeProperty({ strokeWidth: Number(event.target.value) })} 
              className="w-full rounded-xl border border-white/8 bg-[#14171C] px-3 py-2 text-sm text-[#E0E5EB] focus:outline-none" 
            />
          </label>
          {activeObject.type === 'rect' && (
            <label className="space-y-1 text-xs text-[#8D95A6]">
              <span>Radio</span>
              <input 
                type="number" min={0} max={100} 
                value={Number((activeObject as any).rx ?? 0)} 
                onChange={(event) => updateShapeProperty({ rx: Number(event.target.value), ry: Number(event.target.value) })} 
                className="w-full rounded-xl border border-white/8 bg-[#14171C] px-3 py-2 text-sm text-[#E0E5EB] focus:outline-none" 
              />
            </label>
          )}
          <label className="space-y-1 text-xs text-[#8D95A6]">
            <span>Opacidad</span>
            <input 
              type="range" min={0} max={1} 
              step={0.01} 
              value={Number(activeObject.opacity ?? 1)} 
              onChange={(event) => updateShapeProperty({ opacity: Number(event.target.value) })} 
              className="w-full" 
            />
          </label>
        </PropertySection>
      ) : null}

      {/* --- Image Properties --- */}
      {activeObject && activeObject.type === 'image' ? (
        <PropertySection title="Imagen" id="image">
          <label className="space-y-1 text-xs text-[#8D95A6]">
            <span>Opacidad</span>
            <input 
              type="range" min={0} max={1} 
              step={0.01} 
              value={Number(activeObject.opacity ?? 1)} 
              onChange={(event) => updateSelectedObjectProperty({ opacity: Number(event.target.value) })} 
              className="w-full" 
            />
          </label>
          <div className="flex flex-col gap-2 pt-2">
            <PropertyButton onClick={() => layerActions[0]?.onClick()}>Ajustar a canvas</PropertyButton>
            <PropertyButton onClick={() => layerActions[1]?.onClick()}>Enviar al fondo</PropertyButton>
          </div>
        </PropertySection>
      ) : null}

      {/* --- Background Section --- */}
      {!activeObject && (
        <>
          <PropertySection title="Fondo del slide" id="background">
            <div className="flex gap-2">
              {(["solid", "gradient", "image"] as const).map((type) => (
                <PropertyButton
                  key={type}
                  active={activeBackground?.type === type}
                  onClick={() => {
                    if (type === "gradient") {
                      setGradientDraft(
                        normalizeGradientConfig(activeBackground?.gradientConfig ?? BRAND_GRADIENT_SUGGESTIONS[0]?.config)
                      );
                    }
                    void applyBackgroundUpdate((background) => {
                      if (type === "gradient") {
                        return {
                          ...background,
                          gradientConfig: normalizeGradientConfig(background.gradientConfig ?? BRAND_GRADIENT_SUGGESTIONS[0]?.config),
                          type,
                        };
                      }
                      if (type === "image") {
                        return { ...background, overlayOpacity: background.overlayOpacity ?? 0.55, type };
                      }
                      return { ...background, solidColor: background.solidColor ?? "#101417", type };
                    });
                  }}
                  className="flex-1"
                >
                  {type === "solid" ? "Sólido" : type === "gradient" ? "Gradiente" : "Imagen"}
                </PropertyButton>
              ))}
            </div>

            {activeBackground?.type === "solid" && (
              <ColorPicker
                label="Color sólido"
                value={activeBackground.solidColor ?? "#101417"}
                onChange={(hex) => applyBackgroundUpdate((background) => ({ ...background, solidColor: hex, type: "solid" }))}
              />
            )}

            {activeBackground?.type === "gradient" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {(["linear", "radial"] as const).map((gradientType) => (
                    <PropertyButton
                      key={gradientType}
                      active={gradientDraft.type === gradientType}
                      onClick={() => setGradientDraft((current) => normalizeGradientConfig({ ...current, type: gradientType }))}
                      className="flex-1"
                    >
                      {gradientType === "linear" ? "Linear" : "Radial"}
                    </PropertyButton>
                  ))}
                </div>
                
                {/* Presets */}
                <div className="grid grid-cols-3 gap-2">
                  {[...BRAND_GRADIENT_SUGGESTIONS.map(i => i.config), ...savedGradients.slice(0, 3)].map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => setGradientDraft(normalizeGradientConfig(preset))}
                      className="h-10 rounded-lg border border-white/5"
                      style={{ background: gradientConfigToCss(preset) }}
                    />
                  ))}
                </div>

                <div className="space-y-3">
                  <ColorPicker
                    label="Color 1"
                    value={gradientDraft.stops[0] ?? "#101417"}
                    onChange={(hex) => setGradientDraft(c => ({ ...c, stops: [hex, c.stops[1] || '#1C2028'] }))}
                  />
                  <ColorPicker
                    label="Color 2"
                    value={gradientDraft.stops[1] ?? "#1C2028"}
                    onChange={(hex) => setGradientDraft(c => ({ ...c, stops: [c.stops[0] || '#101417', hex] }))}
                  />
                </div>

                {gradientDraft.type === "linear" && (
                   <div className="flex items-center gap-4 rounded-xl border border-white/8 bg-[#14171C] p-3">
                    <AngleWheel
                      value={gradientDraft.angle}
                      onChange={(nextAngle) => setGradientDraft((current) => ({ ...current, angle: nextAngle }))}
                    />
                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] text-[#8D95A6]">Ángulo: {gradientDraft.angle}°</span>
                      <input 
                        type="range" min={0} max={360} 
                        value={gradientDraft.angle} 
                        onChange={(e) => setGradientDraft(c => ({ ...c, angle: Number(e.target.value) }))}
                        className="w-full h-1"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                   <button
                    type="button"
                    onClick={() => setSavedGradients(saveGradient(gradientDraft))}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 text-[#8D95A6] hover:text-white"
                  >
                    <Bookmark className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyBackgroundUpdate(bg => ({ ...bg, gradientConfig: gradientDraft, type: 'gradient' }))}
                    className="flex-1 rounded-xl bg-[#E0E5EB] py-2 text-sm font-medium text-[#101417]"
                  >
                    Aplicar fondo
                  </button>
                </div>
              </div>
            )}

            {activeBackground?.type === "image" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/8 bg-[#14171C] py-2 text-xs text-[#E0E5EB]">
                    <Upload className="h-3 w-3" />
                    Subir
                    <input type="file" accept="image/*" className="hidden" onChange={handleBackgroundFile} />
                  </label>
                  <PropertyButton onClick={() => openUnsplashModal("background")}>Unsplash</PropertyButton>
                </div>
                {activeBackground.imageUrl && (
                  <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#14171C] p-2">
                    <Image src={activeBackground.imageThumb || activeBackground.imageUrl} alt="" width={40} height={40} unoptimized className="rounded-lg object-cover" />
                    <div className="min-w-0">
                      <p className="truncate text-[10px] text-[#E0E5EB]">{activeBackground.photographer || 'Imagen'}</p>
                      <p className="text-[10px] text-[#4E576A]">Overlay {Math.round((activeBackground.overlayOpacity || 0.55) * 100)}%</p>
                    </div>
                  </div>
                )}
                <label className="block space-y-1 text-[10px] text-[#8D95A6]">
                  <span>Opacidad overlay</span>
                  <input 
                    type="range" min={0} max={0.8} step={0.01} 
                    value={activeBackground.overlayOpacity ?? 0.55} 
                    onChange={(e) => applyBackgroundUpdate(bg => ({ ...bg, overlayOpacity: Number(e.target.value), type: 'image' }))} 
                    className="w-full" 
                  />
                </label>
              </div>
            )}
          </PropertySection>

          <PropertySection title="Gestión de Slide" id="slide-mgmt">
            <div className="grid grid-cols-2 gap-2">
              <PropertyButton onClick={handleDuplicateSlide}>Duplicar</PropertyButton>
              <PropertyButton onClick={handleDeleteSlide}>Eliminar</PropertyButton>
            </div>
          </PropertySection>
        </>
      )}

      {/* --- Layers Section --- */}
      {activeObject && (
        <PropertySection title="Capas" id="layers" defaultExpanded={false}>
          <div className="grid grid-cols-2 gap-2">
            {layerActions.map((action) => (
              <PropertyButton key={action.label} onClick={action.onClick}>{action.label}</PropertyButton>
            ))}
          </div>
        </PropertySection>
      )}
      {activeObject && isTextbox(activeObject) && (
        <SaveTextStyleDialog
          isOpen={isSaveDialogOpen}
          onClose={() => setIsSaveDialogOpen(false)}
          activeObject={activeObject}
          onSave={refreshStyles}
        />
      )}
    </div>
  );
}
