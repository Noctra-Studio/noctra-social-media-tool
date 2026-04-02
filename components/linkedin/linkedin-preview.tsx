"use client";

import React from 'react';
import { MoreHorizontal, Globe, ThumbsUp, MessageSquare, Repeat2, Send, Layout } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LinkedInCarouselSlide } from '@/lib/social-content';

interface LinkedInPostPreviewProps {
  content: string;
  hashtags?: string[];
  authorName?: string;
  authorTitle?: string;
  authorAvatar?: string;
  publishedAt?: string;
  format?: 'text' | 'image' | 'document' | 'carousel';
  image?: string;
  slides?: LinkedInCarouselSlide[];
}


export function LinkedInPostPreview({
  content,
  hashtags = [],
  authorName = "Noctra Studio",
  authorTitle = "Estrategia e Inteligencia de Contenido",
  authorAvatar,
  publishedAt = "ahora",
  format = 'text',
  image,
  slides = []
}: LinkedInPostPreviewProps) {
  const isDocument = format === 'document' || format === 'carousel';

  return (
    <div className="w-full max-w-[552px] animate-in fade-in zoom-in-95 duration-300 rounded-xl border border-[#D0D7DE] bg-white text-black shadow-sm overflow-hidden font-sans">

      {/* Header */}
      <div className="p-3 pb-0 flex items-start justify-between">
        <div className="flex gap-2">
          <div className="h-12 w-12 rounded-full bg-zinc-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {authorAvatar ? (
              <img src={authorAvatar} alt={authorName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-zinc-500">{authorName.charAt(0)}</span>
            )}
          </div>
          <div className="flex flex-col">
            <h4 className="text-sm font-semibold text-[#000000e6] hover:text-[#0a66c2] hover:underline cursor-pointer leading-tight">
              {authorName}
            </h4>
            <p className="text-[12px] text-[#00000099] leading-tight mt-0.5">
              {authorTitle}
            </p>
            <div className="flex items-center gap-1 text-[12px] text-[#00000099] mt-0.5">
              <span>{publishedAt}</span>
              <span>•</span>
              <Globe className="h-3 w-3" />
            </div>
          </div>
        </div>
        <button className="text-[#00000099] hover:bg-black/5 p-1 rounded-full transition-colors">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="px-3 pt-3 pb-2">
        <div className="text-sm text-[#000000e6] whitespace-pre-wrap leading-relaxed">
          {content}
        </div>
        {hashtags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {hashtags.map((tag) => (
              <span key={tag} className="text-sm font-semibold text-[#0a66c2] hover:underline cursor-pointer">
                {tag.startsWith('#') ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Optional Media */}
      {(image || format === 'image') && !isDocument && (
        <div className="mt-2 aspect-video w-full bg-zinc-100 flex items-center justify-center border-y border-[#D0D7DE]">
          {image ? (
            <img src={image} alt="Post content" className="h-full w-full object-cover" />
          ) : (
            <div className="text-zinc-400 text-xs font-medium">Visualización de imagen</div>
          )}
        </div>
      )}

      {/* LinkedIn Document Preview (Mock) */}
      {isDocument && (
        <div className="mt-2 px-3 pb-2">
          <div className="aspect-[4/5] w-full bg-[#101417] rounded-sm border border-[#D0D7DE] shadow-sm overflow-hidden relative flex flex-col p-8 group">
            {slides.length > 0 ? (
              <div className="flex flex-col h-full justify-between">
                <div className="space-y-4">
                  <div className="h-0.5 w-12 bg-[#462D6E]" />
                  <h3 className="text-2xl font-bold text-[#E0E5EB] leading-tight font-display">
                    {slides[0].headline || slides[0].title || "Titular del slide"}
                  </h3>
                  <p className="text-sm text-[#8D95A6] leading-relaxed">
                    {slides[0].content || slides[0].message || slides[0].subtitle || "Contenido del slide..."}
                  </p>
                </div>

                <div className="flex justify-between items-center text-[10px] text-zinc-500 font-medium pb-8">
                  <span>noctra.studio</span>
                  <div className="h-6 w-6 rounded bg-white/5 flex items-center justify-center text-white/40 font-display">◐</div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-500">
                <Layout className="h-8 w-8 opacity-20" />
                <span className="text-xs">Vista previa del carrusel</span>
              </div>
            )}
            
            {/* Document Footer UI */}
            <div className="absolute bottom-0 inset-x-0 h-10 bg-white/10 backdrop-blur-sm flex items-center justify-between px-4 border-t border-white/10">
              <span className="text-[10px] text-white/60">1 / {slides.length || 5}</span>
              <div className="flex gap-1">
                 <button className="h-5 w-5 rounded-full bg-black/40 flex items-center justify-center text-white/40 hover:bg-black/60">←</button>
                 <button className="h-5 w-5 rounded-full bg-black/40 flex items-center justify-center text-white/40 hover:bg-black/60">→</button>
              </div>
            </div>
          </div>
          <div className="py-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#000000e6]">Documento de estrategia</span>
            <span className="text-[10px] text-[#00000099] uppercase tracking-wider">{slides.length || 5} páginas</span>
          </div>
        </div>
      )}


      {/* Interaction Bar */}
      <div className="px-3 py-2 flex items-center justify-between border-t border-[#f3f3f3] mt-2">
        <div className="flex items-center">
          <div className="flex -space-x-1 items-center">
            <div className="h-4 w-4 rounded-full bg-[#0a66c2] flex items-center justify-center ring-1 ring-white z-20">
              <ThumbsUp className="h-2 w-2 text-white fill-white" />
            </div>
            <div className="h-4 w-4 rounded-full bg-[#566b21] flex items-center justify-center ring-1 ring-white z-10">
              <div className="text-[8px]">👏</div>
            </div>
          </div>
          <span className="text-[12px] text-[#00000099] ml-1.5 hover:text-[#0a66c2] hover:underline cursor-pointer">
            142 reacciones
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-[#00000099] hover:text-[#0a66c2] hover:underline cursor-pointer">
          <span>8 comentarios</span>
          <span>•</span>
          <span>4 veces compartido</span>
        </div>
      </div>

      <div className="px-1 py-1 flex items-center justify-between border-t border-[#f3f3f3]">
        <button className="flex-1 flex flex-col items-center justify-center gap-1 py-1 text-[#00000099] font-medium text-[11px] hover:bg-black/5 rounded transition-colors group">
          <ThumbsUp className="h-[20px] w-[20px] group-hover:scale-110 transition-transform" />
          <span>Recomendar</span>
        </button>
        <button className="flex-1 flex flex-col items-center justify-center gap-1 py-1 text-[#00000099] font-medium text-[11px] hover:bg-black/5 rounded transition-colors group">
          <MessageSquare className="h-[20px] w-[20px] group-hover:scale-110 transition-transform" />
          <span>Comentar</span>
        </button>
        <button className="flex-1 flex flex-col items-center justify-center gap-1 py-1 text-[#00000099] font-medium text-[11px] hover:bg-black/5 rounded transition-colors group">
          <Repeat2 className="h-[20px] w-[20px] group-hover:scale-110 transition-transform" />
          <span>Compartir</span>
        </button>
        <button className="flex-1 flex flex-col items-center justify-center gap-1 py-1 text-[#00000099] font-medium text-[11px] hover:bg-black/5 rounded transition-colors group">
          <Send className="h-[20px] w-[20px] group-hover:scale-110 transition-transform" />
          <span>Enviar</span>
        </button>
      </div>

    </div>
  );
}
