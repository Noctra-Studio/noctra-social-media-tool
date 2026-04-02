"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedPreviewProps {
  slides: any[];
  activeSlideIndex: number;
  onNavigate: (index: number) => void;
  currentSlideImage: string | null;
  caption?: string;
  hashtags?: string[];
  aspectRatio?: '1:1' | '4:5';
  isUpdating?: boolean;
}

export function FeedPreview({
  slides,
  activeSlideIndex,
  onNavigate,
  currentSlideImage,
  caption = '',
  hashtags = [],
  aspectRatio = '1:1',
  isUpdating = false,
}: FeedPreviewProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Load theme preference
  useEffect(() => {
    const saved = localStorage.getItem('noctra-feed-preview-theme');
    if (saved) {
      setIsDarkMode(saved === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('noctra-feed-preview-theme', newTheme ? 'dark' : 'light');
  };

  const truncatedCaption = useMemo(() => {
    if (expanded || caption.length <= 125) return caption;
    return caption.slice(0, 125);
  }, [caption, expanded]);

  // Mock engagement data (consistent per session/post)
  const mockLikes = useMemo(() => Math.floor(Math.random() * (2500 - 800) + 800), []);
  const mockComments = useMemo(() => Math.floor(Math.random() * (80 - 20) + 20), []);

  return (
    <div className={cn(
      "flex flex-col h-full overflow-hidden transition-colors duration-300",
      isDarkMode ? "bg-[#000000] text-white" : "bg-white text-black"
    )}>
      {/* Toolbar */}
      <div className={cn(
        "flex items-center justify-between px-4 py-2 border-b",
        isDarkMode ? "border-white/10" : "border-black/5"
      )}>
        <span className="text-[11px] font-semibold uppercase tracking-wider opacity-60">
          Vista Previa
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#462D6E]/20 text-[#462D6E] font-medium">
            ✨ Mockup
          </span>
          <button 
            onClick={toggleTheme}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Phone Screen Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center custom-scrollbar">
        {/* Placeholder Post Above */}
        <div className="w-full max-w-[293px] mb-8 opacity-40 grayscale pointer-events-none">
          <PlaceholderPost isDarkMode={isDarkMode} />
        </div>

        {/* Target Instagram Post */}
        <div className={cn(
          "w-full max-w-[293px] border border-black/5 rounded-sm overflow-hidden shadow-2xl relative",
          isDarkMode ? "bg-black border-white/10" : "bg-white"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#101417] flex items-center justify-center border border-white/10 p-1.5">
                <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                  <path d="M19.6 4.4C13.7 4.4 8.9 9.2 8.9 15.1c0 5.9 4.8 10.7 10.7 10.7 2.8 0 5.3-1 7.2-2.8-1.4.5-2.9.7-4.4.7-7 0-12.7-5.7-12.7-12.7 0-2 .5-4 1.4-5.7 1.5-.6 3-.9 4.5-.9 2.1 0 4 .5 5.9 1.4-.6-.9-1.2-1.5-1.9-2.2-.1-.1-.2-.2-.5-.2-.3-.2-.8-.3-1.5-.3Z" fill="white" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold leading-none">noctra.studio</span>
                <span className="text-[11px] opacity-60 leading-tight">Patrocinado</span>
              </div>
            </div>
            <MoreHorizontal className="w-5 h-5 opacity-60" />
          </div>

          {/* Slide Image Viewer */}
          <div className={cn(
            "relative w-full overflow-hidden bg-zinc-900 flex items-center justify-center",
            aspectRatio === '1:1' ? "aspect-square" : "aspect-[4/5]"
          )}>
            {currentSlideImage ? (
              <img 
                src={currentSlideImage} 
                alt="Feed preview" 
                className={cn(
                  "w-full h-full object-contain transition-opacity duration-300",
                  isUpdating ? "opacity-60" : "opacity-100"
                )}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-white/20">
                <div className="w-8 h-8 animate-spin rounded-full border-2 border-t-transparent border-white/20" />
                <span className="text-[10px] uppercase tracking-widest">Generando vista</span>
              </div>
            )}

            {/* Navigation Arrows */}
            {slides.length > 1 && (
              <>
                {activeSlideIndex > 0 && (
                  <button 
                    onClick={() => onNavigate(activeSlideIndex - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                {activeSlideIndex < slides.length - 1 && (
                  <button 
                    onClick={() => onNavigate(activeSlideIndex + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </>
            )}

            {/* Slide Counter */}
            {slides.length > 1 && (
              <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium">
                {activeSlideIndex + 1}/{slides.length}
              </div>
            )}

            {/* Updating Indicator */}
            {isUpdating && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-[9px] font-medium animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-[#462D6E]" />
                Actualizando...
              </div>
            )}
          </div>

          {/* Progress Dots */}
          {slides.length > 1 && (
            <div className="flex items-center justify-center gap-[3px] py-3">
              {slides.map((_, i) => (
                <div 
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-300",
                    i === activeSlideIndex 
                      ? "bg-[#0095F6] scale-110" 
                      : (isDarkMode ? "bg-white/20" : "bg-black/10")
                  )}
                />
              ))}
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between px-3 pb-1">
            <div className="flex items-center gap-3.5">
              <Heart className="w-6 h-6 stroke-[1.5] text-[#8e8e8e] hover:text-red-500 transition-colors" />
              <MessageCircle className="w-6 h-6 stroke-[1.5] text-[#8e8e8e]" />
              <Send className="w-6 h-6 stroke-[1.5] text-[#8e8e8e]" />
            </div>
            <Bookmark className="w-6 h-6 stroke-[1.5] text-[#8e8e8e]" />
          </div>

          {/* Engagement & Content */}
          <div className="px-3 py-2 flex flex-col gap-1">
            <span className="text-[13px] font-bold">
              {mockLikes.toLocaleString()} Me gusta
            </span>
            
            <div className="text-[13px] leading-snug">
              <span className="font-bold mr-1.5">noctra.studio</span>
              <span>{truncatedCaption}</span>
              {caption.length > 125 && !expanded && (
                <button 
                  onClick={() => setExpanded(true)}
                  className="text-zinc-500 ml-1"
                >
                  ... más
                </button>
              )}
            </div>

            {/* Hashtags */}
            <div className="flex flex-wrap gap-1 mt-1">
              {hashtags.slice(0, 3).map((tag, i) => (
                <span key={i} className="text-[13px] text-[#0095f6]">
                  #{tag.replace(/^#/, '')}
                </span>
              ))}
            </div>

            <button className="text-[13px] opacity-60 mt-0.5 text-left">
              Ver los {mockComments} comentarios
            </button>

            <span className="text-[10px] opacity-40 uppercase tracking-tighter mt-1">
              HACE 2 HORAS
            </span>
          </div>

          {/* Like CTA Overlay-style at bottom */}
          <div className={cn(
            "mt-1 p-2.5 border-t flex items-center gap-2",
            isDarkMode ? "border-white/10" : "border-black/5"
          )}>
            <Heart className="w-4 h-4 opacity-40" />
            <span className="text-[13px] opacity-40">Me gusta</span>
          </div>
        </div>

        {/* Placeholder Post Below */}
        <div className="w-full max-w-[293px] mt-8 opacity-40 grayscale pointer-events-none">
          <PlaceholderPost isDarkMode={isDarkMode} />
        </div>
      </div>
    </div>
  );
}

function PlaceholderPost({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div className={cn(
      "border rounded-sm overflow-hidden",
      isDarkMode ? "bg-zinc-900 border-white/5" : "bg-zinc-50 border-black/5"
    )}>
      <div className="flex items-center gap-2 p-2">
        <div className="w-6 h-6 rounded-full bg-zinc-200/50" />
        <div className="h-2 w-20 rounded bg-zinc-200/50" />
      </div>
      <div className="aspect-square bg-zinc-200/30" />
      <div className="p-2 space-y-2">
        <div className="h-2 w-3/4 rounded bg-zinc-200/50" />
        <div className="h-2 w-1/2 rounded bg-zinc-200/50" />
      </div>
    </div>
  );
}
