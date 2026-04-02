"use client";

import React, { useState, useEffect } from 'react';
import { 
  History, 
  Plus, 
  RotateCcw, 
  Trash2, 
  Calendar,
  Layers,
  ChevronRight,
  Loader2,
  CheckCircle2,
  MoreVertical
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  type DesignVersion, 
  listDesignVersions, 
  saveDesignVersion,
  deleteDesignVersion,
  versionToSlides
} from '@/lib/editor/versions';
import { type CarouselEditorSlide } from '@/lib/instagram-carousel-editor';
import Image from 'next/image';

interface VersionPanelProps {
  userId: string;
  postId: string | null;
  currentSlides: CarouselEditorSlide[];
  metadata: DesignVersion['metadata'];
  onRestore: (slides: CarouselEditorSlide[]) => void;
  onClose: () => void;
}

export function VersionPanel({ 
  userId, 
  postId, 
  currentSlides, 
  metadata, 
  onRestore,
  onClose
}: VersionPanelProps) {
  const [versions, setVersions] = useState<DesignVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [activeTab, setActiveTab] = useState<'list' | 'save'>('list');

  // Load versions on mount
  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await listDesignVersions(postId);
      setVersions(data);
      setLoading(false);
    }
    load();
  }, [postId]);

  const handleSave = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const newVersion = await saveDesignVersion({
        userId,
        postId,
        name: newName,
        slides: currentSlides,
        metadata
      });
      setVersions(prev => [newVersion, ...prev]);
      setNewName("");
      setActiveTab('list');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (versionId: string) => {
    if (confirm('¿Eliminar esta versión permanentemente?')) {
      try {
        await deleteDesignVersion(versionId, postId || userId);
        setVersions(prev => prev.filter(v => v.id !== versionId));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleRestore = (version: DesignVersion) => {
    if (confirm(`¿Restaurar la versión "${version.name}"? Los cambios actuales no guardados se perderán si no has capturado una versión.`)) {
      onRestore(versionToSlides(version));
      onClose();
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#0D1014] text-[#E0E5EB]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 p-4">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-[#6E46BD]" />
          <h2 className="text-sm font-bold uppercase tracking-wider">Historial de Diseño</h2>
        </div>
        <button 
          onClick={onClose}
          className="text-[#4E576A] hover:text-white"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 p-1">
        <button 
          onClick={() => setActiveTab('list')}
          className={cn(
            "flex-1 rounded-lg py-2 text-xs font-bold transition-all",
            activeTab === 'list' ? "bg-white/5 text-white" : "text-[#4E576A] hover:text-[#8D95A6]"
          )}
        >
          Versiones ({versions.length})
        </button>
        <button 
          onClick={() => setActiveTab('save')}
          className={cn(
            "flex-1 rounded-lg py-2 text-xs font-bold transition-all",
            activeTab === 'save' ? "bg-white/5 text-white" : "text-[#4E576A] hover:text-[#8D95A6]"
          )}
        >
          Capturar Actual
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        {activeTab === 'save' ? (
          <div className="space-y-4 rounded-2xl border border-white/5 bg-[#0F1317] p-4">
             <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#4E576A]">Nombre de la Versión</label>
              <input 
                autoFocus
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Iteración Minimalista v2"
                className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm focus:border-[#462D6E] focus:outline-none"
              />
            </div>
            
            <div className="rounded-xl bg-[#462D6E]/10 p-3">
              <p className="text-[10px] leading-relaxed text-[#8D95A6]">
                Esto guardará el estado completo del canvas, incluyendo todas las capas, fondos y escalas tipográficas actuales.
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !newName.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-black transition-all hover:bg-white/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Guardar Snapshot
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#4E576A]">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="mt-2 text-xs">Cargando historial...</p>
              </div>
            ) : versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-[#4E576A]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                  <History className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-[#E0E5EB]">Sin versiones aún</p>
                <p className="mt-1 max-w-[200px] text-[10px]">
                  Captura un snapshot de tu diseño para poder volver atrás en cualquier momento.
                </p>
              </div>
            ) : (
              versions.map((v) => (
                <div 
                  key={v.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#0F1317] transition-all hover:border-white/10"
                >
                  {/* Thumbnail Row */}
                  <div className="flex p-3 gap-3">
                    <div className="relative aspect-square h-20 w-20 overflow-hidden rounded-lg bg-black">
                      {v.thumbnail ? (
                        <img src={v.thumbnail} alt="" className="h-full w-full object-cover opacity-80" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-white/10"><Layers size={20} /></div>
                      )}
                      <div className="absolute bottom-1 right-1 flex h-4 w-4 items-center justify-center rounded-sm bg-black/60 text-[8px] font-bold text-white">
                        {v.slideCount}
                      </div>
                    </div>
                    
                    <div className="flex flex-1 flex-col justify-between py-0.5">
                      <div>
                        <h4 className="text-xs font-bold text-[#E0E5EB] line-clamp-1">{v.name}</h4>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-[#4E576A]">
                          <Calendar size={10} />
                          {formatDistanceToNow(v.createdAt, { addSuffix: true, locale: es })}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleRestore(v)}
                        className="flex w-fit items-center gap-1.5 rounded-lg bg-[#462D6E]/20 px-3 py-1.5 text-[10px] font-bold text-[#A855F7] transition-all hover:bg-[#462D6E]/40"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restaurar
                      </button>
                    </div>

                    <button 
                      onClick={() => handleDelete(v.id)}
                      className="h-fit p-1 text-[#4E576A] hover:text-red-500 transition-colors"
                      title="Eliminar versión"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="border-t border-white/5 p-4 text-[9px] text-[#4E576A]">
        <div className="flex items-center gap-2">
          <CheckCircle2 color="#22c55e" size={12} />
          <span>Las versiones se sincronizan automáticamente con tu cuenta.</span>
        </div>
      </div>
    </div>
  );
}
