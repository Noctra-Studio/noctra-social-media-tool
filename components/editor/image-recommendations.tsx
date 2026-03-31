"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Brain, 
  Search, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Undo2,
  RefreshCcw,
  ExternalLink,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { VisualBrief, ScoredImage, EfficacyReport } from "@/lib/social-content";

type ImageRecommendationsProps = {
  postContent: {
    caption: string;
    platform: string;
    angle: string;
    pillar?: string;
    audience_description?: string;
    post_id?: string;
  };
  slideIndex?: number;
  slideType?: 'cover' | 'content' | 'cta';
  onSelect: (image: ScoredImage) => void;
  onClose?: () => void;
};

type AnalysisStep = 'analyzing' | 'searching' | 'done' | 'error';

export function ImageRecommendations({ 
  postContent, 
  slideIndex = -1, 
  slideType = 'content',
  onSelect,
  onClose
}: ImageRecommendationsProps) {
  const [step, setStep] = useState<AnalysisStep>('analyzing');
  const [brief, setBrief] = useState<VisualBrief | null>(null);
  const [results, setResults] = useState<{
    recommended: ScoredImage[];
    good: ScoredImage[];
    alternatives: ScoredImage[];
  }>({ recommended: [], good: [], alternatives: [] });
  const [isBriefExpanded, setIsBriefExpanded] = useState(false);
  const [isRefineOpen, setIsRefineOpen] = useState(false);
  const [isQueriesExpanded, setIsQueriesExpanded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0); // 0-12
  const [error, setError] = useState<string | null>(null);
  const [refineKey, setRefineKey] = useState(0);
  const [activeFeedback, setActiveFeedback] = useState<string | undefined>(undefined);

  // Initial Analysis
  useEffect(() => {
    let isMounted = true;

    const runPipeline = async (feedback?: string) => {
      try {
        setStep('analyzing');
        setError(null);
        setResults({ recommended: [], good: [], alternatives: [] });
        setLoadingProgress(0);
        
        // Stage 1: Brief
        const briefRes = await fetch('/api/images/brief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            post_content: postContent,
            slide_index: slideIndex,
            slide_type: slideType,
            post_id: postContent.post_id,
            feedback: feedback // pass refinement feedback
          })
        });

        if (!briefRes.ok) throw new Error('Error al generar el brief visual');
        const briefData = await briefRes.json();
        if (!isMounted) return;
        setBrief(briefData);
        setStep('searching');

        // Stage 2: Recommend
        const recommendRes = await fetch('/api/images/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brief: briefData,
            post_content: postContent,
            platform: postContent.platform,
            feedback: feedback // pass refinement feedback
          })
        });
        
        if (!recommendRes.ok) throw new Error('Error al buscar imágenes');
        const reader = recommendRes.body?.getReader();
        if (!reader) throw new Error('Readable stream not supported');

        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(Boolean);
          
          for (const line of lines) {
            try {
              const message = JSON.parse(line);
              if (message.type === 'image_scored') {
                setLoadingProgress(prev => prev + 1);
                const img = message.data;
                setResults(prev => {
                  const alreadyExists = [...prev.recommended, ...prev.good, ...prev.alternatives].some(x => x.unsplashId === img.unsplashId);
                  if (alreadyExists) return prev;

                  if (img.scores.total >= 0.75) return { ...prev, recommended: [...prev.recommended, img] };
                  if (img.scores.total >= 0.5) return { ...prev, good: [...prev.good, img] };
                  return { ...prev, alternatives: [...prev.alternatives, img] };
                });
              } else if (message.type === 'complete') {
                setResults({
                  recommended: message.recommended,
                  good: message.good,
                  alternatives: message.alternatives
                });
                setStep('done');
              }
            } catch (e) {
              console.warn('Failed to parse chunk', line);
            }
          }
        }

      } catch (err: any) {
        if (isMounted) {
          setError(err.message);
          setStep('error');
        }
      }
    };

    runPipeline(activeFeedback);
    return () => { isMounted = false; };
  }, [postContent, slideIndex, slideType, refineKey]);

  const [refineFeedback, setRefineFeedback] = useState("");
  const [selectedChips, setSelectedChips] = useState<string[]>([]);

  const handleChipClick = (chip: string) => {
    setSelectedChips(prev => 
      prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]
    );
  };

  const executeRegenerate = () => {
    const combinedFeedback = [
      ...selectedChips,
      refineFeedback.trim()
    ].filter(Boolean).join(". ");
    
    if (!combinedFeedback) return;
    
    setActiveFeedback(combinedFeedback);
    setRefineKey(prev => prev + 1);
    setIsRefineOpen(false);
  };

  const handleRefine = () => {
    setIsRefineOpen(true);
  };

  if (step === 'analyzing') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 animate-ping rounded-full bg-[#462D6E]/20" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#1A1F28] border border-white/10">
            <Brain className="h-8 w-8 text-[#462D6E] animate-pulse" />
          </div>
        </div>
        <h3 className="mb-2 text-base font-bold text-[#E0E5EB]">Analizando el post...</h3>
        <p className="max-w-[240px] text-xs text-[#4E576A]">
          Anthropic está extrayendo la esencia visual de tu contenido para encontrar el "match" perfecto.
        </p>
      </div>
    );
  }

  if (step === 'searching') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#1A1F28] border border-white/10 overflow-hidden">
          <motion.div 
            animate={{ x: [0, 20, -20, 0], y: [0, -10, 10, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <Search className="h-6 w-6 text-[#462D6E]" />
          </motion.div>
          <Loader2 className="absolute inset-0 h-16 w-16 text-[#462D6E]/20 animate-spin" strokeWidth={1} />
        </div>
        <h3 className="mb-2 text-base font-bold text-[#E0E5EB]">Puntuando imágenes...</h3>
        <div className="mb-4 h-1 w-48 rounded-full bg-white/5 overflow-hidden">
          <motion.div 
            className="h-full bg-[#462D6E]"
            initial={{ width: 0 }}
            animate={{ width: `${(loadingProgress / 12) * 100}%` }}
          />
        </div>
        <p className="text-[11px] text-[#4E576A]">
          Gemini Vision evaluando {loadingProgress}/12 imágenes encontradas.
        </p>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
        <h3 className="mb-2 text-base font-bold text-[#E0E5EB]">Algo salió mal</h3>
        <p className="mb-6 text-xs text-[#4E576A]">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="rounded-xl bg-white/5 px-6 py-2 text-xs font-bold text-[#E0E5EB] hover:bg-white/10"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 pb-20 scrollbar-hide">
        {/* Visual Brief Card */}
        {brief && (
          <div className="mb-6 rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <button 
              onClick={() => setIsBriefExpanded(!isBriefExpanded)}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#462D6E]" />
                <span className="text-xs font-bold text-[#E0E5EB]">Brief visual generado por IA</span>
              </div>
              {isBriefExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <AnimatePresence>
              {isBriefExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4 space-y-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="mb-1 block text-[10px] uppercase font-bold text-[#4E576A]">Mood</span>
                      <div className="rounded-lg bg-[#2A3040] px-2 py-1 text-[11px] text-[#E0E5EB] inline-block">
                        {brief.visual_brief.mood}
                      </div>
                    </div>
                    <div>
                      <span className="mb-1 block text-[10px] uppercase font-bold text-[#4E576A]">Composición</span>
                      <p className="text-[11px] text-[#E0E5EB]">{brief.visual_brief.composition}</p>
                    </div>
                  </div>
                  
                  <div>
                    <span className="mb-2 block text-[10px] uppercase font-bold text-[#4E576A]">Descripción ideal</span>
                    <p className="italic text-xs text-[#8D95A6] leading-relaxed">"{brief.ideal_image_description}"</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {brief.visual_brief.avoid.map((item, i) => (
                      <div key={i} className="flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] text-red-300">
                        <X size={10} /> {item}
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl bg-white/5 p-3">
                    <span className="mb-1 block text-[10px] uppercase font-bold text-[#4E576A]">¿Por qué funciona?</span>
                    <p className="text-[11px] text-[#8D95A6] leading-relaxed">{brief.why_it_works}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Results Sections */}
        <div className="space-y-8">
          {/* Tier 1: Recommended */}
          <section>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#E0E5EB]">Recomendadas para este post</h4>
                <p className="text-[10px] text-[#4E576A]">Puntuadas por Gemini Vision</p>
              </div>
              <div className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-400">
                Puntuación alta
              </div>
            </div>
            
            {results.recommended.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {results.recommended.map((img) => (
                  <RecommendationCard key={img.unsplashId} image={img} onSelect={onSelect} slideType={slideType} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
                <Info className="mx-auto mb-2 h-5 w-5 text-[#4E576A]" />
                <p className="text-xs text-[#4E576A]">No se encontraron imágenes con puntuación perfecta.</p>
              </div>
            )}
          </section>

          {/* Tier 2: Good Options */}
          {results.good.length > 0 && (
            <CollapsibleSection title={`Buenas opciones (${results.good.length})`} defaultOpen={false}>
              <div className="grid grid-cols-2 gap-3">
                {results.good.map((img) => (
                  <RecommendationCard key={img.unsplashId} image={img} onSelect={onSelect} slideType={slideType} />
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Tier 3: Alternatives */}
          {results.alternatives.length > 0 && (
            <CollapsibleSection title={`Alternativas (${results.alternatives.length})`} defaultOpen={false}>
              <div className="grid grid-cols-2 gap-3">
                {results.alternatives.map((img) => (
                  <RecommendationCard key={img.unsplashId} image={img} onSelect={onSelect} slideType={slideType} />
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Query Transparency */}
          <div className="mt-8 pt-4 border-t border-white/5">
            <button 
              onClick={() => setIsQueriesExpanded(!isQueriesExpanded)}
              className="flex items-center gap-2 text-[10px] font-bold text-[#4E576A] hover:text-[#E0E5EB] transition-colors"
            >
              Búsquedas realizadas {isQueriesExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            <AnimatePresence>
              {isQueriesExpanded && brief && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 space-y-2"
                >
                  {brief.queries.map((q, i) => (
                    <div key={i} className="text-[11px] leading-relaxed">
                      <span className="font-bold text-[#E0E5EB]">{i + 1}. "{q.query}"</span>
                      <span className="text-[#4E576A]"> — {q.rationale}</span>
                    </div>
                  ))}
                  <button className="mt-2 text-[10px] font-bold text-[#462D6E] hover:underline underline-offset-4">
                    Buscar con query diferente →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Floating Refine Button */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <button 
          onClick={handleRefine}
          className="flex items-center gap-2 rounded-full bg-[#1A1F28]/90 border border-white/10 px-6 py-2.5 text-xs font-bold text-[#E0E5EB] backdrop-blur-md shadow-xl hover:bg-[#2A3040] transition-colors"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          Refinar recomendaciones
        </button>
      </div>

      {/* Refine Side Panel (Mock implementation - could be more complex) */}
      <AnimatePresence>
        {isRefineOpen && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute inset-0 z-50 bg-[#0d1014] p-6"
          >
            <button onClick={() => setIsRefineOpen(false)} className="mb-6 flex items-center gap-2 text-sm font-medium text-[#4E576A] hover:text-[#E0E5EB]">
              ← Volver
            </button>
            <h3 className="mb-1 text-lg font-bold text-[#E0E5EB]">Refinar búsqueda</h3>
            <p className="mb-8 text-xs text-[#4E576A]">Dinos qué no funcionó para mejorar las sugerencias</p>
            
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {REFINE_FEEDBACK_CHIPS.map((chip) => (
                  <button 
                    key={chip}
                    onClick={() => handleChipClick(chip)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-xs transition-all",
                      selectedChips.includes(chip) 
                        ? "border-[#462D6E] bg-[#462D6E]/20 text-[#E0E5EB]" 
                        : "border-white/5 bg-white/5 text-[#8D95A6] hover:border-white/10 hover:text-[#E0E5EB]"
                    )}
                  >
                    {chip}
                  </button>
                ))}
              </div>
              
              <textarea 
                value={refineFeedback}
                onChange={(e) => setRefineFeedback(e.target.value)}
                placeholder="¿Algo más específico? ej: Necesito algo que transmita urgencia y velocidad"
                className="h-32 w-full resize-none rounded-2xl border border-white/5 bg-white/5 p-4 text-xs text-[#E0E5EB] focus:border-[#4E576A] focus:outline-none"
              />

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setIsRefineOpen(false)} 
                  className="flex-1 rounded-xl bg-white/5 py-4 text-xs font-bold text-[#E0E5EB]"
                >
                  Cancelar
                </button>
                <button 
                  onClick={executeRegenerate}
                  className="flex-1 rounded-xl bg-[#E0E5EB] py-4 text-xs font-bold text-[#101417]"
                >
                  Regenerar →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RecommendationCard({ image, onSelect, slideType }: { image: ScoredImage; onSelect: (img: any) => void; slideType: string }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="group relative cursor-pointer overflow-hidden rounded-xl bg-[#1A1F28] border border-white/5 transition-all hover:border-white/20"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(image)}
    >
      <img src={image.thumbUrl} alt="" className="w-full aspect-[3/4] object-cover transition-transform duration-500 group-hover:scale-110" />
      
      {/* Score Badge */}
      <div className={cn(
        "absolute right-2 top-2 rounded-lg px-1.5 py-0.5 text-[10px] font-bold shadow-lg",
        image.scores.total >= 0.85 ? "bg-green-500 text-white" : "bg-amber-500 text-white"
      )}>
        ✦ {(image.scores.total * 10).toFixed(0)}/10
      </div>

      {/* Ideal for badge */}
      {image.best_for === slideType && (
        <div className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2 py-1 text-[9px] font-bold text-white backdrop-blur-md">
          Ideal para {slideType === 'cover' ? 'portada' : slideType === 'cta' ? 'CTA' : 'contenido'}
        </div>
      )}

      {/* Hover Verdict Overlay */}
      <AnimatePresence>
        {isHovered && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute inset-0 flex flex-col justify-end bg-black/60 p-3"
          >
            <p className="text-[10px] leading-relaxed text-white font-medium mb-1 line-clamp-3">
              {image.verdict}
            </p>
            <span className="text-[9px] text-white/60">📷 {image.photographer}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <section>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="mb-4 flex w-full items-center justify-between text-left"
      >
        <h4 className="text-sm font-bold text-[#E0E5EB]">{title}</h4>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

const REFINE_FEEDBACK_CHIPS = [
  "Las imágenes son muy oscuras",
  "Las imágenes son muy claras",
  "El tema no encaja",
  "Necesito más abstracción",
  "Necesito algo más humano/personal",
  "Las imágenes se ven genéricas",
  "Necesito más espacio para texto",
  "Quiero algo más colorido",
  "Quiero algo más minimalista",
  "No hay relación con el contenido",
];
