"use client";

import {
  Globe,
  MessageSquare,
  MoreHorizontal,
  Repeat2,
  Send,
  ThumbsUp,
  UserPlus2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LinkedInShellProps } from "./shell-types";

const CANVAS_ASPECT_CLASS: Record<LinkedInShellProps["format"], string> = {
  single_image: "aspect-[1.91/1]",
  portrait: "aspect-[4/5]",
  document_cover: "aspect-[1.78/1]",
};

function getInitial(fullName: string) {
  return fullName.trim().charAt(0).toUpperCase() || "N";
}

function getPostPreview(postText?: string) {
  if (!postText) {
    return null;
  }

  const normalized = postText.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return null;
  }

  const clipped = normalized.slice(0, 180).trim();
  const isTruncated = normalized.length > clipped.length;

  return {
    text: clipped,
    isTruncated,
  };
}

function FooterAction({
  icon: Icon,
  label,
}: {
  icon: typeof ThumbsUp;
  label: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] text-gray-500">
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </div>
  );
}

export function LinkedInShell({
  format,
  fullName,
  jobTitle,
  postText,
  children,
  className,
}: LinkedInShellProps) {
  const postPreview = getPostPreview(postText);

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-[28px] border border-black/8 bg-[#f3f2ef] shadow-[0_24px_60px_rgba(15,23,42,0.10)]",
        className,
      )}
      style={{
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div className="overflow-hidden rounded-[28px] bg-white text-gray-900">
        <div className="pointer-events-none flex items-center gap-3 px-4 py-3">
          <div className="relative h-12 w-12 shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-base font-semibold text-blue-700">
              {getInitial(fullName)}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-[#0a66c2] text-white">
              <UserPlus2 className="h-2.5 w-2.5" aria-hidden="true" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-gray-900">{fullName}</p>
            {jobTitle ? (
              <p className="truncate text-[12px] text-gray-500">{jobTitle}</p>
            ) : null}
            <div className="mt-0.5 flex items-center gap-1 text-[12px] text-gray-400">
              <span>1er • 2h •</span>
              <Globe className="h-3 w-3" aria-hidden="true" />
            </div>
          </div>

          <MoreHorizontal className="h-5 w-5 text-gray-400" aria-hidden="true" />
          <X className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>

        {postPreview ? (
          <div className="pointer-events-none px-4 pb-2 text-[14px] leading-5 text-gray-700">
            <span>{postPreview.text}</span>
            {postPreview.isTruncated ? (
              <span className="ml-1 font-medium text-[#0a66c2]">...ver más</span>
            ) : null}
          </div>
        ) : null}

        <div className={cn("overflow-hidden bg-white", CANVAS_ASPECT_CLASS[format])}>
          <div className="h-full w-full">{children}</div>
        </div>

        <div className="pointer-events-none flex items-center justify-between px-4 py-2 text-[12px] text-gray-500">
          <span>👍 ❤️ 💡 847 reacciones</span>
          <span>124 comentarios</span>
        </div>

        <div className="pointer-events-none flex items-center justify-between px-2 pb-2 pt-1">
          <FooterAction icon={ThumbsUp} label="Recomendar" />
          <FooterAction icon={MessageSquare} label="Comentar" />
          <FooterAction icon={Repeat2} label="Difundir" />
          <FooterAction icon={Send} label="Enviar" />
        </div>
      </div>
    </div>
  );
}
