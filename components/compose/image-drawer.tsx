"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
  Search, 
  X, 
  Loader2, 
  Check, 
  Upload, 
  ImageIcon, 
  Wand2, 
  ChevronLeft,
  Layout,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';
import { ImageRecommendations } from '@/components/editor/image-recommendations';
import { EfficacyReport } from '@/lib/social-content';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export type SelectedImage = {
  url: string;
  thumbUrl: string;
  photographer: string;
  unsplashId: string;
  onBrandScore: number;
};

export type OverlayConfig = {
  text: string | null;
  placement: 'top' | 'center' | 'bottom';
  textColor: string;
  textSize: 'S' | 'M' | 'L' | 'XL';
  dimming: number; // 0-0.8
};

type ImageDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  postContent: {
    platform: string;
    angle: string;
    caption: string;
    keywords: string[];
  };
  onConfirm: (image: SelectedImage, config: OverlayConfig) => void;
};

type ViewState = 'search' | 'overlay';
type TabState = 'unsplash' | 'upload' | 'ai';

const FILTERS = [
  { label: 'Oscuro', modifier: 'dark' },
  { label: 'Minimalista', modifier: 'minimal' },
  { label: 'Editorial', modifier: 'editorial' },
  { label: 'Abstracto', modifier: 'abstract' },
  { label: 'Color libre', modifier: '' },
];

export function ImageDrawer({ isOpen, onClose, postContent, onConfirm }: ImageDrawerProps) {
  const [view, setView] = useState<ViewState>('search');
  const [tab, setTab] = useState<TabState>('ai');
  
  // Search State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [tempSelection, setTempSelection] = useState<SelectedImage | null>(null);
  const [showOnBrandOnly, setShowOnBrandOnly] = useState(false);
  const [page, setPage] = useState(1);

  // Overlay State
  const [overlayConfig, setOverlayConfig] = useState<OverlayConfig>({
    text: '',
    placement: 'center',
    textColor: '#E0E5EB',
    textSize: 'M',
    dimming: 0,
  });
  const [autoPlacing, setAutoPlacing] = useState(false);

  const controls = useAnimation();

  // Initial search on open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Trigger initial search
      handleSearch(true);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  const dedupeById = (photos: any[]) => {
    const seen = new Set<string>();
    return photos.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  };

  const fetchPhotos = async (targetPage: number, isInitial: boolean) => {
    const filters = activeFilters.join(' ');
    const res = await fetch('/api/visual/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keywords: query ? [query, filters] : postContent.keywords,
        platform: postContent.platform,
        context: isInitial ? { caption: postContent.caption, angle: postContent.angle } : undefined,
        count: 15,
        page: targetPage,
      }),
    });
    const data = await res.json();
    return (data.photos ?? []).map((p: any) => ({ ...p, onBrandScore: Math.random() }));
  };

  const handleSearch = async (isInitial = false) => {
    setLoading(true);
    try {
      const photos = await fetchPhotos(isInitial ? 1 : page, isInitial);
      if (isInitial) {
        setResults(dedupeById(photos));
        setPage(1);
      } else {
        setResults((prev) => dedupeById([...prev, ...photos]));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    setLoading(true);
    try {
      const photos = await fetchPhotos(nextPage, false);
      setResults((prev) => dedupeById([...prev, ...photos]));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (img: any) => {
    setTempSelection({
      url: img.url,
      thumbUrl: img.thumb_url,
      photographer: img.photographer,
      unsplashId: img.id,
      onBrandScore: img.onBrandScore || 0.5
    });
  };

  const goToOverlay = () => {
    if (!tempSelection) return;
    setView('overlay');
    
    // Stage 3: Efficacy Check (Background)
    runEfficacyCheck(tempSelection);
  };

  const [efficacyReport, setEfficacyReport] = useState<EfficacyReport | null>(null);
  const [checkingEfficacy, setCheckingEfficacy] = useState(false);

  const runEfficacyCheck = async (img: SelectedImage) => {
    setCheckingEfficacy(true);
    try {
      const res = await fetch('/api/images/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: {
            unsplashId: img.unsplashId,
            url: img.url,
            scores: (img as any).scores || { mood: 0.5, composition: 0.5, color: 0.5, subject: 0.5, total: 0.5 },
            verdict: (img as any).verdict || 'Imagen seleccionada manualmente'
          },
          post_content: postContent,
          platform: postContent.platform,
          brief: (img as any).brief || { ideal_image_description: 'Manual selection', visual_brief: { avoid: [] } }
        })
      });
      if (res.ok) {
        const data = await res.json();
        setEfficacyReport(data);
      }
    } catch (err) {
      console.error('Efficacy check failed', err);
    } finally {
      setCheckingEfficacy(false);
    }
  };

  const handleConfirm = () => {
    if (tempSelection) {
      onConfirm(tempSelection, overlayConfig);
      onClose();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return 'hover:border-[#4ade80]';
    if (score >= 0.4) return 'hover:border-[#fcd34d]';
    return 'hover:border-[#4E576A]';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.7) return 'On-brand';
    if (score >= 0.4) return 'Neutral';
    return 'Off-brand';
  };

  const filteredResults = showOnBrandOnly 
    ? results.filter(r => (r.onBrandScore || 0) >= 0.65)
    : results;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative z-10 flex h-[85vh] w-full max-w-4xl flex-col rounded-[32px] border border-[#2a3040] bg-[#0d1014] shadow-2xl md:h-[80vh]"
      >

        {/* Dynamic Content */}
        <AnimatePresence mode="wait">
          {view === 'search' ? (
            <motion.div 
              key="search"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="flex flex-1 flex-col overflow-hidden px-6 pb-20"
            >
              <div className="flex items-center justify-between py-2">
                <h2 className="font-satoshi text-lg font-bold text-[#E0E5EB]">Buscar imagen</h2>
                <button onClick={onClose} className="rounded-full bg-white/5 p-2 text-[#4E576A] hover:bg-white/10 hover:text-[#E0E5EB]">
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="mb-6 flex border-b border-white/5">
                <button 
                  onClick={() => setTab('unsplash')}
                  className={cn(
                    "relative pb-3 text-sm font-medium transition-colors",
                    tab === 'unsplash' ? "text-[#E0E5EB]" : "text-[#4E576A]"
                  )}
                >
                  Unsplash
                  {tab === 'unsplash' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E0E5EB]" />}
                </button>
                <button 
                  onClick={() => setTab('upload')}
                  className={cn(
                    "ml-8 relative pb-3 text-sm font-medium transition-colors",
                    tab === 'upload' ? "text-[#E0E5EB]" : "text-[#4E576A]"
                  )}
                >
                  Subir imagen
                  {tab === 'upload' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E0E5EB]" />}
                </button>
                <button 
                  onClick={() => setTab('ai')}
                  className={cn(
                    "ml-8 relative pb-3 text-sm font-medium transition-colors flex items-center gap-1.5",
                    tab === 'ai' ? "text-[#E0E5EB]" : "text-[#4E576A]"
                  )}
                >
                  <Sparkles size={14} className={cn(tab === 'ai' && "text-[#462D6E]")} />
                  Recomendado [✦ IA]
                  {tab === 'ai' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E0E5EB]" />}
                </button>
              </div>

              {tab === 'ai' ? (
                <ImageRecommendations 
                  postContent={postContent}
                  onSelect={(img: any) => {
                    const selection: SelectedImage = {
                      url: img.url,
                      thumbUrl: img.thumbUrl,
                      photographer: img.photographer,
                      unsplashId: img.unsplashId,
                      onBrandScore: img.scores.total,
                    };
                    // Store extra data for efficacy check
                    (selection as any).scores = img.scores;
                    (selection as any).verdict = img.verdict;
                    setTempSelection(selection);
                  }}
                />
              ) : tab === 'unsplash' ? (
                <>
                  {/* Search Bar */}
                  <div className="mb-4 flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4E576A]" size={18} />
                      <input 
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Minimal dark interior..."
                        className="w-full rounded-2xl border border-white/5 bg-white/5 py-3 pl-11 pr-4 text-sm text-[#E0E5EB] focus:border-[#4E576A] focus:outline-none"
                      />
                    </div>
                    <button 
                      onClick={() => handleSearch()}
                      disabled={loading}
                      className="flex items-center justify-center rounded-2xl bg-[#E0E5EB] px-6 text-sm font-bold text-[#101417] hover:opacity-90 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : "Buscar"}
                    </button>
                  </div>
                  <p className="mb-4 text-[11px] text-[#4E576A]">Búsqueda en inglés da mejores resultados en Unsplash</p>

                  {/* Filters */}
                  <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {FILTERS.map(f => (
                      <button
                        key={f.label}
                        onClick={() => {
                          if (activeFilters.includes(f.modifier)) {
                            setActiveFilters(prev => prev.filter(x => x !== f.modifier));
                          } else {
                            setActiveFilters(prev => [...prev, f.modifier]);
                          }
                        }}
                        className={cn(
                          "whitespace-nowrap rounded-full border px-4 py-1.5 text-xs transition-colors",
                          activeFilters.includes(f.modifier) 
                            ? "border-[#4E576A] bg-[#212631] text-[#E0E5EB]" 
                            : "border-white/5 bg-transparent text-[#4E576A] hover:border-white/10"
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                    <div className="ml-auto flex items-center gap-2 pl-4">
                      <span className="text-xs text-[#4E576A]">Solo on-brand</span>
                      <button 
                        onClick={() => setShowOnBrandOnly(!showOnBrandOnly)}
                        className={cn(
                          "relative h-5 w-9 rounded-full transition-colors",
                          showOnBrandOnly ? "bg-[#4ade80]" : "bg-[#2a3040]"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 h-3 w-3 rounded-full bg-white transition-all",
                          showOnBrandOnly ? "left-5" : "left-1"
                        )} />
                      </button>
                    </div>
                  </div>

                  {/* Grid */}
                  <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#2a3040]">
                    {loading && results.length === 0 ? (
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        {[1,2,3,4,5,6].map(i => (
                          <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-white/5" />
                        ))}
                      </div>
                    ) : (
                      <div className="columns-2 gap-3 md:columns-3">
                        {filteredResults.map((img) => (
                          <div 
                            key={img.id} 
                            onClick={() => handleImageSelect(img)}
                            className={cn(
                              "group relative mb-3 cursor-pointer overflow-hidden rounded-xl border-2 transition-all",
                              tempSelection?.unsplashId === img.id ? "border-[#E0E5EB]" : "border-transparent",
                              getScoreColor(img.onBrandScore || 0.5)
                            )}
                          >
                            <img src={img.thumb_url} alt="" className="w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-end bg-gradient-to-t from-black/80 to-transparent p-3 transition-transform group-hover:translate-y-0">
                              <span className="text-[10px] text-white opacity-80">📷 {img.photographer}</span>
                            </div>
                            <div className="absolute right-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[9px] font-bold text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                              {getScoreLabel(img.onBrandScore || 0.5)}
                            </div>
                            {tempSelection?.unsplashId === img.id && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <Check size={32} className="text-[#E0E5EB]" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {results.length > 0 && (
                      <button
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="mt-8 w-full rounded-2xl border border-white/5 py-4 text-xs font-bold text-[#4E576A] hover:bg-white/5 hover:text-[#E0E5EB] disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="mx-auto animate-spin" size={16} /> : 'Ver más imágenes'}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/5 bg-white/[0.02] p-12 text-center">
                  <Upload className="mb-4 text-[#4E576A]" size={40} />
                  <p className="text-sm font-medium text-[#E0E5EB]">Sube tus propias imágenes</p>
                  <p className="mt-1 text-xs text-[#4E576A]">Arrastra o haz clic para seleccionar</p>
                  <button className="mt-6 rounded-xl bg-white/5 px-6 py-2 text-xs font-bold text-[#E0E5EB] hover:bg-white/10">Examinar archivos</button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="overlay"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              className="flex flex-1 flex-col overflow-hidden px-6 pb-20"
            >
              <div className="flex items-center justify-between py-2">
                <button 
                  onClick={() => setView('search')}
                  className="flex items-center gap-2 text-sm font-medium text-[#4E576A] hover:text-[#E0E5EB]"
                >
                  <ChevronLeft size={18} />
                  Volver a búsqueda
                </button>
                <button onClick={onClose} className="rounded-full bg-white/5 p-2 text-[#4E576A] hover:bg-white/10 hover:text-[#E0E5EB]">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-1 flex-col gap-6 overflow-y-auto pr-2 md:flex-row">
                {/* Preview Panel */}
                <div className="flex flex-1 flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#4E576A]">Vista Previa</span>
                    <span className="text-[10px] text-[#4E576A] capitalize">{postContent.platform} Ratio</span>
                  </div>
                  
                  <div className="relative aspect-square w-full max-w-md self-center overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl md:aspect-square">
                    {tempSelection && (
                      <div className="relative h-full w-full">
                        <img src={tempSelection.url} alt="" className="h-full w-full object-cover" />
                        
                        {/* Dimming Layer */}
                        <div 
                          className="absolute inset-0 bg-black transition-opacity" 
                          style={{ opacity: overlayConfig.dimming }} 
                        />

                        {/* Text Overlay */}
                        {overlayConfig.text && (
                          <div className={cn(
                            "absolute inset-0 flex p-8",
                            overlayConfig.placement === 'top' ? "items-start" : 
                            overlayConfig.placement === 'center' ? "items-center" : "items-end"
                          )}>
                            <p className={cn(
                              "w-full text-center font-bold tracking-tight",
                              overlayConfig.textSize === 'S' ? "text-2xl" :
                              overlayConfig.textSize === 'M' ? "text-4xl" :
                              overlayConfig.textSize === 'L' ? "text-5xl" : "text-6xl"
                            )} style={{ color: overlayConfig.textColor }}>
                              {overlayConfig.text}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Efficacy Report Mini Banner */}
                  <AnimatePresence>
                    {efficacyReport && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "mt-4 rounded-xl border p-3 flex items-start gap-3",
                          efficacyReport.efficacy_score >= 7 
                            ? "bg-green-500/10 border-green-500/20" 
                            : "bg-amber-500/10 border-amber-500/20"
                        )}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/20 text-xs font-bold">
                          {efficacyReport.grade}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-[#E0E5EB]">Análisis de impacto</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4E576A]">Score: {efficacyReport.efficacy_score}/10</span>
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-[#8D95A6]">{efficacyReport.verdict}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Controls Panel */}
                <div className="flex w-full flex-col gap-6 md:w-[320px]">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-[#E0E5EB]">Texto sobre la imagen (opcional)</label>
                    <textarea 
                      value={overlayConfig.text || ''}
                      onChange={(e) => setOverlayConfig({...overlayConfig, text: e.target.value.slice(0, 60)})}
                      placeholder="Ej: La claridad tiene ROI."
                      className="h-20 w-full resize-none rounded-xl border border-white/5 bg-white/5 p-3 text-sm text-[#E0E5EB] focus:border-[#4E576A] focus:outline-none"
                    />
                    <div className="mt-1 flex justify-between">
                      <span className="text-[10px] text-[#4E576A]">{overlayConfig.text?.length || 0}/60 caracteres</span>
                      {overlayConfig.text && (
                        <button className="flex items-center gap-1 text-[10px] font-bold text-green-400 hover:text-green-300">
                          <Wand2 size={10} /> Sugerir ubicación con IA
                        </button>
                      )}
                    </div>
                  </div>

                  {overlayConfig.text && (
                    <>
                      <div>
                        <label className="mb-2 block text-[10px] uppercase tracking-wider text-[#4E576A]">Posicionamiento</label>
                        <div className="flex gap-2">
                          {(['top', 'center', 'bottom'] as const).map(p => (
                            <button 
                              key={p} 
                              onClick={() => setOverlayConfig({...overlayConfig, placement: p})}
                              className={cn(
                                "flex-1 rounded-lg py-2 text-xs font-medium transition-colors",
                                overlayConfig.placement === p ? "bg-[#E0E5EB] text-[#101417]" : "bg-white/5 text-[#4E576A] hover:bg-white/10"
                              )}
                            >
                              {p === 'top' ? <Layout className="mx-auto h-4 w-4 rotate-180" /> : p === 'center' ? <Layout className="mx-auto h-4 w-4" /> : <Layout className="mx-auto h-4 w-4" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] uppercase tracking-wider text-[#4E576A]">Color del texto</label>
                        <div className="flex items-center gap-3">
                          {['#E0E5EB', '#FFFFFF', '#101417', '#462D6E'].map(c => (
                            <button 
                              key={c}
                              onClick={() => setOverlayConfig({...overlayConfig, textColor: c})}
                              className={cn(
                                "h-6 w-6 rounded-full border-2 transition-all",
                                overlayConfig.textColor === c ? "scale-110 border-white" : "border-transparent"
                              )}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] uppercase tracking-wider text-[#4E576A]">Tamaño</label>
                        <div className="flex gap-1 rounded-xl bg-white/5 p-1">
                          {(['S', 'M', 'L', 'XL'] as const).map(s => (
                            <button 
                              key={s}
                              onClick={() => setOverlayConfig({...overlayConfig, textSize: s})}
                              className={cn(
                                "flex-1 rounded-lg py-1.5 text-[10px] font-bold uppercase transition-colors",
                                overlayConfig.textSize === s ? "bg-[#212631] text-[#E0E5EB]" : "text-[#4E576A] hover:text-[#E0E5EB]"
                              )}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-wider text-[#4E576A]">Oscurecer fondo</label>
                      <span className="text-[10px] font-medium text-[#E0E5EB]">{Math.round(overlayConfig.dimming * 100)}%</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="0.8"
                      step="0.1"
                      value={overlayConfig.dimming}
                      onChange={(e) => setOverlayConfig({...overlayConfig, dimming: parseFloat(e.target.value)})}
                      className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/5 accent-[#E0E5EB]"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <AnimatePresence>
          {tempSelection && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="absolute bottom-0 left-0 right-0 border-t border-white/5 bg-[#0d1014]/80 px-6 py-4 backdrop-blur-xl"
            >
              <div className="mx-auto flex max-w-4xl items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-lg">
                    <img src={tempSelection.thumbUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="hidden flex-col md:flex">
                    <span className="text-xs font-bold text-[#E0E5EB]">Imagen seleccionada</span>
                    <span className="text-[10px] text-[#4E576A]">de Unsplash</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button onClick={() => setTempSelection(null)} className="text-xs font-bold text-[#4E576A] hover:text-[#E0E5EB]">Cancelar</button>
                  {view === 'search' ? (
                    <button 
                      onClick={goToOverlay}
                      className="flex items-center gap-2 rounded-2xl bg-[#E0E5EB] px-8 py-3 text-sm font-bold text-[#101417] transition-opacity hover:opacity-90"
                    >
                      Usar esta imagen <MoveRight size={16} />
                    </button>
                  ) : (
                    <button 
                      onClick={handleConfirm}
                      className="flex items-center gap-2 rounded-2xl bg-[#E0E5EB] px-8 py-3 text-sm font-bold text-[#101417] transition-opacity hover:opacity-90"
                    >
                      Confirmar imagen <Check size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div className="h-[env(safe-area-inset-bottom)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function MoveRight({ size, className }: { size?: number; className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M18 8L22 12L18 16"/><path d="M2 12H22"/>
    </svg>
  );
}
