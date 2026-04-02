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
    <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
      {/* Search Bar */}
      <div className="relative w-full max-w-sm">
        <div 
          className={cn(
            "flex items-center gap-3 rounded-2xl border-2 border-white/5 bg-[#101417]/40 px-5 py-4 transition-all duration-300 backdrop-blur-md",
            "focus-within:border-[#6C4CE4]/30 focus-within:bg-[#101417]/60 focus-within:shadow-[0_0_0_4px_rgba(108,76,228,0.1)]"
          )}
        >
          <Search className="h-5 w-5 text-[#4E576A]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por estilo o industria..."
            className="w-full bg-transparent text-[15px] font-medium text-white placeholder-[#4E576A] outline-none"
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

      {/* Categories Scrollable/Flexbox */}
      <div className="flex flex-wrap gap-3">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={cn(
              "relative overflow-hidden rounded-2xl px-6 py-3.5 text-sm font-bold tracking-tight transition-all duration-300",
              activeCategory === category
                ? "bg-[#6C4CE4] text-white shadow-[0_12px_24px_rgba(108,76,228,0.3)]"
                : "border border-white/8 bg-white/[0.02] text-[#8D95A6] hover:border-white/16 hover:bg-white/[0.05] hover:text-[#E0E5EB]"
            )}
          >
            {category}
            {activeCategory === category && (
              <motion.div
                layoutId="active-bg"
                className="absolute inset-0 z-[-1] bg-[#6C4CE4]"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
