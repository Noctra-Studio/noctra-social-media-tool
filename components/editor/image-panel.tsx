"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Palette,
  Bookmark,
  Upload as UploadIcon,
  X,
  ChevronRight,
  ArrowLeft,
  Check,
  Loader2,
  Trash2,
  ExternalLink,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOOD_CATEGORIES, generateSmartQuery } from '@/lib/unsplash/query-engine';
import { setCanvasBackground, updateDimmingOverlay, removeCanvasBackground } from '@/lib/editor/canvas-background';
import { ImageRecommendations } from '@/components/editor/image-recommendations';
import type { ScoredImage } from '@/lib/social-content';
import type { Canvas } from 'fabric';

interface ImagePanelProps {
  canvas: Canvas | null;
  caption?: string;
  angle?: string;
  platform?: string;
  onCommit: () => void;
  slideType?: 'cover' | 'content' | 'cta';
  postId?: string;
  slideIndex?: number;
}

interface UnifiedPhoto {
  id: string;
  source: 'unsplash' | 'pexels';
  url: string;
  thumbUrl: string;
  previewUrl: string;
  photographer: string;
  photographerUrl: string;
  sourceUrl: string;
  width: number;
  height: number;
  color: string;
  onBrandScore?: number;
}

type ProcessingStyle = 'natural' | 'dark-minimal' | 'editorial' | 'monochrome' | 'warm' | 'cool';

type SubTab = 'buscar' | 'mood' | 'ia' | 'biblioteca' | 'subir';

export const ImagePanel: React.FC<ImagePanelProps> = ({
  canvas,
  caption,
  angle,
  platform = 'instagram',
  onCommit,
  slideType = 'content',
  postId,
  slideIndex = -1,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('ia');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<UnifiedPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [dimming, setDimming] = useState(0);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [committedId, setCommittedId] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<ProcessingStyle>('natural');
  const [isProcessing, setIsProcessing] = useState(false);
  const [appliedTransforms, setAppliedTransforms] = useState<string[]>([]);
  const [currentPhoto, setCurrentPhoto] = useState<UnifiedPhoto | null>(null);
  
  // Ref to track search debounce
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize smart query
  useEffect(() => {
    if (caption && activeSubTab === 'buscar' && !searchQuery) {
      const { query } = generateSmartQuery(caption, angle || 'editorial', platform, slideType);
      setSearchQuery(query);
      handleSearch(query, 1);
    }
  }, [caption, angle, platform, slideType]);

  const handleSearch = useCallback(async (query: string, p: number = 1, moodId?: string) => {
    if (!query && !moodId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/visual/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query || undefined,
          moodId: moodId || undefined,
          platform,
          page: p,
          count: 12,
          slideType
        }),
      });

      const data = await response.json();
      if (data.photos) {
        if (p === 1) {
          setResults(data.photos);
        } else {
          setResults(prev => [...prev, ...data.photos]);
        }
        setPage(p);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [platform, slideType]);

  const onSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(val, 1);
    }, 600);
  };

  const handleSelectImage = async (photo: UnifiedPhoto, commit: boolean = false, styleOverride?: ProcessingStyle) => {
    if (!canvas) return;
    
    const style = styleOverride || 'natural';
    setIsProcessing(true);
    setCurrentPhoto(photo);
    setPreviewId(photo.id);
    setSelectedStyle(style);

    try {
      await setCanvasBackground(canvas, photo.url, { 
        dimming: dimming / 100,
        slideType,
        mood: selectedMood || 'dark-minimal',
        style,
        metadata: {
          id: photo.id,
          photographer: photo.photographer,
          photographerUrl: photo.photographerUrl,
          source: photo.source,
          sourceUrl: photo.sourceUrl
        }
      });

      // Update applied transforms from canvas data
      const bgData = (canvas as any).data?.backgroundImage;
      if (bgData?.processingApplied) {
        setAppliedTransforms(bgData.processingApplied);
      }
    } finally {
      setIsProcessing(false);
    }
    
    if (commit) {
      setCommittedId(photo.id);
      setPreviewId(null);
      onCommit();
    }
  };

  const handleStyleChange = async (style: ProcessingStyle) => {
    if (!currentPhoto) return;
    await handleSelectImage(currentPhoto, false, style);
  };

  const handleApplyPreview = () => {
    if (previewId) {
      setCommittedId(previewId);
      setPreviewId(null);
      onCommit();
    }
  };

  const handleCancelPreview = () => {
    if (canvas) {
      // Logic to restore committed background would go here
      // For now we just remove if no committed background
      if (!committedId) {
        removeCanvasBackground(canvas);
      }
      setPreviewId(null);
    }
  };

  const handleDimmingChange = (val: number) => {
    setDimming(val);
    if (canvas) {
      updateDimmingOverlay(canvas, val / 100);
    }
  };

  const handleIASelect = async (img: ScoredImage) => {
    if (!canvas) return;
    setPreviewId(img.unsplashId);
    await setCanvasBackground(canvas, img.url, { dimming: dimming / 100 });
  };

  const renderTabs = () => (
    <div className="flex border-b border-white/8">
      {(['buscar', 'mood', 'ia', 'biblioteca', 'subir'] as SubTab[]).map((tab) => (
        <button
          key={tab}
          onClick={() => {
            setActiveSubTab(tab);
            if (tab === 'mood') setSelectedMood(null);
          }}
          className={cn(
            "flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors relative",
            activeSubTab === tab ? "text-[#E0E5EB] border-b-2 border-[#E0E5EB]" : "text-[#4E576A] hover:text-[#8D95A6]"
          )}
        >
          {tab === 'ia' ? (
            <span className="flex items-center justify-center gap-0.5">
              <Sparkles className="h-2.5 w-2.5" />
              IA
            </span>
          ) : tab}
        </button>
      ))}
    </div>
  );

  const renderIA = () => {
    if (!caption) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center opacity-50">
          <Sparkles className="mb-3 h-8 w-8 text-[#462D6E]" />
          <p className="text-xs text-[#4E576A]">Genera un post primero para activar las recomendaciones de IA.</p>
        </div>
      );
    }

    return (
      <div className="relative flex flex-col" style={{ minHeight: 400 }}>
        <ImageRecommendations
          postContent={{
            caption: caption ?? '',
            platform: platform,
            angle: angle ?? 'editorial',
            post_id: postId,
          }}
          slideIndex={slideIndex}
          slideType={slideType}
          onSelect={handleIASelect}
        />
      </div>
    );
  };

  const renderBuscar = () => (
    <div className="flex flex-col gap-4 p-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#4E576A]" />
        <input
          type="text"
          value={searchQuery}
          onChange={onSearchInputChange}
          placeholder="dark minimal workspace..."
          className="w-full rounded-lg border border-white/8 bg-[#0F1317] py-2 pl-9 pr-8 text-xs text-[#E0E5EB] outline-none focus:border-[#4E576A]"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#4E576A] hover:text-[#8D95A6]"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      
      <p className="text-[10px] text-[#4E576A]">
        Busca en inglés para mejores resultados
      </p>

      {isLoading && results.length === 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-md bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {results.map((photo) => (
            <div 
              key={photo.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('noctra/editor-object', JSON.stringify({
                  type: 'image',
                  url: photo.url,
                  thumbUrl: photo.thumbUrl,
                  source: photo.source,
                  photographer: photo.photographer
                }));
              }}
              className={cn(
                "group relative aspect-square cursor-pointer overflow-hidden rounded-md border-2 transition-all",
                (previewId === photo.id || committedId === photo.id) ? "border-[#E0E5EB]" : "border-transparent"
              )}
              onClick={() => handleSelectImage(photo)}
              onDoubleClick={() => handleSelectImage(photo, true)}
            >
              <img src={photo.thumbUrl} alt="" className="h-full w-full object-cover" />
              
              {/* Source Badge */}
              <div className="absolute bottom-1.5 left-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/50 text-[9px] font-bold text-white backdrop-blur-sm">
                {photo.source === 'unsplash' ? 'U' : 'P'}
              </div>

              {/* On-Brand Score Indicator */}
              {photo.onBrandScore && photo.onBrandScore > 0.7 && (
                <div className="absolute right-1.5 top-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-green-500 shadow-lg">
                  <div className="h-1 w-1 rounded-full bg-white animate-pulse" />
                </div>
              )}

              <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex flex-col justify-end p-2">
                <span className="text-[8px] text-white/60 mb-0.5">📷 {photo.photographer}</span>
                <span className="text-[7px] text-white/40 italic truncate">via {photo.source === 'unsplash' ? 'Unsplash' : 'Pexels'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <button 
          onClick={() => handleSearch(searchQuery, page + 1)}
          className="mt-2 text-center text-[11px] font-medium text-[#8D95A6] hover:text-[#E0E5EB]"
        >
          Ver más →
        </button>
      )}
    </div>
  );

  const renderMood = () => {
    if (selectedMood) {
      const mood = MOOD_CATEGORIES.find(m => m.id === selectedMood);
      return (
        <div className="flex flex-col p-4">
          <button 
            onClick={() => setSelectedMood(null)}
            className="mb-4 flex items-center gap-2 text-[11px] font-bold text-[#4E576A] hover:text-[#E0E5EB]"
          >
            <ArrowLeft className="h-3 w-3" />
            {mood?.label}
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            {results.map((photo) => (
              <div 
                key={photo.id}
                className={cn(
                  "group relative aspect-square cursor-pointer overflow-hidden rounded-md border-2 transition-all",
                  (previewId === photo.id || committedId === photo.id) ? "border-[#E0E5EB]" : "border-transparent"
                )}
                onClick={() => handleSelectImage(photo)}
                onDoubleClick={() => handleSelectImage(photo, true)}
              >
                <img src={photo.thumbUrl} alt="" className="h-full w-full object-cover" />
                {/* Source Badge for Mood view too */}
                <div className="absolute bottom-1.5 left-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/50 text-[9px] font-bold text-white backdrop-blur-sm">
                  {photo.source === 'unsplash' ? 'U' : 'P'}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2 p-4">
        {MOOD_CATEGORIES.map((mood) => (
          <button
            key={mood.id}
            onClick={() => {
              setSelectedMood(mood.id);
              handleSearch('', 1, mood.id);
            }}
            style={{ backgroundColor: mood.color }}
            className="group relative flex h-16 w-full items-center justify-between overflow-hidden rounded-lg px-4 transition-all hover:brightness-125"
          >
            <span className="text-xl">{mood.emoji}</span>
            <span className="flex-1 px-4 text-left text-xs font-bold text-white">{mood.label}</span>
            <ChevronRight className="h-4 w-4 text-white/50 transition-transform group-hover:translate-x-1" />
          </button>
        ))}
      </div>
    );
  };

  const renderFooter = () => {
    if (!previewId) return null;

    return (
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-white/8 bg-[#0F1317] p-3 shadow-2xl">
        <button 
          onClick={handleCancelPreview}
          className="text-[11px] font-bold text-[#4E576A] hover:text-[#E0E5EB]"
        >
          Cancelar
        </button>
        <button 
          onClick={handleApplyPreview}
          className="rounded-lg bg-[#E0E5EB] px-3 py-1.5 text-[11px] font-bold text-[#101417] hover:opacity-90"
        >
          ✓ Aplicar
        </button>
      </div>
    );
  };

  return (
    <aside className="relative flex flex-col h-full overflow-hidden bg-[#101417]">
      {renderTabs()}
      
      <div className="flex-1 overflow-y-auto pb-20">
        {activeSubTab === 'buscar' && renderBuscar()}
        {activeSubTab === 'mood' && renderMood()}
        {activeSubTab === 'ia' && renderIA()}

        {/* Placeholder for other tabs */}
        {(activeSubTab === 'biblioteca' || activeSubTab === 'subir') && (
          <div className="flex h-full items-center justify-center p-8 text-center opacity-40">
            <p className="text-xs">Próximamente</p>
          </div>
        )}
      </div>

      {/* Style & Processing Controls */}
      {(previewId || committedId) && (
        <div className="border-t border-white/8 bg-[#0F1317]/50 p-4">
          {/* Style Selector */}
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-[#4E576A]">
              <span>Estilo de imagen</span>
              {isProcessing && <Loader2 className="h-3 w-3 animate-spin text-[#E0E5EB]" />}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {([
                { id: 'natural', label: 'Natural' },
                { id: 'dark-minimal', label: 'Oscuro' },
                { id: 'editorial', label: 'Editorial' },
                { id: 'monochrome', label: 'B&W' },
                { id: 'warm', label: 'Cálido' },
                { id: 'cool', label: 'Frío' }
              ] as { id: ProcessingStyle; label: string }[]).map((style) => (
                <button
                  key={style.id}
                  onClick={() => handleStyleChange(style.id)}
                  disabled={isProcessing}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-bold transition-all",
                    selectedStyle === style.id
                      ? "bg-[#E0E5EB] text-[#101417]"
                      : "bg-white/5 text-[#4E576A] hover:bg-white/10 hover:text-[#8D95A6]"
                  )}
                >
                  {style.label}
                </button>
              ))}
            </div>
            
            {selectedStyle !== 'natural' && appliedTransforms.length > 0 && (
              <p className="mt-2 text-[10px] text-[#4E576A] italic lowercase">
                {appliedTransforms.filter(t => t !== 'none').join(' · ')}
              </p>
            )}
          </div>

          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-[#4E576A]">
            <span>Oscurecer imagen</span>
            <span>{dimming}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="80" 
            step="5"
            value={dimming}
            onChange={(e) => handleDimmingChange(parseInt(e.target.value))}
            className="w-full accent-[#E0E5EB]"
          />
        </div>
      )}

      {renderFooter()}
    </aside>
  );
};
