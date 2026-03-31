"use client"

import React from "react"
import { Sparkles, Image as ImageIcon, ArrowRight, Brain } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { VisualBrief } from "@/lib/social-content"

type ImageTipsCardProps = {
  brief: VisualBrief | null
  loading?: boolean
  onClick?: () => void
}

export function ImageTipsCard({ brief, loading, onClick }: ImageTipsCardProps) {
  if (loading) {
    return (
      <div className="rounded-[24px] border border-white/5 bg-[#101417] p-6 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-5 w-5 rounded-full bg-white/5" />
          <div className="h-4 w-32 rounded bg-white/5" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-white/5" />
          <div className="h-3 w-2/3 rounded bg-white/5" />
        </div>
      </div>
    )
  }

  if (!brief) return null

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-[24px] border border-[#462D6E]/30 bg-[#101417] p-6 transition-all hover:border-[#462D6E]/60 cursor-pointer"
      onClick={onClick}
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#462D6E]/10 blur-3xl group-hover:bg-[#462D6E]/20 transition-colors" />
      
      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#462D6E]/10 text-[#A855F7]">
              <Sparkles size={16} />
            </div>
            <span className="text-sm font-bold text-[#E0E5EB]">Tips de imagen [IA]</span>
          </div>
          <div className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-400">
            Analizado
          </div>
        </div>

        <p className="mb-4 text-xs font-medium leading-relaxed text-[#8D95A6]">
          {brief.why_it_works.length > 120 
            ? `${brief.why_it_works.slice(0, 120)}...` 
            : brief.why_it_works}
        </p>

        <div className="flex items-center gap-4 text-[10px] uppercase font-bold tracking-wider text-[#4E576A]">
          <div className="flex items-center gap-1">
            <Brain size={12} />
            {brief.visual_brief.mood}
          </div>
          <div className="flex items-center gap-1">
            <ImageIcon size={12} />
            {brief.visual_brief.color_palette}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[#E0E5EB] opacity-0 group-hover:opacity-100 transition-opacity">
          Ver recomendaciones <ArrowRight size={14} />
        </div>
      </div>
    </motion.div>
  )
}
