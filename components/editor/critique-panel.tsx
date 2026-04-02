"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight, 
  RefreshCw,
  Zap,
  ArrowRight,
  Clock,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface CritiqueIssue {
  severity: 'high' | 'medium' | 'low';
  element: string;
  problem: string;
  fix: string;
}

interface CritiqueResult {
  overall_score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  summary: string;
  strengths: string[];
  issues: CritiqueIssue[];
  quick_wins: string[];
  timestamp: number;
  thumbnail?: string;
}

interface CritiquePanelProps {
  onApplyFix: (fix: string, element: string) => void;
  onAnalyze: () => Promise<void>;
  isAnalyzing: boolean;
  results: CritiqueResult | null;
  history: CritiqueResult[];
  onClearHistory: () => void;
  onSelectHistory: (result: CritiqueResult) => void;
  cooldown: number;
}

export function CritiquePanel({
  onApplyFix,
  onAnalyze,
  isAnalyzing,
  results,
  history,
  onClearHistory,
  onSelectHistory,
  cooldown
}: CritiquePanelProps) {
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);

  const gradeColors = {
    A: { bg: 'rgba(34,197,94,0.15)', border: 'border-green-500/50', text: 'text-green-500' },
    B: { bg: 'rgba(234,179,8,0.15)', border: 'border-yellow-500/50', text: 'text-yellow-500' },
    C: { bg: 'rgba(249,115,22,0.15)', border: 'border-orange-500/50', text: 'text-orange-500' },
    D: { bg: 'rgba(239,68,68,0.15)', border: 'border-red-500/50', text: 'text-red-500' },
  };

  const severityColors = {
    high: 'text-red-500 border-red-500/20 bg-red-500/10',
    medium: 'text-amber-500 border-amber-500/20 bg-amber-500/10',
    low: 'text-blue-500 border-blue-500/20 bg-blue-500/10',
  };

  if (isAnalyzing) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-6 p-8 text-center">
        <div className="relative h-48 w-48 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <div className="flex h-full w-full items-center justify-center">
             <Sparkles className="h-12 w-12 text-[#4E576A] animate-pulse" />
          </div>
          <motion.div 
            initial={{ top: '-10%' }}
            animate={{ top: '110%' }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#462D6E] to-transparent shadow-[0_0_15px_#462D6E]"
          />
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-[#E0E5EB]">Analizando diseño...</h3>
          <p className="text-xs text-[#4E576A]">Gemini Vision está revisando legibilidad, jerarquía y composición.</p>
        </div>
      </div>
    );
  }

  if (!results && history.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-6 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
          <Sparkles className="h-8 w-8 text-[#4E576A]" />
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-[#E0E5EB]">Sin análisis activo</h3>
          <p className="text-xs text-[#4E576A]">Haz clic en el botón para que la IA realice una auditoría visual de este slide.</p>
        </div>
        <button
          onClick={() => onAnalyze()}
          disabled={cooldown > 0}
          className="flex items-center gap-2 rounded-xl bg-[#462D6E] px-6 py-3 text-sm font-bold text-white transition-all hover:bg-[#5A3B8E] active:scale-95 disabled:opacity-50"
        >
          {cooldown > 0 ? `Analizar (${cooldown}s)` : 'Iniciar Auditoría'}
        </button>
      </div>
    );
  }

  // Displaying results (either current or from history)
  const current = results || history[0];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        <div className="space-y-6">
          {/* Grade Card */}
          <section className={cn(
            "rounded-3xl border p-6 text-center transition-all",
            gradeColors[current.grade].bg,
            gradeColors[current.grade].border
          )}>
            <div className="flex items-baseline justify-center gap-2">
              <span className={cn("text-6xl font-black", gradeColors[current.grade].text)}>
                {current.grade}
              </span>
              <span className="text-sm font-bold text-[#4E576A]">
                {current.overall_score} / 10
              </span>
            </div>
            <p className="mt-4 text-xs font-medium italic text-[#E0E5EB]">
              "{current.summary}"
            </p>
          </section>

          {/* Strengths */}
          <section className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-green-500">✓ Lo que funciona</h4>
            <div className="space-y-2">
              {current.strengths.map((str, i) => (
                <div key={i} className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                  <span className="text-[13px] leading-relaxed text-[#E0E5EB]">{str}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Issues */}
          <section className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-500">⚠ Áreas de mejora</h4>
            <div className="space-y-2">
              {current.issues.map((issue, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] transition-all",
                    issue.severity === 'high' ? "border-l-4 border-l-red-500" :
                    issue.severity === 'medium' ? "border-l-4 border-l-amber-500" :
                    "border-l-4 border-l-[#4E576A]"
                  )}
                >
                  <button
                    onClick={() => setExpandedIssue(expandedIssue === i ? null : i)}
                    className="flex w-full items-center justify-between p-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "rounded-md border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider",
                        severityColors[issue.severity]
                      )}>
                        {issue.severity === 'high' ? 'Crítico' : issue.severity === 'medium' ? 'Medio' : 'Leve'}
                      </span>
                      <span className="text-xs font-bold text-[#E0E5EB]">{issue.element}</span>
                    </div>
                    {expandedIssue === i ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  
                  <AnimatePresence>
                    {expandedIssue === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-3 pb-3"
                      >
                        <div className="space-y-3 pt-1 border-t border-white/5 mt-1">
                          <div>
                            <p className="text-[10px] font-bold text-[#4E576A] uppercase mb-1">Problema</p>
                            <p className="text-xs text-[#8D95A6] leading-relaxed">{issue.problem}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-[#4E576A] uppercase mb-1">Sugerencia</p>
                            <p className="text-xs text-[#E0E5EB] leading-relaxed italic">{issue.fix}</p>
                          </div>
                          <button
                            onClick={() => onApplyFix(issue.fix, issue.element)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-2 text-[11px] font-bold text-[#E0E5EB] transition-colors hover:bg-white/10"
                          >
                            <Zap size={12} className="text-amber-500" />
                            Aplicar sugerencia
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Wins */}
          <section className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-400">⚡ Mejoras rápidas</h4>
            <div className="flex flex-wrap gap-2">
              {current.quick_wins.map((win, i) => (
                <button
                  key={i}
                  onClick={() => onApplyFix(win, 'quick_win')}
                  className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-[11px] text-blue-400 transition-colors hover:bg-blue-500/20"
                >
                  {win}
                </button>
              ))}
            </div>
          </section>

          {/* History */}
          {history.length > 1 && (
            <section className="space-y-3 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#4E576A]">Análisis anteriores</h4>
                <button onClick={onClearHistory} className="text-[#4E576A] hover:text-red-500 transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {history.slice(0, 4).map((hist, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectHistory(hist)}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.02] p-2 text-left hover:border-white/10 transition-all"
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black/20">
                      {hist.thumbnail ? (
                         <img src={hist.thumbnail} alt="" className="h-full w-full object-cover opacity-50" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                           <Clock size={16} className="text-[#4E576A]" />
                        </div>
                      )}
                      <div className={cn(
                        "absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black shadow-lg",
                        gradeColors[hist.grade].bg,
                        gradeColors[hist.grade].text,
                        gradeColors[hist.grade].border
                      )}>
                        {hist.grade}
                      </div>
                    </div>
                    <span className="text-[9px] text-[#4E576A]">
                      {new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-white/5 p-4 bg-[#0D1014]/50 backdrop-blur-md">
        <button
          onClick={() => onAnalyze()}
          disabled={isAnalyzing || cooldown > 0}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-bold text-[#101417] transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
        >
          {cooldown > 0 ? (
            <>
              <Clock size={16} />
              Analizar de nuevo ({cooldown}s)
            </>
          ) : (
            <>
              <RefreshCw size={16} className={isAnalyzing ? "animate-spin" : ""} />
              Analizar todo de nuevo
            </>
          )}
        </button>
      </div>
    </div>
  );
}
