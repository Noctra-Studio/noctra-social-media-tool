"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Search, Wand2, Image as ImageIcon, Save, Check, LayoutPanelLeft, ChevronLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { consumeVisualEditorDraft } from '@/lib/visual-editor-draft';

type ImageObj = {
  id: string;
  url: string;
  thumb_url: string;
  photographer?: string;
  on_brand_score?: number;
  score_reason?: string;
};

type LibraryImage = ImageObj & {
  saved_at?: string;
};

function VisualEditorContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const initialKeywords = searchParams?.get('keywords') || '';

  const [mode, setMode] = useState<"unsplash" | "generate">("unsplash");
  const [platform, setPlatform] = useState<"instagram" | "linkedin" | "x">("instagram");
  
  // Unsplash State
  const [keywords, setKeywords] = useState(initialKeywords);
  const [unsplashImages, setUnsplashImages] = useState<ImageObj[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Generate State
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Minimal");
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<ImageObj | null>(null);

  // Editor State
  const [selectedImage, setSelectedImage] = useState<ImageObj | null>(null);
  const [overlayText, setOverlayText] = useState("");
  const [textPlacement, setTextPlacement] = useState<"top" | "center" | "bottom">("center");
  const [textColor, setTextColor] = useState("#0A0A0A");
  const [bgNeeded, setBgNeeded] = useState(false);
  const [autoPlacing, setAutoPlacing] = useState(false);
  
  // Biblioteca
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryImages, setLibraryImages] = useState<LibraryImage[]>([]);
  const [filterBrand, setFilterBrand] = useState(false);

  // Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const draft = consumeVisualEditorDraft();

    if (!draft) {
      return;
    }

    setPlatform(draft.platform);
    setKeywords(draft.query);
    setPrompt(draft.slide.visual_direction || draft.query);
    setOverlayText(draft.slide.headline || draft.slide.body || '');
    setTextColor('#ffffff');
    setTextPlacement(
      draft.slide.type === 'cover' ? 'bottom' : draft.slide.type === 'content' ? 'top' : 'center'
    );
    setMode(draft.background.type === 'image' || draft.background.imageUrl ? 'unsplash' : 'generate');
    setBgNeeded(Boolean(draft.background.imageUrl));

    if (draft.background.imageUrl) {
      setSelectedImage({
        id: `draft_${draft.slide.slide_number}`,
        url: draft.background.imageUrl,
        thumb_url: draft.background.imageThumb || draft.background.imageUrl,
        photographer: draft.background.photographer,
        on_brand_score: 1,
      });
    }
  }, []);

  const searchUnsplash = async () => {
    if (!keywords.trim()) return;
    setSearching(true);
    try {
      const res = await fetch('/api/visual/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: keywords.split(','), platform })
      });
      const data = await res.json();
      if (data.photos) {
        setUnsplashImages(data.photos);
        // Fire progressive scorings
        data.photos.forEach((photo: ImageObj) => {
          scoreSingleImage(photo);
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const scoreSingleImage = async (img: ImageObj) => {
    try {
      const res = await fetch('/api/visual/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: [img], brand_context: "Noctra Studio (Digital Agency)" })
      });
      const data = await res.json();
      if (data.images && data.images.length > 0) {
        setUnsplashImages(prev => prev.map(p => p.id === img.id ? data.images[0] : p));
      }
    } catch (err) {
      console.error('Failed to score', img.id, err);
    }
  };

  const generateImage = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/visual/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, platform, style })
      });
      const data = await res.json();
      if (data.image_url) {
        setGeneratedImage({
          id: `gen_${Date.now()}`,
          url: data.image_url,
          thumb_url: data.image_url,
          on_brand_score: 1.0, // Auto on-brand since we forced the prompt
          score_reason: 'Generated via brand template'
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const openEditor = (img: ImageObj) => {
    setSelectedImage(img);
  };

  const getOverlaySuggestion = async () => {
    if (!selectedImage || !overlayText.trim()) return;
    setAutoPlacing(true);
    try {
      const res = await fetch('/api/visual/overlay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: selectedImage.url, text: overlayText, platform })
      });
      const data = await res.json();
      if (data.placement) setTextPlacement(data.placement);
      if (data.text_color) setTextColor(data.text_color);
      if (data.bg_needed !== undefined) setBgNeeded(data.bg_needed);
    } catch (err) {
      console.error(err);
    } finally {
      setAutoPlacing(false);
    }
  };

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedImage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Platform aspect ratios
    const width = 1080;
    let height = 1080; // IG default 1:1
    if (platform === 'linkedin' || platform === 'x') {
      height = 565; // 1.91:1 approx 1080x565
    }

    canvas.width = width;
    canvas.height = height;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Cover logic
      const scale = Math.max(width / img.width, height / img.height);
      const x = (width / 2) - (img.width / 2) * scale;
      const y = (height / 2) - (img.height / 2) * scale;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      if (overlayText) {
        if (bgNeeded) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
          ctx.fillRect(0, 0, width, height);
        }

        ctx.fillStyle = textColor;
        ctx.font = "bold 60px 'Space Grotesk', Syne, sans-serif";
        ctx.textAlign = "center";
        
        // simple word wrapping
        const words = overlayText.split(' ');
        let line = '';
        const lines = [];
        const maxWidth = width * 0.8;

        for(let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
          } else {
            line = testLine;
          }
        }
        lines.push(line);

        const lineHeight = 70;
        const totalTextHeight = lines.length * lineHeight;

        let startY = 0;
        if (textPlacement === 'top') startY = 150;
        else if (textPlacement === 'center') startY = (height / 2) - (totalTextHeight / 2) + 30;
        else if (textPlacement === 'bottom') startY = height - totalTextHeight - 50;

        for(let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], width / 2, startY + (i * lineHeight));
        }
      }
    };
    img.src = selectedImage.url;
  }, [bgNeeded, overlayText, platform, selectedImage, textColor, textPlacement]);

  useEffect(() => {
    if (selectedImage && canvasRef.current) {
      renderCanvas();
    }
  }, [renderCanvas, selectedImage]);

  const saveToLibrary = async () => {
    if (!selectedImage) return;
    try {
      await supabase.from('image_library').insert([{
        unsplash_id: selectedImage.id.startsWith('gen_') ? null : selectedImage.id,
        url: selectedImage.url,
        thumb_url: selectedImage.thumb_url,
        photographer: selectedImage.photographer || 'Gemini Imagen',
        on_brand_score: selectedImage.on_brand_score || 1.0,
      }]);
      alert("Saved to Biblioteca!");
      loadLibrary();
    } catch(err) {
      console.error(err);
    }
  };

  const loadLibrary = useCallback(async () => {
    let query = supabase.from('image_library').select('*').order('saved_at', { ascending: false });
    if (filterBrand) {
      query = query.gte('on_brand_score', 0.7);
    }
    const { data } = await query;
    if (data) setLibraryImages(data);
  }, [filterBrand, supabase]);

  useEffect(() => {
    if (libraryOpen) loadLibrary();
  }, [libraryOpen, loadLibrary]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 flex h-[calc(100vh-4rem)] duration-300">
      {/* LEFT PANEL */}
      <div className="w-1/2 overflow-y-auto pr-6 border-r border-zinc-800">
        <div className="mb-6 flex items-center gap-4 border-b border-zinc-800 pb-4">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors"
          >
            <ChevronLeft size={14} /> Volver a tu post
          </button>
          <div className="h-4 w-[1px] bg-zinc-800" />
          <h1 className="text-sm font-bold text-zinc-300">Explorador Visual</h1>
        </div>
        
        <div className="flex gap-4 mb-6">
          <button onClick={() => setMode("unsplash")} className={`px-4 py-2 rounded-lg font-semibold ${mode==="unsplash"?'bg-zinc-800 text-white':'text-zinc-500'}`}>Unsplash Search</button>
          <button onClick={() => setMode("generate")} className={`px-4 py-2 rounded-lg font-semibold ${mode==="generate"?'bg-zinc-800 text-white':'text-zinc-500'}`}>Gemini Generate</button>
        </div>

        {/* Platform selection removed */}

        {mode === "unsplash" ? (
          <div className="space-y-6">
            <div className="flex gap-2">
              <input 
                value={keywords} onChange={e=>setKeywords(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchUnsplash()}
                placeholder="Keywords (e.g. tech, minimal, office)"
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none"
              />
              <button 
                onClick={searchUnsplash} disabled={searching}
                className="bg-white text-black px-4 rounded-lg font-bold disabled:opacity-50"
              >
                {searching ? <Loader2 className="animate-spin" size={20}/> : <Search size={20}/>}
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {unsplashImages.map((img) => (
                <div key={img.id} className="relative aspect-square cursor-pointer group rounded-lg overflow-hidden border border-zinc-800" onClick={() => openEditor(img)}>
                  <Image src={img.thumb_url} alt="" fill className="object-cover group-hover:scale-105 transition-transform" />
                  {img.on_brand_score !== undefined && (
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold ${img.on_brand_score >= 0.7 ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                      {(img.on_brand_score * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <textarea 
              value={prompt} onChange={e=>setPrompt(e.target.value)}
              placeholder="Describe the image you want..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white h-32 focus:outline-none"
            />
            <div className="flex justify-between items-center">
              <select value={style} onChange={e=>setStyle(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white">
                <option>Minimal</option>
                <option>Editorial</option>
                <option>Abstract</option>
                <option>Photography</option>
              </select>
              <button 
                onClick={generateImage} disabled={generating || !prompt}
                className="bg-white text-black px-6 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
              >
                {generating ? <Loader2 className="animate-spin" size={18}/> : <Wand2 size={18}/>}
                Generate
              </button>
            </div>
            {generatedImage && (
              <div className="relative aspect-[16/9] mt-8 cursor-pointer rounded-lg overflow-hidden border border-zinc-700 hover:border-zinc-500" onClick={() => openEditor(generatedImage)}>
                <Image src={generatedImage.url} alt="Generated" fill className="object-cover" />
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                   <p className="text-white font-bold">Edit Overlay</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Overlay Editor */}
      <div className="w-1/2 pl-6 flex flex-col items-center">
        {!selectedImage ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600">
            <ImageIcon size={64} className="mb-4 opacity-50" />
            <p>Select an image to edit overlay</p>
          </div>
        ) : (
          <div className="w-full space-y-6 max-h-full overflow-y-auto pb-12">
            <div className="sticky top-0 bg-zinc-950 pb-4 z-10 flex justify-between items-center">
              <h2 className="text-xl font-bold">Overlay Editor</h2>
              <button onClick={() => setLibraryOpen(true)} className="text-sm flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-lg hover:bg-zinc-800 border border-zinc-700">
                <LayoutPanelLeft size={16}/> Biblioteca
              </button>
            </div>

            <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/50 flex items-center justify-center p-4">
              {/* Canvas acts as preview */}
              <canvas 
                ref={canvasRef} 
                className="max-w-full h-auto shadow-2xl rounded"
                style={{ maxHeight: '500px' }}
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Overlay Text</label>
                <textarea 
                  value={overlayText} onChange={e=>setOverlayText(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white h-24 focus:outline-none"
                />
              </div>

              <div className="flex gap-4 items-end">
                <button 
                  onClick={getOverlaySuggestion} disabled={autoPlacing || !overlayText}
                  className="bg-green-500/10 text-green-400 border border-green-500/30 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-green-500/20 disabled:opacity-50"
                >
                  {autoPlacing ? <Loader2 className="animate-spin" size={16}/> : <Wand2 size={16}/>}
                  Auto-Suggest Layout
                </button>
              </div>

              <div className="flex gap-8">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">Placement</label>
                  <div className="flex gap-2">
                    {(["top","center","bottom"] as const).map(p => (
                      <button key={p} onClick={()=>setTextPlacement(p)} className={`px-3 py-1 rounded ${textPlacement===p?'bg-white text-black':'bg-zinc-800'}`}>{p}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">Text Color</label>
                  <div className="flex gap-2">
                    {["#ffffff","#0A0A0A","#E8FF00"].map(c => (
                      <button key={c} onClick={()=>setTextColor(c)} className={`w-8 h-8 rounded-full border-2 ${textColor===c?'border-zinc-500':'border-transparent'}`} style={{backgroundColor: c}} />
                    ))}
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer mt-4">
                <input type="checkbox" checked={bgNeeded} onChange={e=>setBgNeeded(e.target.checked)} className="rounded bg-zinc-900 border-zinc-800 text-green-500 focus:ring-green-500" />
                <span className="text-sm">Darken background (enhance readability)</span>
              </label>

              <div className="flex gap-4 pt-6 border-t border-zinc-800">
                <button onClick={saveToLibrary} className="flex-1 bg-zinc-800 text-white font-semibold rounded-lg py-3 flex justify-center items-center gap-2 hover:bg-zinc-700">
                  <Save size={18}/> Guardar en biblioteca
                </button>
                <button className="flex-1 bg-white text-black font-semibold rounded-lg py-3 flex justify-center items-center gap-2 hover:bg-zinc-200">
                  <Check size={18}/> Usar en post
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Library Sidebar Overlay */}
      {libraryOpen && (
        <div className="fixed inset-y-0 right-0 w-96 bg-zinc-950 border-l border-zinc-800 shadow-2xl p-6 overflow-y-auto z-50 animate-in slide-in-from-right-10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2"><LayoutPanelLeft size={20}/> Biblioteca</h3>
            <button onClick={()=>setLibraryOpen(false)} className="text-zinc-500 hover:text-white">✕</button>
          </div>
          
          <label className="flex items-center gap-2 mb-6 cursor-pointer text-sm">
            <input type="checkbox" checked={filterBrand} onChange={e=>setFilterBrand(e.target.checked)} className="rounded" />
            Sólo On-Brand (Score ≥ 70%)
          </label>

          <div className="grid grid-cols-2 gap-3">
             {libraryImages.map(img => (
               <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-zinc-800 group cursor-pointer" onClick={() => { setSelectedImage(img); setLibraryOpen(false); }}>
                 <Image src={img.thumb_url} alt="" fill className="object-cover group-hover:scale-105 transition-transform" />
                 <div className="absolute bottom-0 w-full bg-black/80 px-2 py-1 text-xs text-center border-t border-zinc-800 text-green-400 font-mono">
                    {((img.on_brand_score ?? 0) * 100).toFixed(0)}% Fit
                 </div>
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VisualPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500">Loading Visual Editor...</div>}>
      <VisualEditorContent />
    </Suspense>
  );
}
