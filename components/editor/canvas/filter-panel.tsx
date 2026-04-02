"use client";

import Image from "next/image";
import { FILTER_PRESETS } from "@/lib/editor/filter-presets";
import { cn } from "@/lib/utils";

export type FilterPanelProps = {
  activeFilterId: string;
  onFilterChange: (filterId: string, filterCSS: string) => void;
  canvasPreviewDataURL: string | null;
  className?: string;
};

export function FilterPanel({
  activeFilterId,
  onFilterChange,
  canvasPreviewDataURL,
  className,
}: FilterPanelProps) {
  const hasActiveFilter = activeFilterId !== "none";

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center justify-between px-3 pb-2">
        <h3 className="text-sm font-medium text-neutral-200">Filtros</h3>
        {hasActiveFilter ? (
          <button
            type="button"
            onClick={() => onFilterChange("none", "")}
            className="text-xs text-blue-400 transition-colors hover:text-blue-300"
          >
            Sin filtro
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-3 gap-2 p-3">
        {FILTER_PRESETS.map((preset) => {
          const isActive = preset.id === activeFilterId;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onFilterChange(preset.id, preset.css)}
              className="group flex flex-col items-center gap-1.5 rounded-xl p-1 text-center transition-transform hover:scale-105"
            >
              <div
                className={cn(
                  "relative h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-[#171B22]",
                  isActive && "border-2 border-white ring-2 ring-blue-500",
                )}
              >
                {canvasPreviewDataURL ? (
                  <Image
                    src={canvasPreviewDataURL}
                    alt={preset.label}
                    width={80}
                    height={80}
                    unoptimized
                    className="h-20 w-20 object-cover"
                    style={{ filter: preset.css || "none" }}
                  />
                ) : (
                  <div
                    className="h-full w-full bg-gradient-to-br from-[#462D6E] via-[#1B2430] to-[#0F1419]"
                    style={{ filter: preset.css || "none" }}
                    aria-hidden="true"
                  />
                )}

                {isActive ? (
                  <span className="absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[11px] font-bold text-white shadow-lg">
                    ✓
                  </span>
                ) : null}
              </div>

              <span
                className={cn(
                  "text-center text-xs text-neutral-300",
                  isActive && "font-bold text-white",
                )}
              >
                {preset.label}
              </span>
            </button>
          );
        })}
      </div>

      <p className="p-2 text-center text-xs text-neutral-500">
        El filtro se aplica al exportar. No modifica el canvas original.
      </p>
    </div>
  );
}
