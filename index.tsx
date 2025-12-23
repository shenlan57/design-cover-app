import React, { useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

const DESIGN_PRESETS = [
  {
    id: 'VOGUE',
    name: '时尚大片',
    thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=300&h=400&fit=crop',
    prompt: 'Professional fashion magazine cover, VIBRANT STUDIO COLORS, high saturation, sharp lighting, editorial layout.'
  },
  {
    id: 'CYBER',
    name: '霓虹都市',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=300&h=400&fit=crop',
    prompt: 'Vivid cyberpunk neon style, glowing colors, saturated pink and cyan, futuristic energy, bold typography.'
  },
  {
    id: 'CINEMA',
    name: '好莱坞',
    thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=300&h=400&fit=crop',
    prompt: 'Cinematic blockbuster movie poster, rich warm color grading, dramatic lighting, high dynamic range, sharp details.'
  },
  {
    id: 'LUXURY',
    name: '极致奢华',
    thumbnail: 'https://images.unsplash.com/photo-1544450181-29597f6ee557?q=80&w=300&h=400&fit=crop',
    prompt: 'Luxury brand aesthetic, clean golden accents, premium vibrant background, commercial studio lighting.'
  }
];

const App = () => {
  const [frame, setFrame] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [style, setStyle] = useState(DESIGN_PRESETS[0]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setResult(null);
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.onloadedmetadata = () => video.currentTime = video.duration / 4;
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      setFrame(canvas.toDataURL('image/jpeg'));
      setLoading(false);
      URL.revokeObjectURL(video.src);
    };
  };

  const generate = async () => {
    if (!frame) return;
    setLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      const base64 = frame.split(',')[1];
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64 } },
            { text: `CREATE A PROFESSIONAL 9:16 COVER.
              MANDATORY RULES:
              1. NO GRAYSCALE. USE FULL VIBRANT COLORS ONLY.
              2. HIGH SATURATION: Enhance all colors from the original.
              3. TEXT: Add title "${title || 'MUSE'}" in elegant 3D typography.
              4. STYLE: ${style.prompt}
              Ensure the person is identical but enhanced by studio color grading.` }
          ]
        },
        config: { imageConfig: { aspectRatio: "9:16" } }
      });

      const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (imagePart?.inlineData) {
        setResult(`data:image/png;base64,${imagePart.inlineData.data}`);
      }
    } catch (err) {
      setError("AI 引擎繁忙，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result;
    link.download = 'v-cover-design.png';
    link.click();
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold gold-gradient italic tracking-tight">V-Cover</h1>
          <p className="text-[9px] tracking-[0.4em] text-zinc-600 uppercase">Aesthetic Lab</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-[10px] text-zinc-500">
          PRO
        </div>
      </header>

      {/* Main Preview */}
      <main className="flex-1 overflow-y-auto px-6 space-y-6 scrollbar-hide pb-32">
        <div className="relative w-full aspect-[9/16] rounded-[2.5rem] bg-zinc-900/50 border border-white/5 overflow-hidden shadow-2xl transition-all">
          {loading && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
              <div className="w-12 h-1 bg-amber-500 animate-pulse rounded-full mb-4"></div>
              <p className="text-[10px] tracking-[0.4em] text-amber-200 uppercase animate-bounce">正在重绘色彩</p>
            </div>
          )}
          
          {result ? (
            <img src={result} className="w-full h-full object-cover animate-in fade-in zoom-in duration-500" />
          ) : frame ? (
            <img src={frame} className="w-full h-full object-cover opacity-60" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-14 h-14 rounded-full border border-dashed border-zinc-700 flex items-center justify-center">
                <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="1.5"/></svg>
              </div>
              <p className="text-[10px] tracking-widest text-zinc-600 uppercase">点击上传视频</p>
            </div>
          )}
        </div>

        {/* Form Controls */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">选择设计风格</h3>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {DESIGN_PRESETS.map(p => (
                <div 
                  key={p.id} onClick={() => setStyle(p)}
                  className={`flex-shrink-0 w-20 aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${style.id === p.id ? 'border-amber-500 scale-95 shadow-lg shadow-amber-500/20' : 'border-transparent opacity-40 grayscale'}`}
                >
                  <img src={p.thumbnail} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 pb-10">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">封面标题内容</h3>
            <input 
              value={title} onChange={e => setTitle(e.target.value)} 
              placeholder="例如: MUSE, GLOW..." 
              className="w-full bg-zinc-900/50 border-b border-zinc-800 text-xs py-3 px-2 focus:border-amber-500 outline-none transition-all text-zinc-200"
            />
          </div>
        </div>
      </main>

      {/* Floating Action Bar */}
      <footer className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-50">
        <div className="flex gap-3 max-w-[400px] mx-auto">
          <button onClick={() => fileInputRef.current?.click()} className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center active:scale-90 transition-all">
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="1.5"/></svg>
          </button>
          <input ref={fileInputRef} type="file" className="hidden" accept="video/*" onChange={onUpload} />
          
          <button 
            onClick={generate} disabled={!frame || loading}
            className={`flex-1 h-14 rounded-2xl text-[11px] font-bold uppercase tracking-[0.3em] transition-all active:scale-95 ${!frame || loading ? 'bg-zinc-800 text-zinc-600' : 'bg-white text-black shadow-xl'}`}
          >
            {loading ? 'AI 设计中' : '生成彩色封面'}
          </button>

          {result && (
            <button 
              onClick={download}
              className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg active:scale-90 transition-all"
            >
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth="2.5"/></svg>
            </button>
          )}
        </div>
        {error && <p className="text-[9px] text-red-500 text-center mt-3 tracking-tighter uppercase">{error}</p>}
      </footer>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
