"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  FileJson, 
  ImageIcon, 
  Layers, 
  Maximize2, 
  Check, 
  Loader2, 
  AlertTriangle,
  Monitor,
  Share2,
  Camera,
  Briefcase,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  type ExportFormat, 
  type ExportResolution, 
  exportSlides 
} from '@/lib/editor/export';
import { 
  PLATFORM_PRESETS, 
  type PlatformPreset, 
  type PlatformDimensions 
} from '@/lib/editor/resize-canvas';
import { CarouselEditorSlide } from '@/lib/instagram-carousel-editor';
import Image from 'next/image';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: CarouselEditorSlide[];
  postId?: string;
  onExportSuccess?: (postId: string, platform: string, format: string) => void;
}

const RESOLUTIONS: { label: string; value: ExportResolution; sub: string }[] = [
  { label: '1x', value: 1, sub: '1080px (Veloce)' },
  { label: '2x', value: 2, sub: '2160px (Recomendado)' },
  { label: '3x', value: 3, sub: '3240px (Máxima)' },
];

export function ExportModal({ isOpen, onClose, slides, postId, onExportSuccess }: ExportModalProps) {
  const [activeFormat, setActiveFormat] = useState<ExportFormat>('png');
  const [activeResolution, setActiveResolution] = useState<ExportResolution>(2);
  const [activePlatform, setActivePlatform] = useState<PlatformPreset>('instagram_post');
  const [selectedSlides, setSelectedSlides] = useState<number[]>(slides.map((_, i) => i));
  const [exportStats, setExportStats] = useState(null);
  const [quality, setQuality] = useState(0.9);
  const [filename, setFilename] = useState(`noctra-carousel-${new Date().toISOString().split('T')[0]}`);
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');

  const currentPlatform = PLATFORM_PRESETS[activePlatform];

  const handleToggleSlide = (index: number) => {
    setSelectedSlides(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) 
        : [...prev, index].sort((a, b) => a - b)
    );
  };

  const handleSelectAll = () => {
    if (selectedSlides.length === slides.length) {
      setSelectedSlides([]);
    } else {
      setSelectedSlides(slides.map((_, i) => i));
    }
  };

  const executeExport = async () => {
    if (selectedSlides.length === 0) return;

    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('Iniciando exportación...');

    try {
      const zipBlob = await exportSlides({
        slides,
        selectedIndices: selectedSlides,
        format: activeFormat,
        resolution: activeResolution,
        quality,
        platform: currentPlatform,
        filename,
        onProgress: (current, total, message) => {
          setExportProgress((current / total) * 100);
          setExportStatus(message);
        }
      });

      // Trigger download
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.zip`;
      link.click();
      URL.revokeObjectURL(url);

      if (onExportSuccess && postId) {
        onExportSuccess(postId, activePlatform, activeFormat);
      }

      setExportStatus('¡Exportación completada!');
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 1000);
    } catch (error) {
      console.error(error);
      setExportStatus('Error en la exportación');
      setIsExporting(false);
    }
  };

  // Preview Logic: Calculate scale to fit in the preview panel
  const previewData = slides[selectedSlides[0] || 0];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 sm:p-12">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative flex h-full max-h-[850px] w-full max-w-6xl flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[#0D1014] shadow-2xl lg:flex-row"
          >
            {/* Left Panel: Configuration */}
            <div className="flex h-full flex-col border-r border-white/5 lg:w-[420px]">
              <div className="flex items-center justify-between border-b border-white/5 p-6">
                <h2 className="text-xl font-bold text-[#E0E5EB]">Configuración de Exportación</h2>
                <button 
                  onClick={onClose}
                  className="rounded-full p-2 text-[#4E576A] transition-colors hover:bg-white/5 hover:text-[#E0E5EB]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div className="space-y-8">
                  {/* Format Selection */}
                  <section>
                    <label className="mb-3 block text-[11px] font-bold uppercase tracking-wider text-[#4E576A]">Formato</label>
                    <div className="flex gap-2 rounded-2xl bg-white/5 p-1.5">
                      {(['png', 'jpg', 'svg'] as ExportFormat[]).map((f) => (
                        <button
                          key={f}
                          onClick={() => setActiveFormat(f)}
                          className={cn(
                            "flex-1 rounded-xl py-2.5 text-xs font-bold transition-all",
                            activeFormat === f 
                              ? "bg-white text-[#101417] shadow-lg" 
                              : "text-[#8D95A6] hover:text-[#E0E5EB]"
                          )}
                        >
                          {f.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Resolution Selection */}
                  <section>
                    <label className="mb-3 block text-[11px] font-bold uppercase tracking-wider text-[#4E576A]">Resolución</label>
                    <div className="grid grid-cols-3 gap-2">
                      {RESOLUTIONS.map((res) => (
                        <button
                          key={res.value}
                          onClick={() => setActiveResolution(res.value)}
                          className={cn(
                            "flex flex-col items-center rounded-2xl border p-3 transition-all",
                            activeResolution === res.value
                              ? "border-[#462D6E] bg-[#462D6E]/10"
                              : "border-white/5 bg-white/5 hover:border-white/10"
                          )}
                        >
                          <span className={cn("text-sm font-bold", activeResolution === res.value ? "text-[#E0E5EB]" : "text-[#8D95A6]")}>
                            {res.label}
                          </span>
                          <span className="mt-1 text-[9px] text-[#4E576A]">{res.sub}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Platform Selection */}
                  <section>
                    <label className="mb-3 block text-[11px] font-bold uppercase tracking-wider text-[#4E576A]">Plataforma y Ratio</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(PLATFORM_PRESETS).map(([key, platform]) => (
                        <button
                          key={key}
                          onClick={() => setActivePlatform(key as PlatformPreset)}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl border p-3 text-left transition-all",
                            activePlatform === key
                              ? "border-[#462D6E] bg-[#462D6E]/10"
                              : "border-white/5 bg-white/5 hover:border-white/10"
                          )}
                        >
                          <div className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg",
                            activePlatform === key ? "bg-[#462D6E] text-white" : "bg-white/5 text-[#4E576A]"
                          )}>
                            {key.includes('instagram') ? <Camera size={14} /> : key.includes('linkedin') ? <Briefcase size={14} /> : key.includes('x') ? <Zap size={14} /> : <ImageIcon size={14} />}
                          </div>
                          <div>
                            <p className={cn("text-[11px] font-bold", activePlatform === key ? "text-[#E0E5EB]" : "text-[#8D95A6]")}>
                              {platform.label}
                            </p>
                            <p className="text-[9px] text-[#4E576A]">{platform.ratio}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Slide Selection */}
                  <section>
                    <div className="mb-3 flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[#4E576A]">Selección de Slides</label>
                      <button 
                        onClick={handleSelectAll}
                        className="text-[10px] font-bold text-[#462D6E] hover:underline"
                      >
                        {selectedSlides.length === slides.length ? 'Deseleccionar todo' : 'Seleccionar todos'}
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {slides.map((slide, i) => (
                        <button
                          key={slide.id}
                          onClick={() => handleToggleSlide(i)}
                          className={cn(
                            "relative aspect-square overflow-hidden rounded-xl border-2 transition-all",
                            selectedSlides.includes(i) ? "border-[#462D6E]" : "border-white/5 opacity-50 grayscale"
                          )}
                        >
                          {slide.previewDataURL ? (
                            <Image src={slide.previewDataURL} alt="" fill className="object-cover" />
                          ) : (
                            <div className="h-full w-full bg-white/5" />
                          )}
                          <div className={cn(
                            "absolute left-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white",
                            selectedSlides.includes(i) ? "bg-[#462D6E]" : "bg-black/40"
                          )}>
                            {i + 1}
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Filename */}
                  <section>
                    <label className="mb-3 block text-[11px] font-bold uppercase tracking-wider text-[#4E576A]">Nombre del archivo</label>
                    <input 
                      type="text" 
                      value={filename}
                      onChange={(e) => setFilename(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-[#E0E5EB] focus:border-[#462D6E] focus:outline-none"
                    />
                  </section>
                </div>
              </div>

              {/* Action Area */}
              <div className="border-t border-white/5 p-6">
                {isExporting ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-[#8D95A6]">
                      <span>{exportStatus}</span>
                      <span>{Math.round(exportProgress)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${exportProgress}%` }}
                        className="h-full bg-gradient-to-r from-[#462D6E] to-[#6E46BD]"
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={executeExport}
                    disabled={selectedSlides.length === 0}
                    className="flex w-full items-center justify-center gap-3 rounded-[18px] bg-white py-5 text-sm font-bold text-[#101417] transition-transform active:scale-95 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    Exportar {selectedSlides.length} slides →
                  </button>
                )}
              </div>
            </div>

            {/* Right Panel: Preview Area */}
            <div className="relative flex-1 bg-[#090C10] p-12">
              <div className="flex h-full flex-col items-center justify-center">
                <div className="mb-6 flex items-center gap-4 text-[#4E576A]">
                  <Monitor size={16} />
                  <span className="text-xs font-medium tracking-wide uppercase">Vista previa de exportación</span>
                </div>

                <div 
                  className="relative overflow-hidden rounded-xl border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]"
                  style={{
                    width: '100%',
                    maxWidth: currentPlatform.width > currentPlatform.height ? '540px' : '360px',
                    aspectRatio: `${currentPlatform.width} / ${currentPlatform.height}`,
                    backgroundColor: '#101417'
                  }}
                >
                  {/* Canvas Preview Mockup */}
                  {previewData?.previewDataURL ? (
                    <div 
                      className="flex h-full w-full items-center justify-center"
                      style={{
                        padding: currentPlatform.width === currentPlatform.height ? '0' : '20px'
                      }}
                    >
                      <img 
                        src={previewData.previewDataURL} 
                        alt="Preview" 
                        className={cn(
                          "shadow-xl",
                          currentPlatform.width > currentPlatform.height ? "h-4/5 w-auto" : "w-4/5 h-auto"
                        )}
                      />
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-white/10" />
                    </div>
                  )}

                  {/* Safety Margins Mockup */}
                  <div className="pointer-events-none absolute inset-0 border border-dashed border-white/5" />
                </div>

                <div className="mt-12 max-w-sm text-center">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#4E576A]">
                    {currentPlatform.label} — {currentPlatform.width * activeResolution}x{currentPlatform.height * activeResolution}px
                  </div>
                  <p className="mt-4 text-xs leading-6 text-[#4E576A]">
                    Las proporciones del contenido se ajustarán automáticamente para mantener la jerarquía visual sin cortes.
                  </p>
                </div>
              </div>

              {activeFormat === 'svg' && (
                <div className="absolute bottom-12 right-12 flex max-w-xs items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <p className="text-[10px] leading-relaxed text-amber-200/60">
                    <span className="font-bold text-amber-500">Nota SVG:</span> Los efectos de sombra y filtros complejos pueden no renderizarse exactamente igual que en PNG.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
