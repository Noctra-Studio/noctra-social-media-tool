"use client";

import {
  BarChart2,
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { XShellProps } from "./shell-types";

const CANVAS_ASPECT_CLASS: Record<XShellProps["format"], string> = {
  single_image: "aspect-[16/9]",
  thread_card: "aspect-[16/9]",
};

function normalizeTweetText(tweetText?: string) {
  if (!tweetText) {
    return null;
  }

  const normalized = tweetText.replace(/\s+/g, " ").trim().slice(0, 280);

  if (!normalized) {
    return null;
  }

  return normalized;
}

export function XShell({
  format,
  displayName,
  handle,
  tweetText,
  children,
  className,
}: XShellProps) {
  const tweetPreview = normalizeTweetText(tweetText);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-[28px] border border-white/10 bg-black text-white shadow-[0_24px_60px_rgba(0,0,0,0.45)]",
        className,
      )}
      style={{
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div className="pointer-events-none relative flex items-start gap-3 px-4 py-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-neutral-700" aria-hidden="true" />

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5 pr-8 text-[15px] leading-5">
            <span className="truncate font-bold text-white">{displayName}</span>
            <span className="truncate text-neutral-500">@{handle}</span>
            <span className="shrink-0 text-neutral-500">· 2h</span>
          </div>

          {tweetPreview ? (
            <p
              className="mt-1 text-[15px] leading-5 text-white"
              style={{
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 3,
                overflow: "hidden",
              }}
            >
              {tweetPreview}
            </p>
          ) : null}
        </div>

        <MoreHorizontal
          className="absolute right-3 top-3 h-5 w-5 text-neutral-500"
          aria-hidden="true"
        />
      </div>

      <div className={cn("overflow-hidden rounded-2xl bg-black", CANVAS_ASPECT_CLASS[format])}>
        <div className="h-full w-full">{children}</div>
      </div>

      <div className="pointer-events-none flex items-center justify-between px-4 py-3 text-neutral-500">
        <div className="flex items-center gap-5 text-[13px]">
          <div className="flex items-center gap-1.5">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span>47</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Repeat2 className="h-4 w-4" aria-hidden="true" />
            <span>12</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Heart className="h-4 w-4" aria-hidden="true" />
            <span>892</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BarChart2 className="h-4 w-4" aria-hidden="true" />
            <span>2.3K</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Bookmark className="h-4 w-4" aria-hidden="true" />
          <Share2 className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
