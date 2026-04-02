"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const CATEGORIES = [
  "Todos",
  "Viral",
  "Educational",
  "Minimalist",
  "Tech",
  "Corporate",
  "Creative",
] as const;

export type TemplateCategory = (typeof CATEGORIES)[number];

interface TemplateFiltersProps {
  activeCategory: TemplateCategory;
  onCategoryChange: (category: TemplateCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function TemplateFilters({
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
}: TemplateFiltersProps) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      {/* Categories Modern Chip System */}
      <div className="flex flex-wrap gap-2 order-2 lg:order-1">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={cn(
              "relative rounded-full px-5 py-2 text-xs font-black uppercase tracking-widest transition-all duration-300",
              activeCategory === category
                ? "bg-white text-black shadow-[0_12px_32px_rgba(255,255,255,0.15)]"
                : "border border-white/10 bg-white/5 text-[#8D95A6] hover:bg-white/10 hover:text-white"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Expansive Search Bar */}
      <div className="relative w-full max-w-sm order-1 lg:order-2 lg:max-w-md">
        <div 
          className={cn(
            "flex items-center gap-3 rounded-full border border-white/10 bg-[#0D1113]/40 px-6 py-3 transition-all duration-300 backdrop-blur-md",
            "focus-within:border-white/20 focus-within:bg-[#0D1113]/80 focus-within:shadow-[0_0_0_4px_rgba(255,255,255,0.03)]"
          )}
        >
          <Search className="h-4 w-4 text-[#4E576A]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar plantillas..."
            className="w-full bg-transparent text-sm font-medium text-white placeholder-[#4E576A] outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="rounded-full bg-white/5 p-1 text-[#4E576A] hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
