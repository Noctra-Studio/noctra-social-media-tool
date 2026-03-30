"use client";

import { useState } from 'react';
import { Star, Loader2, CheckCircle2 } from 'lucide-react';

export function PostFeedback({ postId }: { postId: string }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [usedAsPublished, setUsedAsPublished] = useState(false);
  const [edited, setEdited] = useState(false);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle'|'submitting'|'success'>('idle');

  const handleSubmit = async () => {
    if (rating === 0) return;
    setStatus('submitting');
    
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          rating,
          used_as_published: usedAsPublished,
          edited_before_publish: edited,
          notes
        })
      });
      setStatus('success');
    } catch (err) {
      setStatus('idle');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-xl flex items-center gap-3">
        <CheckCircle2 />
        <div>
          <p className="font-bold">Feedback guardado</p>
          <p className="text-sm opacity-80">La IA aprenderá de esto para futuros posts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="font-bold mb-4 text-sm uppercase text-zinc-500">Feedback de Rendimiento</h3>
      
      {/* Stars */}
      <div className="flex gap-1 mb-6">
        {[1,2,3,4,5].map(star => (
          <button
            key={star}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star 
              size={28}
              fill={(hoverRating || rating) >= star ? '#E8FF00' : 'transparent'}
              color={(hoverRating || rating) >= star ? '#E8FF00' : '#4E576A'}
            />
          </button>
        ))}
      </div>

      <div className="space-y-4 mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input 
            type="checkbox" 
            className="w-5 h-5 accent-[#E8FF00] bg-zinc-950 border-zinc-700 rounded"
            checked={usedAsPublished}
            onChange={(e) => setUsedAsPublished(e.target.checked)}
          />
          <span className="text-sm text-zinc-300">¿Publicaste este post tal cual?</span>
        </label>
        
        <label className="flex items-center gap-3 cursor-pointer">
          <input 
            type="checkbox" 
            className="w-5 h-5 accent-[#E8FF00] bg-zinc-950 border-zinc-700 rounded"
            checked={edited}
            onChange={(e) => setEdited(e.target.checked)}
          />
          <span className="text-sm text-zinc-300">¿Lo editaste antes de publicar?</span>
        </label>
      </div>

      <textarea 
        placeholder="¿Qué cambiarías? (Opcional)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white mb-4 focus:outline-none focus:border-zinc-500 min-h-[80px]"
      />

      <button 
        onClick={handleSubmit} 
        disabled={rating === 0 || status === 'submitting'}
        className="w-full bg-[#E8FF00] text-black font-bold py-2 rounded-lg disabled:opacity-50 flex justify-center items-center"
      >
        {status === 'submitting' ? <Loader2 className="animate-spin" size={20}/> : 'Guardar feedback'}
      </button>
    </div>
  );
}
