"use client";

import React from 'react';
import { MessageCircle, Repeat2, Heart, BarChart2, Share, MoreHorizontal, Bookmark, CheckCircle2 } from 'lucide-react';

import { cn } from '@/lib/utils';

interface XPostPreviewProps {
  content: string;
  authorName?: string;
  authorHandle?: string;
  authorAvatar?: string;
  mediaUrl?: string;
  publishedAt?: string;
  isThread?: boolean;
  threadIndex?: number;
  totalInThread?: number;
  isVerified?: boolean;
  views?: string;
  isMember?: boolean;
}

export function XPostPreview({
  content,
  authorName = "Noctra Studio",
  authorHandle = "noctrastudio",
  authorAvatar,
  mediaUrl,
  publishedAt = "1m",
  isThread = false,
  threadIndex = 1,
  totalInThread = 1,
  isVerified = true,
  views = "1.9M",
  isMember = false
}: XPostPreviewProps) {
  const isFirstInThread = isThread && threadIndex === 1;
  const isLastInThread = isThread && threadIndex === totalInThread;
  const isMiddleInThread = isThread && !isFirstInThread && !isLastInThread;

  return (
    <div className={cn(
      "w-full max-w-[552px] animate-in fade-in zoom-in-95 duration-300 bg-black text-white font-sans border-x border-zinc-800",
      !isThread && "border-y border-zinc-800 rounded-xl overflow-hidden shadow-sm",
      isFirstInThread && "border-t border-zinc-800 rounded-t-xl",
      isLastInThread && "border-b border-zinc-800 rounded-b-xl pb-4",
      isMiddleInThread && "pb-4"
    )}>
      <div className="flex px-4 pt-3 gap-3">
        {/* Avatar & Thread Line */}
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {authorAvatar ? (
              <img src={authorAvatar} alt={authorName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-zinc-500">{authorName.charAt(0)}</span>
            )}
          </div>
          {isThread && !isLastInThread && (
            <div className="mt-1 flex-1 w-0.5 bg-zinc-800" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 min-w-0">
              <div className="flex items-center gap-0.5 truncate">
                <span className="font-bold text-[15px] hover:underline cursor-pointer">
                  {authorName}
                </span>
                {isVerified && (
                  <svg viewBox="0 0 24 24" aria-label="Verified account" className="h-[18.75px] w-[18.75px] text-[#1d9bf0] fill-current flex-shrink-0">
                    <g><path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.97-.81-3.99s-2.6-1.27-3.99-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.98-.2-4 .81s-1.27 2.6-.81 4c-1.31.67-2.19 1.91-2.19 3.34s.88 2.67 2.19 3.34c-.46 1.39-.2 2.97.81 3.99s2.6 1.27 3.99.81c.66 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.97.2 3.99-.81s1.27-2.6.81-3.99c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.35-6.2 6.78z"></path></g>
                  </svg>
                )}
              </div>
              <span className="text-zinc-500 text-[15px] truncate">
                @{authorHandle}
              </span>
              <span className="text-zinc-500 text-[15px]">·</span>
              <span className="text-zinc-500 text-[15px] hover:underline cursor-pointer">
                {publishedAt}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-white">
                <g><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.25 2.25h6.763l4.717 6.175L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"></path></g>
              </svg>
              <button className="text-zinc-500 hover:text-blue-400 hover:bg-blue-400/10 p-1 rounded-full transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          {isMember && (
            <div className="mt-1">
              <span className="bg-[#333639] text-[#eff3f4] text-[13px] font-bold px-2 py-0.5 rounded leading-normal">Member</span>
            </div>
          )}

          <button className="mt-2 text-[#1d9bf0] text-[15px] hover:underline flex items-center gap-1 group">
             <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
               <g><path d="M11 20.84l-1.42-1.42L16.17 13H2v-2h14.17l-6.59-6.58L11 3.16 19.84 12 11 20.84z"></path></g>
             </svg>
             <span className="text-zinc-500">Show translation</span>
          </button>

          <div className="mt-0.5 text-[15px] leading-normal whitespace-pre-wrap break-words">
            {content}
          </div>

          {mediaUrl ? (
            <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-800">
              <img src={mediaUrl} alt="" className="h-full w-full object-cover" />
            </div>
          ) : null}

          {/* Interaction Bar */}
           <div className="flex items-center justify-between mt-3 text-zinc-500 max-w-[425px] -ml-2">
            <button className="group flex items-center gap-1 hover:text-blue-400 transition-colors">
              <div className="group-hover:bg-blue-400/10 p-2 rounded-full transition-colors">
                <MessageCircle className="h-[18.75px] w-[18.75px]" />
              </div>
              <span className="text-[13px]">24</span>
            </button>
            <button className="group flex items-center gap-1 hover:text-green-500 transition-colors">
              <div className="group-hover:bg-green-500/10 p-2 rounded-full transition-colors">
                <Repeat2 className="h-[18.75px] w-[18.75px]" />
              </div>
              <span className="text-[13px]">15</span>
            </button>
            <button className="group flex items-center gap-1 hover:text-pink-500 transition-colors">
              <div className="group-hover:bg-pink-500/10 p-2 rounded-full transition-colors">
                <Heart className="h-[18.75px] w-[18.75px]" />
              </div>
              <span className="text-[13px]">842</span>
            </button>
            <button className="group flex items-center gap-1 hover:text-blue-400 transition-colors">
              <div className="group-hover:bg-blue-400/10 p-2 rounded-full transition-colors">
                <BarChart2 className="h-[18.75px] w-[18.75px]" />
              </div>
              <span className="text-[13px] font-bold text-white">{views}</span>
            </button>
            <div className="flex items-center gap-1">
              <button className="hover:bg-blue-400/10 p-2 rounded-full transition-colors hover:text-blue-400">
                <Bookmark className="h-[18.75px] w-[18.75px]" />
              </button>
              <button className="hover:bg-blue-400/10 p-2 rounded-full transition-colors hover:text-blue-400">
                <Share className="h-[18.75px] w-[18.75px]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
