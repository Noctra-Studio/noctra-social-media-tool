"use client";

import { useCallback, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AtSign,
  Briefcase,
  Camera,
  Download,
  Loader2,
  X,
} from "lucide-react";

import { InstagramShell } from "@/components/editor/network-shell/instagram-shell";
import { LinkedInShell } from "@/components/editor/network-shell/linkedin-shell";
import { XShell } from "@/components/editor/network-shell/x-shell";
import { getExportDimensions, UHD_PRESET } from "@/lib/editor/export-utils";
import { NETWORK_CONFIGS } from "@/lib/editor/network-configs";
import { cn } from "@/lib/utils";

export type PreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  networkId: "instagram" | "x" | "linkedin";
  format: string;
  canvasDataURL: string;
  activeFilterCSS: string;
  onExport: () => Promise<void>;
  isExporting: boolean;
  username?: string;
  displayName?: string;
  handle?: string;
  postText?: string;
  caption?: string;
};

type BadgeConfig = {
  icon: typeof Camera;
  label: string;
  className: string;
};

function normalizeHandle(handle?: string) {
  const normalized = handle?.trim().replace(/^@/, "");
  return normalized && normalized.length > 0 ? normalized : "noctra";
}

function resolveInstagramFormat(format: string) {
  if (
    format === "feed_square" ||
    format === "feed_portrait" ||
    format === "story" ||
    format === "carousel_slide"
  ) {
    return format;
  }

  return "feed_square";
}

function resolveXFormat(format: string) {
  return format === "thread_card" ? "thread_card" : "single_image";
}

function resolveLinkedInFormat(format: string) {
  if (format === "portrait" || format === "document_cover") {
    return format;
  }

  return "single_image";
}

function getBadgeConfig(networkId: PreviewModalProps["networkId"]): BadgeConfig {
  switch (networkId) {
    case "instagram":
      return {
        icon: Camera,
        label: "Instagram",
        className: "border-pink-400/20 bg-pink-500/10 text-pink-100",
      };
    case "x":
      return {
        icon: AtSign,
        label: "X",
        className: "border-white/15 bg-white/10 text-white",
      };
    case "linkedin":
      return {
        icon: Briefcase,
        label: "LinkedIn",
        className: "border-sky-400/20 bg-sky-500/10 text-sky-100",
      };
  }
}

function getPreviewConfig(
  networkId: PreviewModalProps["networkId"],
  format: string
) {
  switch (networkId) {
    case "instagram": {
      const resolvedFormat = resolveInstagramFormat(format);
      return {
        exportSize: NETWORK_CONFIGS.instagram[resolvedFormat].export,
        maxWidthClassName:
          resolvedFormat === "story" ? "max-w-[250px]" : "max-w-[400px]",
        resolvedFormat,
      };
    }
    case "x": {
      const resolvedFormat = resolveXFormat(format);
      return {
        exportSize: NETWORK_CONFIGS.x[resolvedFormat].export,
        maxWidthClassName: "max-w-[400px]",
        resolvedFormat,
      };
    }
    case "linkedin": {
      const resolvedFormat = resolveLinkedInFormat(format);
      return {
        exportSize: NETWORK_CONFIGS.linkedin[resolvedFormat].export,
        maxWidthClassName:
          resolvedFormat === "portrait" ? "max-w-[320px]" : "max-w-[400px]",
        resolvedFormat,
      };
    }
  }
}

export function PreviewModal({
  isOpen,
  onClose,
  networkId,
  format,
  canvasDataURL,
  activeFilterCSS,
  onExport,
  isExporting,
  username,
  displayName,
  handle,
  postText,
  caption,
}: PreviewModalProps) {
  const badge = useMemo(() => getBadgeConfig(networkId), [networkId]);
  const previewConfig = useMemo(
    () => getPreviewConfig(networkId, format),
    [format, networkId]
  );
  const exportDimensions = useMemo(
    () => getExportDimensions(previewConfig.exportSize, UHD_PRESET.multiplier),
    [previewConfig.exportSize]
  );

  const handleClose = useCallback(() => {
    if (isExporting) {
      return;
    }

    onClose();
  }, [isExporting, onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose, isOpen]);

  const previewImage = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={canvasDataURL}
      alt="Vista previa del post"
      className="h-full w-full object-cover"
      style={{ filter: activeFilterCSS || "none" }}
    />
  );

  const renderShell = () => {
    switch (networkId) {
      case "instagram": {
        const instagramFormat = resolveInstagramFormat(format);
        return (
          <InstagramShell
            format={instagramFormat}
            username={username?.trim() || "noctra.studio"}
            caption={caption || postText}
          >
            {previewImage}
          </InstagramShell>
        );
      }
      case "x": {
        const xFormat = resolveXFormat(format);
        return (
          <XShell
            format={xFormat}
            displayName={displayName?.trim() || "Noctra Studio"}
            handle={normalizeHandle(handle) || "noctra_studio"}
            tweetText={postText || caption}
          >
            {previewImage}
          </XShell>
        );
      }
      case "linkedin": {
        const linkedInFormat = resolveLinkedInFormat(format);
        return (
          <LinkedInShell
            format={linkedInFormat}
            fullName={displayName?.trim() || "Noctra Studio"}
            jobTitle={handle?.trim() || "social.noctra.studio"}
            postText={postText || caption}
          >
            {previewImage}
          </LinkedInShell>
        );
      }
    }
  };

  const BadgeIcon = badge.icon;

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm sm:p-6"
          onClick={handleClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Vista previa inmersiva"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative flex max-h-[95vh] w-full max-w-[540px] flex-col overflow-y-auto rounded-[32px] border border-white/10 bg-[#0d1014] shadow-[0_32px_80px_rgba(0,0,0,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/8 bg-[#0d1014]/95 px-5 py-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                    badge.className
                  )}
                >
                  <BadgeIcon className="h-3.5 w-3.5" />
                  {badge.label}
                </span>
                <span className="text-sm text-neutral-400">Vista previa</span>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={isExporting}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Cerrar vista previa"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex min-h-0 items-center justify-center px-5 py-6 sm:px-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={cn("mx-auto w-full", previewConfig.maxWidthClassName)}
              >
                {renderShell()}
              </motion.div>
            </div>

            <div className="flex flex-col items-center gap-3 border-t border-white/8 px-5 py-5 text-center sm:px-6">
              <p className="text-xs text-neutral-500">
                Se exportara como PNG · {exportDimensions.width}x
                {exportDimensions.height}px · UHD (4x)
              </p>

              <div className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isExporting}
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[170px]"
                >
                  Seguir editando
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void onExport();
                  }}
                  disabled={isExporting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#101417] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[170px]"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Exportar UHD
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
