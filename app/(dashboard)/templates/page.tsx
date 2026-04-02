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
    <div className="flex flex-col gap-12 pb-24">
      {/* Hero Section */}
      <section className="relative flex flex-col gap-6 overflow-hidden rounded-[40px] border border-white/5 bg-[#0A0D0F] px-8 py-16 md:px-12 md:py-24">
        {/* Decorative Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute -left-1/4 -top-1/4 h-[800px] w-[800px] rounded-full bg-[#6C4CE4]/10 blur-[120px]" />
          <div className="absolute -right-1/4 -bottom-1/4 h-[600px] w-[600px] rounded-full bg-[#462D6E]/10 blur-[100px]" />
          <div 
            className="absolute inset-0 opacity-[0.03]" 
            style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "40px 40px" }}
          />
        </div>

        <div className="relative z-10 flex flex-col gap-6 md:max-w-3xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 w-fit"
          >
            <Sparkles className="h-4 w-4 text-[#CDB9FF]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#8D95A6]">Galeria de Plantillas</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-extrabold tracking-tighter text-white sm:text-6xl md:text-7xl"
          >
            Diseño <span className="text-zinc-600 italic font-medium">Professional</span> <br />
            en segundos.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg leading-relaxed text-[#8D95A6] md:text-xl md:max-w-2xl"
          >
            Elige una base diseñada por expertos y lanza tu próximo carrusel viral. 
            Todas las plantillas son totalmente personalizables en nuestro editor tipo Illustrator.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 flex flex-wrap gap-4"
          >
            <button 
              onClick={() => router.push("/compose")}
              className="flex items-center gap-3 rounded-2xl bg-[#6C4CE4] px-8 py-4 text-sm font-bold text-white shadow-[0_16px_32px_rgba(108,76,228,0.3)] transition-all hover:bg-[#5A3BB7] hover:translate-y-[-2px] active:translate-y-0"
            >
              <Wand2 className="h-5 w-5" />
              Lienzo en Blanco
            </button>
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-md">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 w-8 rounded-full border-2 border-[#101417] bg-zinc-800" />
                ))}
              </div>
              <span className="text-sm font-medium text-[#E0E5EB]">
                <span className="font-bold text-white">1.2k+</span> creadores ya lo usan
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="sticky top-[4.1rem] z-40 -mx-8 bg-zinc-950/80 px-8 py-6 backdrop-blur-xl transition-all border-b border-white/5">
        <TemplateFilters
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </section>

      {/* Grid Section */}
      <section className="min-h-[400px]">
        <motion.div 
          layout
          className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={handleSelectTemplate}
                isSuggested={template.id === "editorial"} // Example: Mark one as suggested
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredTemplates.length === 0 && (
          <div className="mt-24 flex flex-col items-center justify-center gap-4">
            <div className="rounded-full bg-zinc-900 border border-white/5 p-8 text-zinc-600">
              <Sparkles className="h-12 w-12" />
            </div>
            <h3 className="text-xl font-bold text-[#E0E5EB]">No encontramos plantillas</h3>
            <p className="text-[#8D95A6]">Intenta con otros términos o limpia los filtros.</p>
            <button 
              onClick={() => { setActiveCategory("Todos"); setSearchQuery(""); }}
              className="mt-2 text-[#6C4CE4] font-bold hover:underline"
            >
              Ver todas las plantillas
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
