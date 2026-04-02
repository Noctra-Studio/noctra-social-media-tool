"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Info, Loader2, X } from "lucide-react";

import type { ExportOptions } from "@/types/editor";
import { cn } from "@/lib/utils";

export type ExportDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  canvasSize: { width: number; height: number };
  networkId: string;
  formatKey: string;
  activeFilterCSS: string;
  onConfirmExport: (options: ExportOptions) => Promise<void>;
  isExporting: boolean;
};

type ExportMultiplier = ExportOptions["multiplier"];
type ExportFormat = ExportOptions["format"];

const MULTIPLIERS: ExportMultiplier[] = [2, 3, 4];

function formatDimensions(
  canvasSize: ExportDialogProps["canvasSize"],
  multiplier: ExportMultiplier
) {
  return {
    height: canvasSize.height * multiplier,
    width: canvasSize.width * multiplier,
  };
}

function getApproxSizeMB(
  canvasSize: ExportDialogProps["canvasSize"],
  multiplier: ExportMultiplier,
  format: ExportFormat,
  qualityPercent: number
) {
  const { height, width } = formatDimensions(canvasSize, multiplier);

  if (format === "png") {
    return Number(((width * height * 4) / (1024 * 1024)).toFixed(1));
  }

  const qualityRatio = qualityPercent / 100;
  return Number(
    ((width * height * 3 * qualityRatio) / (1024 * 1024 * 10)).toFixed(1)
  );
}

function OptionLabel({
  isRecommended = false,
  label,
  meta,
}: {
  isRecommended?: boolean;
  label: string;
  meta: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-neutral-400">{meta}</p>
      </div>

      {isRecommended ? (
        <span className="shrink-0 rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-200">
          Recomendado
        </span>
      ) : null}
    </div>
  );
}

function RadioCard({
  checked,
  children,
  onSelect,
}: {
  checked: boolean;
  children: ReactNode;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
        checked
          ? "border-white/30 bg-white/10"
          : "border-neutral-700 bg-neutral-950/70 hover:border-neutral-500 hover:bg-white/5"
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
          checked ? "border-white" : "border-neutral-500"
        )}
      >
        <span
          className={cn(
            "h-2 w-2 rounded-full bg-white transition-opacity",
            checked ? "opacity-100" : "opacity-0"
          )}
        />
      </span>
      {children}
    </button>
  );
}

export function ExportDialog({
  isOpen,
  ...props
}: ExportDialogProps) {
  return (
    <AnimatePresence>
      {isOpen ? <ExportDialogPanel key={`${props.networkId}-${props.formatKey}`} {...props} /> : null}
    </AnimatePresence>
  );
}

function ExportDialogPanel({
  onClose,
  canvasSize,
  networkId,
  formatKey,
  activeFilterCSS,
  onConfirmExport,
  isExporting,
}: Omit<ExportDialogProps, "isOpen">) {
  const [multiplier, setMultiplier] = useState<ExportMultiplier>(4);
  const [format, setFormat] = useState<ExportFormat>("png");
  const [jpegQuality, setJpegQuality] = useState(95);

  const handleClose = useCallback(() => {
    if (isExporting) {
      return;
    }

    onClose();
  }, [isExporting, onClose]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose]);

  const approxSizeMB = useMemo(
    () => getApproxSizeMB(canvasSize, multiplier, format, jpegQuality),
    [canvasSize, format, jpegQuality, multiplier]
  );

  const exportOptions = useMemo<ExportOptions>(
    () => ({
      activeFilterCSS,
      filename: `noctra-${networkId}-${formatKey}`,
      format,
      multiplier,
      quality: format === "jpeg" ? jpegQuality / 100 : 1,
    }),
    [activeFilterCSS, format, formatKey, jpegQuality, multiplier, networkId]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Exportar imagen"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="w-full max-w-sm rounded-2xl border border-neutral-700 bg-neutral-900 shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
          <h2 className="text-base font-semibold text-white">Exportar imagen</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isExporting}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Cerrar diálogo de exportación"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <section className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
              Calidad
            </p>
            <div className="space-y-2">
              {MULTIPLIERS.map((value) => {
                const dimensions = formatDimensions(canvasSize, value);

                return (
                  <RadioCard
                    key={value}
                    checked={multiplier === value}
                    onSelect={() => setMultiplier(value)}
                  >
                    <OptionLabel
                      label={
                        value === 2
                          ? "HD (2x)"
                          : value === 3
                            ? "3K (3x)"
                            : "UHD (4x)"
                      }
                      meta={`${dimensions.width}x${dimensions.height}px`}
                      isRecommended={value === 4}
                    />
                  </RadioCard>
                );
              })}
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
              Formato
            </p>
            <div className="space-y-2">
              <RadioCard
                checked={format === "png"}
                onSelect={() => setFormat("png")}
              >
                <OptionLabel
                  label="PNG sin pérdida"
                  meta="Ideal para máxima nitidez"
                />
              </RadioCard>

              <RadioCard
                checked={format === "jpeg"}
                onSelect={() => setFormat("jpeg")}
              >
                <OptionLabel
                  label="JPEG (comprimido)"
                  meta="Archivo más liviano"
                />
              </RadioCard>
            </div>
          </section>

          {format === "jpeg" ? (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
                  Calidad JPEG
                </p>
                <span className="text-sm font-medium text-white">
                  {jpegQuality}%
                </span>
              </div>

              <input
                type="range"
                min={70}
                max={100}
                step={1}
                value={jpegQuality}
                onChange={(event) =>
                  setJpegQuality(Number(event.target.value))
                }
                disabled={isExporting}
                className="w-full accent-white"
              />
            </section>
          ) : null}

          {activeFilterCSS !== "" ? (
            <div className="flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>El filtro activo se aplicará al exportar.</p>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-neutral-800 px-5 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isExporting}
            className="rounded-xl border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => {
              void onConfirmExport(exportOptions);
            }}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Descargar — {approxSizeMB}MB aprox.
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
