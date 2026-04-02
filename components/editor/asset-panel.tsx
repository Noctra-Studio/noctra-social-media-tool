"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { 
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ArrowUpRight, 
  ChevronRight, ChevronDown, MoveRight, TrendingUp, TrendingDown,
  Briefcase, Building, Users, Target, ChartLine as Chart,
  DollarSign, CreditCard, Receipt, Percent, BarChart2, PieChart, Activity,
  Globe, Smartphone, Monitor, Code, Database, Cloud, Wifi, Lock, Shield, Zap, Cpu, Server,
  Mail, MessageCircle, Phone, Share2, Send, Bell, AtSign, Link, Megaphone,
  Layers, Palette, Pen, Crop, Grid, Layout, Sliders, Star, Heart, Bookmark, Eye,
  Check, X, Plus, Minus, Info, Triangle as AlertTriangle, Clock, Calendar, MapPin, Search, Settings,
  ChevronUp, Loader2,
  Sparkles,
  RefreshCcw,
  Library,
  ChevronLeft,
  Filter
} from "lucide-react";
import { 
  searchIcons, 
  fetchIcon, 
  iconToSVG, 
  type IconifyIcon, 
  type IconStyle, 
  POPULAR_LIBRARIES,
  CURATED_CATEGORIES 
} from "@/lib/icons/iconify";
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
import { TEXTURE_PATTERNS } from "@/lib/editor/asset-utils";
import { addShapeToCanvas } from "@/lib/editor/shape-utils";

type AssetPanelProps = {
  canvas: Canvas | null;
  activeTheme: CarouselTheme;
  onCommit: () => void;
};

type AssetSection = "iconos" | "formas" | "texturas";

const RECENT_ICONS_KEY = 'noctra_recent_icons';

export function AssetPanel({ canvas, activeTheme, onCommit }: AssetPanelProps) {
  const [activeSection, setActiveSection] = useState<AssetSection>("iconos");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [iconStyles, setIconStyles] = useState<IconStyle>("outline");
  const [selectedLibraries, setSelectedLibraries] = useState<string[]>(['ph', 'tabler', 'heroicons']);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentIcons, setRecentIcons] = useState<string[]>([]);
  const [showLibraryFilter, setShowLibraryFilter] = useState(false);
  const [textureOpacity, setTextureOpacity] = useState(0.05);

  const searchCache = useRef<Map<string, string[]>>(new Map());
  const iconCache = useRef<Map<string, IconifyIcon>>(new Map());

  // Load Recents
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_ICONS_KEY);
    if (saved) setRecentIcons(JSON.parse(saved));
  }, []);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Execute Search
  useEffect(() => {
    if (activeSection !== 'iconos') return;
    
    const runSearch = async () => {
      const q = debouncedQuery.trim();
      const cacheKey = `${q}_${iconStyles}_${selectedLibraries.sort().join(',')}`;
      
      if (searchCache.current.has(cacheKey)) {
        setSearchResults(searchCache.current.get(cacheKey)!);
        return;
      }

      if (q.length < 2 && q !== "") {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const result = await searchIcons(q === "" ? "arrow" : q, {
          style: iconStyles,
          prefixes: selectedLibraries,
          limit: 54
        });
        setSearchResults(result.icons);
        searchCache.current.set(cacheKey, result.icons);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    runSearch();
  }, [debouncedQuery, iconStyles, selectedLibraries, activeSection]);

  const addIconToCanvas = async (iconName: string) => {
    if (!canvas) return;

    try {
      setIsLoading(true);
      let iconData = iconCache.current.get(iconName);
      
      if (!iconData) {
        iconData = await fetchIcon(iconName) || undefined;
        if (iconData) iconCache.current.set(iconName, iconData);
      }

      if (!iconData) return;

      const accentColor = (canvas as any).data?.currentPalette?.accent ?? activeTheme.accent;
      const svgString = iconToSVG(iconData, accentColor);
      
      const { objects, options } = await loadSVGFromString(svgString);
      const nonNullObjects = objects.filter((obj): obj is FabricObject => obj !== null);
      const group = util.groupSVGElements(nonNullObjects, options);
      
      const targetSize = 80;
      const scale = targetSize / Math.max(group.width || 1, group.height || 1);
      
      group.set({
        scaleX: scale,
        scaleY: scale,
        left: 540 - (group.width || 0) * scale / 2,
        top: 540 - (group.height || 0) * scale / 2,
        data: {
          role: 'icon',
          iconName: iconData.name,
          originalColor: accentColor
        }
      });

      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.renderAll();
      
      // Update Recents
      setRecentIcons(prev => {
        const next = [iconName, ...prev.filter(i => i !== iconName)].slice(0, 12);
        localStorage.setItem(RECENT_ICONS_KEY, JSON.stringify(next));
        return next;
      });

      onCommit();
    } catch (err) {
      console.error("Failed to add icon:", err);
    } finally {
      setIsLoading(false);
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
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#4E576A]" />
            <input
              type="text"
              placeholder="Buscar ícono... (inglés)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/8 bg-[#14171C] py-2 pl-9 pr-4 text-xs text-[#E0E5EB] outline-none focus:border-[#4E576A]"
            />
          </div>

          <div className="mb-4 space-y-3">
            {/* Style Filters */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {(['outline', 'solid', 'bold', 'duotone'] as IconStyle[]).map(style => (
                <button
                  key={style}
                  onClick={() => setIconStyles(style)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 px-2.5 py-2 text-[8px] font-bold uppercase rounded-xl border transition-all",
                    iconStyles === style 
                      ? "bg-[#212631] border-[#4E576A] text-[#E0E5EB]" 
                      : "border-white/5 bg-[#14171C] text-[#4E576A] hover:border-white/10"
                  )}
                >
                  <div className={cn(
                    "h-3 w-3 rounded-sm border",
                    style === 'solid' ? "bg-current" : 
                    style === 'bold' ? "border-2" : 
                    style === 'duotone' ? "bg-current/30" : ""
                  )} />
                  {style === 'outline' ? 'Linea' : style === 'solid' ? 'Sólido' : style === 'bold' ? 'Gordo' : 'Duo'}
                </button>
              ))}
            </div>

            {/* Library Toggle */}
            <div className="border-b border-white/5 pb-2">
              <button 
                onClick={() => setShowLibraryFilter(!showLibraryFilter)}
                className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-[#4E576A] hover:text-[#8D95A6]"
              >
                <Filter className="h-3 w-3" />
                Filtrar por librería
                <ChevronDown className={cn("ml-auto h-3 w-3 transition-transform", showLibraryFilter && "rotate-180")} />
              </button>
              
              {showLibraryFilter && (
                <div className="grid grid-cols-2 gap-2 pt-3">
                  {POPULAR_LIBRARIES.map(lib => (
                    <label key={lib.id} className="flex cursor-pointer items-center gap-2">
                      <input 
                        type="checkbox"
                        checked={selectedLibraries.includes(lib.id)}
                        onChange={(e) => {
                          const next = e.target.checked 
                            ? [...selectedLibraries, lib.id]
                            : selectedLibraries.filter(id => id !== lib.id);
                          setSelectedLibraries(next);
                        }}
                        className="h-3 w-3 rounded border-white/10 bg-white/5 accent-[#E0E5EB]"
                      />
                      <span className="text-[10px] text-[#8D95A6]">{lib.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1 no-scrollbar">
            {searchQuery === "" && (
              <>
                <div className="mb-4 flex gap-1.5 overflow-x-auto no-scrollbar">
                  {POPULAR_LIBRARIES.slice(0, 4).map(lib => (
                    <button
                      key={lib.id}
                      onClick={() => setSelectedLibraries([lib.id])}
                      className={cn(
                        "rounded-full border px-3 py-1 text-[9px] font-bold transition-all whitespace-nowrap",
                        selectedLibraries.includes(lib.id) && selectedLibraries.length === 1
                          ? "border-[#4E576A] bg-[#212631] text-[#E0E5EB]"
                          : "border-white/5 text-[#4E576A] hover:text-[#8D95A6]"
                      )}
                    >
                      {lib.name}
                    </button>
                  ))}
                </div>

                {recentIcons.length > 0 && (
                  <div className="mb-6">
                    <h4 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#4E576A]">
                      <Clock className="h-3 w-3" />
                      Recientes
                    </h4>
                    <div className="grid grid-cols-6 gap-2">
                      {recentIcons.map(name => (
                        <IconGridCell key={name} name={name} onClick={() => addIconToCanvas(name)} />
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h4 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#4E576A]">Categorías</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {CURATED_CATEGORIES.map(cat => (
                      <button
                        key={cat.label}
                        onClick={() => setSearchQuery(cat.query)}
                        className="rounded-lg border border-white/5 bg-[#14171C] py-2 text-[10px] text-[#8D95A6] hover:bg-[#212631] hover:text-[#E0E5EB]"
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="relative">
              {isLoading && (
                <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-center bg-[#101417]/80 py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-[#4E576A]" />
                </div>
              )}
              
              <div className="grid grid-cols-6 gap-2">
                {searchResults.map(name => (
                  <IconGridCell key={name} name={name} onClick={() => addIconToCanvas(name)} />
                ))}
              </div>
              
              {searchResults.length === 0 && !isLoading && searchQuery !== "" && (
                <div className="py-8 text-center text-xs text-[#4E576A]">
                  No se encontraron íconos.
                </div>
              )}
            </div>
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
                  <button 
                    key={s} 
                    onClick={() => {
                        addShapeToCanvas(canvas, cat, s, {}, activeTheme.accent);
                        onCommit();
                    }} 
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('noctra/editor-object', JSON.stringify({
                        type: 'shape',
                        category: cat,
                        shapeType: s
                      }));
                    }}
                    className="flex h-[72px] w-[72px] flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#14171C] hover:bg-[#212631] transition-all"
                  >
                    <div className="mb-2 h-1 w-10 bg-[#4E576A]" />
                    <span className="text-[8px] uppercase tracking-tighter text-[#4E576A]">{s}</span>
                  </button>
                ))}
                {cat === "MARCOS" && ["simple", "double", "dashed", "corners"].map(s => (
                   <button 
                    key={s} 
                    onClick={() => {
                        addShapeToCanvas(canvas, cat, s, {}, activeTheme.accent);
                        onCommit();
                    }} 
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('noctra/editor-object', JSON.stringify({
                        type: 'shape',
                        category: cat,
                        shapeType: s
                      }));
                    }}
                    className="flex h-[72px] w-[72px] flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#14171C] hover:bg-[#212631] transition-all"
                  >
                    <div className="mb-2 h-8 w-8 border border-[#4E576A]" />
                    <span className="text-[8px] uppercase tracking-tighter text-[#4E576A]">{s}</span>
                  </button>
                ))}
                {cat === "BLOQUES" && ["stat", "quote", "highlight", "badge", "tag"].map(s => (
                   <button 
                    key={s} 
                    onClick={() => {
                        addShapeToCanvas(canvas, cat, s, {}, activeTheme.accent);
                        onCommit();
                    }} 
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('noctra/editor-object', JSON.stringify({
                        type: 'shape',
                        category: cat,
                        shapeType: s
                      }));
                    }}
                    className="flex h-[72px] w-[72px] flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#14171C] hover:bg-[#212631] transition-all"
                  >
                    <div className="mb-2 h-6 w-10 bg-[#4E576A]/20 border border-[#4E576A]" />
                    <span className="text-[8px] uppercase tracking-tighter text-[#4E576A]">{s}</span>
                  </button>
                ))}
                {cat === "GEOMÉTRICOS" && ["triangle", "diamond", "halfCircle", "diagonal", "plus", "dotGrid"].map(s => (
                   <button 
                    key={s} 
                    onClick={() => {
                        addShapeToCanvas(canvas, cat, s, {}, activeTheme.accent);
                        onCommit();
                    }} 
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('noctra/editor-object', JSON.stringify({
                        type: 'shape',
                        category: cat,
                        shapeType: s
                      }));
                    }}
                    className="flex h-[72px] w-[72px] flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#14171C] hover:bg-[#212631] transition-all"
                  >
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

function IconGridCell({ name, onClick }: { name: string; onClick: () => void }) {
  const [prefix, iconName] = name.split(':');
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div className="relative">
      <button
        onClick={onClick}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('noctra/editor-object', JSON.stringify({
            type: 'icon',
            name: name,
            url: `https://api.iconify.design/${prefix}/${iconName}.svg`
          }));
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group flex h-7 w-7 items-center justify-center rounded-lg border border-white/5 bg-[#14171C] transition-all hover:bg-[#212631] hover:border-[#4E576A]"
      >
        <img 
          src={`https://api.iconify.design/${prefix}/${iconName}.svg?color=%238D95A6`} 
          alt={name}
          className="h-[18px] w-[18px] transition-opacity"
          style={{ opacity: 0.6 }}
          onLoad={(e) => (e.currentTarget.style.opacity = '1')}
        />
      </button>
      {isHovered && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-[#0A0C0F] px-2 py-1 text-[8px] text-white shadow-xl border border-white/10">
          {name}
        </div>
      )}
    </div>
  );
}
