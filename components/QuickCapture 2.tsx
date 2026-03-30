"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageSquarePlus, X, Check, Loader2 } from 'lucide-react';

export default function QuickCapture() {
  const [isOpen, setIsOpen] = useState(false);
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;

    setLoading(true);
    setSuccess(false);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Unauthorized');
      }

      const { error } = await supabase
        .from('content_ideas')
        .insert([{ raw_idea: idea.trim(), status: 'raw', user_id: user.id }]);
        
      if (error) throw error;
      
      setSuccess(true);
      setIdea("");
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 2000);
      
    } catch (err) {
      console.error("Error saving idea:", err);
      // In a real app we'd show a toast here
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-4 z-50 md:bottom-6 md:right-6">
      {isOpen ? (
        <div className="w-[min(22rem,calc(100vw-2rem))] rounded-[28px] border border-white/10 bg-[#212631] p-4 text-white shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3
                className="text-lg font-medium text-[#E0E5EB]"
                style={{ fontFamily: 'var(--font-brand-display)' }}
              >
                Captura rápida
              </h3>
              <p className="text-xs text-[#8D95A6]">Guárdala antes de que se pierda.</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <textarea 
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Idea, insight, observación o hook..."
              className="min-h-[120px] w-full resize-none rounded-2xl border border-white/10 bg-[#101417] p-3 text-sm text-[#E0E5EB] transition-all placeholder:text-[#4E576A] focus:outline-none focus:ring-2 focus:ring-[#E0E5EB]/20"
              autoFocus
            />
            
            <button 
              type="submit"
              disabled={!idea.trim() || loading || success}
              className="mt-3 flex w-full items-center justify-center rounded-2xl bg-[#E0E5EB] py-2.5 text-sm font-medium text-[#101417] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              style={{ fontFamily: 'var(--font-brand-display)' }}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 
               success ? <span className="flex items-center gap-2"><Check size={18} className="text-green-600" /> Saved</span> : 
               "Guardar idea"}
            </button>
          </form>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E0E5EB] text-[#101417] shadow-lg transition-transform hover:scale-105 active:scale-95"
          aria-label="Capturar idea"
        >
          <MessageSquarePlus size={24} />
        </button>
      )}
    </div>
  );
}
