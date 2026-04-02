"use client";

import type { ReactNode } from "react";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type InstagramShellProps = {
  format: "feed_square" | "feed_portrait" | "story" | "carousel_slide";
  username: string;
  caption?: string;
  slideCount?: number;
  currentSlide?: number;
  onSlideChange?: (index: number) => void;
  children: ReactNode;
  className?: string;
};

const CANVAS_ASPECT_CLASS: Record<InstagramShellProps["format"], string> = {
  feed_square: "aspect-square",
  feed_portrait: "aspect-[4/5]",
  story: "aspect-[9/16]",
  carousel_slide: "aspect-square",
};

function getInitial(username: string) {
  return username.trim().charAt(0).toUpperCase() || "N";
}

function truncateCaption(caption?: string) {
  if (!caption) {
    return null;
  }

  const normalized = caption.replace(/\s+/g, " ").trim();
  const clipped = normalized.slice(0, 120).trim();
  const isTruncated = normalized.length > 120;

  return {
    text: clipped,
    isTruncated,
  };
}

function clampIndex(index: number, total: number) {
  return Math.min(Math.max(index, 0), Math.max(total - 1, 0));
}

function StoryProgress({
  activeIndex,
  segmentCount,
}: {
  activeIndex: number;
  segmentCount: number;
}) {
  return (
    <div className="pointer-events-none flex w-full gap-1.5 px-3 pt-3">
      {Array.from({ length: segmentCount }).map((_, index) => {
        const isComplete = index < activeIndex;
        const isActive = index === activeIndex;

        return (
          <div
            key={`story-progress-${index}`}
            className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/25"
          >
            {isComplete ? <div className="h-full w-full rounded-full bg-white/95" /> : null}
            {isActive ? <div className="instagram-shell-story-progress h-full rounded-full bg-white/95" /> : null}
          </div>
        );
      })}
    </div>
  );
}

function Avatar({ username, size = "md" }: { username: string; size?: "sm" | "md" }) {
  const outerSize = size === "sm" ? "h-9 w-9" : "h-8 w-8";
  const innerSize = size === "sm" ? "h-[30px] w-[30px]" : "h-[26px] w-[26px]";
  const textSize = size === "sm" ? "text-xs" : "text-[11px]";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[1.5px]",
        outerSize
      )}
      aria-hidden="true"
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-white font-semibold uppercase text-[#111827] dark:bg-[#0f1115] dark:text-white",
          innerSize,
          textSize
        )}
      >
        {getInitial(username)}
      </div>
    </div>
  );
}

export function InstagramShell({
  format,
  username,
  caption,
  slideCount,
  currentSlide = 0,
  onSlideChange,
  children,
  className,
}: InstagramShellProps) {
  const captionPreview = truncateCaption(caption);
  const isStory = format === "story";
  const isCarousel = format === "carousel_slide";
  const safeSlideCount = Math.max(1, slideCount ?? (isStory ? 4 : 1));
  const activeSlide = clampIndex(currentSlide, safeSlideCount);
  const canGoPrevious = activeSlide > 0;
  const canGoNext = activeSlide < safeSlideCount - 1;

  const handleSlideChange = (nextIndex: number) => {
    if (!onSlideChange) {
      return;
    }

    const clamped = clampIndex(nextIndex, safeSlideCount);

    if (clamped !== activeSlide) {
      onSlideChange(clamped);
    }
  };

  return (
    <div
      className={cn(
        "group relative w-full overflow-hidden rounded-[28px] border border-black/10 bg-white text-[#111827] shadow-[0_22px_60px_rgba(15,23,42,0.10)] dark:border-white/10 dark:bg-[#0f1115] dark:text-white",
        className
      )}
      style={{
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {isStory ? (
        <div className="relative flex flex-col">
          <StoryProgress activeIndex={activeSlide} segmentCount={safeSlideCount} />

          <div className="pointer-events-none flex items-center gap-3 px-3 pb-3 pt-2 text-white">
            <Avatar username={username} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold">{username}</span>
                <span className="text-xs text-white/70">Hace 3 h</span>
              </div>
            </div>
            <X className="h-5 w-5 text-white/90" aria-hidden="true" />
          </div>
        </div>
      ) : (
        <div className="pointer-events-none flex items-center gap-3 px-4 py-3">
          <Avatar username={username} />
          <span className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-white">
            {username}
          </span>
          <MoreHorizontal className="ml-auto h-5 w-5 text-gray-700 dark:text-gray-200" aria-hidden="true" />
        </div>
      )}

      <div className={cn("relative overflow-hidden bg-[#f5f5f5] dark:bg-black", CANVAS_ASPECT_CLASS[format])}>
        <div className="h-full w-full">{children}</div>

        {isCarousel && safeSlideCount > 1 ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-3">
            <button
              type="button"
              aria-label="Slide anterior"
              disabled={!canGoPrevious}
              className={cn(
                "pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur-sm transition-all duration-200",
                "opacity-0 group-hover:opacity-100",
                "disabled:cursor-not-allowed disabled:opacity-0"
              )}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => handleSlideChange(activeSlide - 1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              aria-label="Siguiente slide"
              disabled={!canGoNext}
              className={cn(
                "pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur-sm transition-all duration-200",
                "opacity-0 group-hover:opacity-100",
                "disabled:cursor-not-allowed disabled:opacity-0"
              )}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => handleSlideChange(activeSlide + 1)}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        ) : null}
      </div>

      {isCarousel && safeSlideCount > 1 ? (
        <div className="pointer-events-none flex items-center justify-center gap-1.5 px-4 py-3">
          {Array.from({ length: safeSlideCount }).map((_, index) => (
            <span
              key={`pagination-${index}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-200",
                index === activeSlide
                  ? "w-4 bg-[#0095f6]"
                  : "w-1.5 bg-gray-300 dark:bg-white/25"
              )}
            />
          ))}
        </div>
      ) : null}

      {!isStory ? (
        <div className="pointer-events-none">
          <div className="flex items-center gap-4 px-4 py-2">
            <Heart className="h-6 w-6 text-gray-800 dark:text-gray-100" aria-hidden="true" />
            <MessageCircle className="h-6 w-6 text-gray-800 dark:text-gray-100" aria-hidden="true" />
            <Send className="h-6 w-6 text-gray-800 dark:text-gray-100" aria-hidden="true" />
            <Bookmark className="ml-auto h-6 w-6 text-gray-800 dark:text-gray-100" aria-hidden="true" />
          </div>

          <div className="px-4 pb-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">1,247 Me gusta</p>
          </div>

          {captionPreview ? (
            <div className="px-4 pb-2 text-sm leading-5 text-gray-800 dark:text-gray-200">
              <span className="font-semibold text-gray-900 dark:text-white">{username} </span>
              <span>{captionPreview.text}</span>
              {captionPreview.isTruncated ? (
                <span className="ml-1 text-gray-500 dark:text-gray-400">...más</span>
              ) : null}
            </div>
          ) : null}

          <div className="px-4 pb-3 text-[11px] uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
            HACE 2 HORAS
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .instagram-shell-story-progress {
          animation: instagram-shell-progress 5s linear infinite;
          transform-origin: left center;
        }

        @keyframes instagram-shell-progress {
          0% {
            transform: scaleX(0);
          }

          100% {
            transform: scaleX(1);
          }
        }
      `}</style>
    </div>
  );
}
