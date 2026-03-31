"use client";

import { useState, useMemo } from "react";
import { 
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ArrowUpRight, 
  ChevronRight, ChevronDown, MoveRight, TrendingUp, TrendingDown,
  Briefcase, Building, Users, Target, ChartLine as Chart,
  DollarSign, CreditCard, Receipt, Percent, BarChart2, PieChart, Activity,
  Globe, Smartphone, Monitor, Code, Database, Cloud, Wifi, Lock, Shield, Zap, Cpu, Server,
  Mail, MessageCircle, Phone, Share2, Send, Bell, AtSign, Link, Megaphone,
  Layers, Palette, Pen, Crop, Grid, Layout, Sliders, Star, Heart, Bookmark, Eye,
  Check, X, Plus, Minus, Info, Triangle as AlertTriangle, Clock, Calendar, MapPin, Search, Settings,
  ChevronUp,
  type LucideIcon 
} from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { 
  Rect, 
  FabricImage, 
  Line, 
  Path, 
  FabricObject, 
  Pattern,
  Group,
  loadSVGFromString,
  util,
  type Canvas
} from "fabric";
import { cn } from "@/lib/utils";
import type { CarouselTheme } from "@/lib/editor/carousel-theme";
import { TEXTURE_PATTERNS, SHAPE_PATHS } from "@/lib/editor/asset-utils";

type AssetPanelProps = {
  canvas: Canvas | null;
  activeTheme: CarouselTheme;
  onCommit: () => void;
};

type AssetSection = "iconos" | "formas" | "texturas";

const ICON_CATEGORIES = [
  {
    name: "Flechas",
    icons: { ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ArrowUpRight, ChevronRight, ChevronDown, MoveRight, TrendingUp, TrendingDown }
  },
  {
    name: "Negocios",
    icons: { Briefcase, Building, Users, Target, Chart, DollarSign, CreditCard, Receipt, Percent, BarChart2, PieChart, Activity }
  },
  {
    name: "Digital",
    icons: { Globe, Smartphone, Monitor, Code, Database, Cloud, Wifi, Lock, Shield, Zap, Cpu, Server }
  },
  {
    name: "Comunicación",
    icons: { Mail, MessageCircle, Phone, Share2, Send, Bell, AtSign, Link, Megaphone }
  },
  {
    name: "Diseño",
    icons: { Layers, Palette, Pen, Crop, Grid, Layout, Sliders, Star, Heart, Bookmark, Eye }
  },
  {
    name: "Misc",
    icons: { Check, X, Plus, Minus, Info, AlertTriangle, Clock, Calendar, MapPin, Search, Settings }
  }
];

export function AssetPanel({ canvas, activeTheme, onCommit }: AssetPanelProps) {
  const [activeSection, setActiveSection] = useState<AssetSection>("iconos");
  const [searchQuery, setSearchQuery] = useState("");
  const [textureOpacity, setTextureOpacity] = useState(0.05);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (name: string) => {
    setCollapsedCategories(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const filteredIcons = useMemo(() => {
    if (!searchQuery) return ICON_CATEGORIES;
    const query = searchQuery.toLowerCase();
    return ICON_CATEGORIES.map(cat => ({
      ...cat,
      icons: Object.fromEntries(
        Object.entries(cat.icons).filter(([name]) => name.toLowerCase().includes(query))
      )
    })).filter(cat => Object.keys(cat.icons).length > 0);
  }, [searchQuery]);

  const addIconToCanvas = async (IconComponent: LucideIcon) => {
    if (!canvas) return;

    const svgString = renderToStaticMarkup(<IconComponent size={44} color="#FFFFFF" strokeWidth={2} />);
    
    try {
      const { objects, options } = await loadSVGFromString(svgString);
      const nonNullObjects = objects.filter((obj): obj is FabricObject => obj !== null);
      const icon = util.groupSVGElements(nonNullObjects, options);
      
      icon.set({
        left: 540 - 44, // Center on 1080 canvas
        top: 540 - 44,
        scaleX: 2,
        scaleY: 2,
        fill: activeTheme.accent,
      });

      canvas.add(icon);
      canvas.setActiveObject(icon);
      canvas.renderAll();
      onCommit();
    } catch (err) {
      console.error("Failed to load icon SVG:", err);
    }
  };

  const addShapeToCanvas = (type: string, subType: string) => {
    if (!canvas) return;
    let shape: FabricObject | null = null;

    const center = { left: 540, top: 540 };

    if (type === "SEPARADORES") {
      switch (subType) {
        case "solid":
          shape = new Line([0, 0, 960, 0], { stroke: activeTheme.accent, strokeWidth: 4, left: 60, top: 540 });
          break;
        case "dashed":
          shape = new Line([0, 0, 960, 0], { stroke: activeTheme.accent, strokeWidth: 4, strokeDashArray: [16, 12], left: 60, top: 540 });
          break;
        case "dotted":
          shape = new Line([0, 0, 960, 0], { stroke: activeTheme.accent, strokeWidth: 6, strokeDashArray: [1, 10], strokeLineCap: 'round', left: 60, top: 540 });
          break;
        case "wavy":
          shape = new Path(SHAPE_PATHS.wavy, { stroke: activeTheme.accent, strokeWidth: 4, fill: 'transparent', left: 60, top: 540, scaleX: 4.8 });
          break;
        case "double":
          shape = new Path(SHAPE_PATHS.doubleLine, { stroke: activeTheme.accent, strokeWidth: 4, fill: 'transparent', left: 60, top: 536, scaleX: 0.96 });
          break;
        case "arrow":
          shape = new Path(SHAPE_PATHS.arrowRepeat, { fill: activeTheme.accent, left: 60, top: 530, scaleX: 4 });
          break;
      }
    } else if (type === "MARCOS") {
      if (subType === "simple") {
        shape = new Rect({ width: 920, height: 920, stroke: activeTheme.accent, strokeWidth: 4, fill: "transparent", left: 80, top: 80 });
      } else if (subType === "double") {
        const rect1 = new Rect({ width: 920, height: 920, stroke: activeTheme.accent, strokeWidth: 2, fill: "transparent", left: 80, top: 80 });
        const rect2 = new Rect({ width: 880, height: 880, stroke: activeTheme.accent, strokeWidth: 2, fill: "transparent", left: 100, top: 100 });
        const group = new Group([rect1, rect2], { left: 80, top: 80 });
        shape = group;
      } else if (subType === "dashed") {
        shape = new Rect({ width: 920, height: 920, stroke: activeTheme.accent, strokeWidth: 4, strokeDashArray: [10, 10], fill: "transparent", left: 80, top: 80 });
      } else if (subType === "corners") {
        const path = `M0 40 V0 H40 M880 0 H920 V40 M920 880 V920 H880 M40 920 H0 V880`;
        shape = new Path(path, { stroke: activeTheme.accent, strokeWidth: 6, fill: "transparent", left: 80, top: 80 });
      }
    } else if (type === "BLOQUES") {
      if (subType === "stat") {
        shape = new Rect({ width: 920, height: 160, fill: `${activeTheme.accent}20`, stroke: activeTheme.accent, strokeWidth: 2, strokeDashArray: [0, 0], rx: 16, ry: 16, left: 80, top: 700 });
      } else if (subType === "quote") {
        const bg = new Rect({ width: 920, height: 280, fill: `${activeTheme.accent}10`, rx: 16, ry: 16 });
        const quoteIcon = new Path("M10 10 Q20 0 30 10 T50 10", { fill: activeTheme.accent, scaleX: 2, scaleY: 2, left: 40, top: 40 });
        shape = new Group([bg, quoteIcon], { left: 80, top: 400 });
      } else if (subType === "highlight") {
        shape = new Rect({ width: 920, height: 120, fill: `${activeTheme.accent}30`, left: 80, top: 480 });
      } else if (subType === "badge") {
        shape = new Path(SHAPE_PATHS.badge, { fill: activeTheme.accent, opacity: 0.2, left: 80, top: 80, scaleX: 1.5, scaleY: 0.8 });
      } else if (subType === "tag") {
        shape = new Path(SHAPE_PATHS.tag, { fill: activeTheme.accent, left: 80, top: 80, scaleX: 1.2 });
      }
    } else if (type === "GEOMÉTRICOS") {
      if (subType === "triangle") {
        shape = new Path("M 50 0 L 100 100 L 0 100 Z", { fill: activeTheme.accent, opacity: 0.15, left: 540, top: 540, width: 200, height: 200 });
      } else if (subType === "diamond") {
        shape = new Path(SHAPE_PATHS.diamond, { fill: activeTheme.accent, opacity: 0.15, left: 540, top: 540, scaleX: 2, scaleY: 2 });
      } else if (subType === "halfCircle") {
        shape = new Path(SHAPE_PATHS.halfCircle, { fill: activeTheme.accent, opacity: 0.15, left: 540, top: 540, scaleX: 2, scaleY: 2 });
      } else if (subType === "diagonal") {
        shape = new Line([0, 0, 200, 200], { stroke: activeTheme.accent, strokeWidth: 4, left: 540, top: 540 });
      } else if (subType === "plus") {
        shape = new Path("M 40 0 H 60 V 40 H 100 V 60 H 60 V 100 H 40 V 60 H 0 V 40 H 40 Z", { fill: activeTheme.accent, opacity: 0.2, left: 540, top: 540, width: 100, height: 100 });
      } else if (subType === "dotGrid") {
        shape = new Path(SHAPE_PATHS.dotGrid, { fill: activeTheme.accent, opacity: 0.4, left: 540, top: 540, scaleX: 2, scaleY: 2 });
      }
    }

    if (shape) {
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
      onCommit();
    }
  };

  const addTextureToCanvas = (id: string, url: string) => {
    if (!canvas) return;

    // Remove existing texture
    const existing = canvas.getObjects().filter(obj => (obj as any).data?.role === 'texture');
    existing.forEach(obj => canvas.remove(obj));

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const pattern = new Pattern({
        source: img,
        repeat: 'repeat'
      });
      
      const overlay = new Rect({
        width: 1080,
        height: 1080,
        left: 0,
        top: 0,
        fill: pattern,
        opacity: textureOpacity,
        selectable: true,
        evented: true,
        data: { role: 'texture', textureId: id }
      });

      canvas.add(overlay);
      
      // Send to back, but above background objects
      const bgObjects = canvas.getObjects().filter(obj => String(obj.get('id')).startsWith('background-'));
      const lastBgIndex = Math.max(...bgObjects.map(obj => canvas.getObjects().indexOf(obj)), -1);
      
      canvas.moveObjectTo(overlay, lastBgIndex + 1);
      canvas.renderAll();
      onCommit();
    };
    img.src = url;
  };

  return (
    <div className="flex h-full flex-col p-0">
      {/* Pills Navigation */}
      <div className="flex gap-1 rounded-xl bg-white/5 p-1 mb-6">
        {(["iconos", "formas", "texturas"] as const).map(section => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={cn(
              "flex-1 rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all",
              activeSection === section ? "bg-[#212631] text-[#E0E5EB]" : "text-[#4E576A] hover:bg-white/5"
            )}
          >
            {section}
          </button>
        ))}
      </div>

      {activeSection === "iconos" && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#4E576A]" />
            <input
              type="text"
              placeholder="Buscar ícono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/8 bg-[#14171C] py-2 pl-9 pr-4 text-xs text-[#E0E5EB] outline-none focus:border-[#4E576A]"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {filteredIcons.map(cat => (
              <div key={cat.name} className="mb-4">
                <button
                  onClick={() => toggleCategory(cat.name)}
                  className="flex w-full items-center justify-between py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#4E576A] hover:text-[#8D95A6]"
                >
                  {cat.name}
                  <ChevronUp className={cn("h-3 w-3 transition-transform", collapsedCategories[cat.name] && "rotate-180")} />
                </button>
                {!collapsedCategories[cat.name] && (
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    {Object.entries(cat.icons).map(([name, Icon]) => (
                      <button
                        key={name}
                        onClick={() => addIconToCanvas(Icon)}
                        className="group flex h-11 w-11 items-center justify-center rounded-xl border border-white/5 bg-[#14171C] transition-all hover:bg-[#212631] hover:border-[#4E576A]"
                        title={name}
                      >
                        <Icon className="h-5 w-5 text-[#4E576A] transition-colors group-hover:text-[#E0E5EB]" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === "formas" && (
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {["SEPARADORES", "MARCOS", "BLOQUES", "GEOMÉTRICOS"].map(cat => (
            <div key={cat} className="mb-8">
              <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.15em] text-[#4E576A]">
                {cat}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {cat === "SEPARADORES" && ["solid", "dashed", "dotted", "wavy", "double", "arrow"].map(s => (
                  <button key={s} onClick={() => addShapeToCanvas(cat, s)} className="flex h-[72px] w-[72px] flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#14171C] hover:bg-[#212631] transition-all">
                    <div className="mb-2 h-1 w-10 bg-[#4E576A]" />
                    <span className="text-[8px] uppercase tracking-tighter text-[#4E576A]">{s}</span>
                  </button>
                ))}
                {cat === "MARCOS" && ["simple", "double", "dashed", "corners"].map(s => (
                   <button key={s} onClick={() => addShapeToCanvas(cat, s)} className="flex h-[72px] w-[72px] flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#14171C] hover:bg-[#212631] transition-all">
                    <div className="mb-2 h-8 w-8 border border-[#4E576A]" />
                    <span className="text-[8px] uppercase tracking-tighter text-[#4E576A]">{s}</span>
                  </button>
                ))}
                {cat === "BLOQUES" && ["stat", "quote", "highlight", "badge", "tag"].map(s => (
                   <button key={s} onClick={() => addShapeToCanvas(cat, s)} className="flex h-[72px] w-[72px] flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#14171C] hover:bg-[#212631] transition-all">
                    <div className="mb-2 h-6 w-10 bg-[#4E576A]/20 border border-[#4E576A]" />
                    <span className="text-[8px] uppercase tracking-tighter text-[#4E576A]">{s}</span>
                  </button>
                ))}
                {cat === "GEOMÉTRICOS" && ["triangle", "diamond", "halfCircle", "diagonal", "plus", "dotGrid"].map(s => (
                   <button key={s} onClick={() => addShapeToCanvas(cat, s)} className="flex h-[72px] w-[72px] flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#14171C] hover:bg-[#212631] transition-all">
                    <div className="mb-2 h-8 w-8 bg-[#4E576A]/20" />
                    <span className="text-[8px] uppercase tracking-tighter text-[#4E576A]">{s}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSection === "texturas" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(TEXTURE_PATTERNS).map(([id, url]) => (
              <button
                key={id}
                onClick={() => addTextureToCanvas(id, url)}
                className="group relative h-20 w-20 overflow-hidden rounded-2xl border border-white/5 bg-[#14171C] transition-all hover:border-[#4E576A]"
              >
                <div 
                  className="absolute inset-0 opacity-40 transition-opacity group-hover:opacity-100"
                  style={{ backgroundImage: `url(${url})`, backgroundSize: 'cover' }}
                />
                <span className="absolute bottom-2 left-0 right-0 text-center text-[9px] font-bold uppercase tracking-widest text-[#E0E5EB] drop-shadow-md">
                  {id}
                </span>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#14171C] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#4E576A]">Opacidad</span>
              <span className="text-[10px] font-mono text-[#E0E5EB]">{Math.round(textureOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.2"
              step="0.01"
              value={textureOpacity}
              onChange={(e) => setTextureOpacity(parseFloat(e.target.value))}
              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/5 accent-[#462D6E]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
