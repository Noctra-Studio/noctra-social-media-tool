"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Wand2 } from "lucide-react";
import { templates, SlideTemplate } from "@/lib/editor/templates";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { TemplateFilters, TemplateCategory } from "@/components/templates/TemplateFilters";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function TemplatesPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>("Todos");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates = useMemo(() => {
    return Object.values(templates).filter((t) => {
      const matchCategory =
        activeCategory === "Todos" || t.category === activeCategory;
      const matchSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleSelectTemplate = (id: string) => {
    router.push(`/compose?templateId=${id}&platform=instagram`);
  };

  return (
    <div className="flex flex-col gap-10 pb-24">
      {/* Kittl-inspired Studio Hero */}
      <section className="relative flex flex-col gap-6 overflow-hidden rounded-[32px] border border-white/5 bg-[#0D1012] px-8 py-12 md:px-12 md:py-16">
        {/* Subtle Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-[#6C4CE4]/5 blur-[120px]" />
          <div className="absolute -right-1/4 -bottom-1/4 h-[400px] w-[400px] rounded-full bg-[#462D6E]/5 blur-[100px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5"
          >
            <Sparkles className="h-3 w-3 text-[#CDB9FF]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8D95A6]">Editor Studio</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-black tracking-tight text-white sm:text-6xl"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            Libera tu visión creativa.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-md leading-relaxed text-[#8D95A6] md:text-lg md:max-w-xl"
          >
            Inicia con una base diseñada por expertos y personaliza cada detalle en nuestro editor de alta velocidad.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-2"
          >
            <button 
              onClick={() => router.push("/compose")}
              className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-white/10 hover:border-white/20 active:scale-95"
            >
              <Wand2 className="h-4 w-4 text-[#CDB9FF] group-hover:rotate-12 transition-transform" />
              Empezar desde blanco
            </button>
          </motion.div>
        </div>
      </section>

      {/* Sticky Filters with Glassmorphism */}
      <section className="sticky top-[4.1rem] z-40 -mx-8 bg-zinc-950/60 transition-all border-b border-white/5 backdrop-blur-2xl">
        <div className="px-8 py-6">
          <TemplateFilters
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
      </section>

      {/* Modern High-Density Grid */}
      <section className="min-h-[400px]">
        <motion.div 
          layout
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={handleSelectTemplate}
                isSuggested={template.id === "editorial"} 
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredTemplates.length === 0 && (
          <div className="mt-24 flex flex-col items-center justify-center gap-4">
            <div className="rounded-full bg-zinc-900 border border-white/5 p-8 text-zinc-600">
              <Sparkles className="h-12 w-12" />
            </div>
            <h3 className="text-xl font-bold text-[#E0E5EB]">No encontramos lo que buscas</h3>
            <p className="text-[#8D95A6]">Prueba con palabras más generales o cambia la categoría.</p>
            <button 
              onClick={() => { setActiveCategory("Todos"); setSearchQuery(""); }}
              className="mt-2 text-[#6C4CE4] font-bold hover:underline"
            >
              Restablecer filtros
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
