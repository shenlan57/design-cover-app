
import React, { useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

const DESIGN_PRESETS = [
  {
    id: 'VOGUE',
    name: '时尚画报',
    thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&h=600&auto=format&fit=crop',
    prompt: 'Professional fashion magazine cover, vibrant studio lighting, high saturation, elegant serif fonts, Vogue aesthetic, sharp colors.'
  },
  {
    id: 'CYBER',
    name: '霓虹幻想',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400&h=600&auto=format&fit=crop',
    prompt: 'Vibrant cyberpunk neon, glowing typography, saturated electric blues and pinks, futuristic energy, ultra-vivid colors.'
  },
  {
    id: 'CINEMA',
    name: '电影质感',
    thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=400&h=600&auto=format&fit=crop',
    prompt: 'Cinematic Hollywood poster, rich warm tones, dramatic vibrant lighting, classic movie titling, high dynamic range.'
  },
  {
    id: 'LUXURY',
    name: '高级静奢',
    thumbnail: 'https://images.unsplash.com/photo-1544450181-29597f6ee557?q=80&w=400&h=600&auto=format&fit=crop',
    prompt: 'Luxury brand aesthetic, clean layout with golden accents, premium materials, high-end commercial photography.'
  }
];

const App = () => {
  const [videoFrame, setVideoFrame] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState(DESIGN_PRESETS[0]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      video.currentTime = video.duration / 4;
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      setVideoFrame(canvas.toDataURL('image/jpeg', 0.9));
      setLoading(false);
      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      setError("视频格式不支持");
      setLoading(false);
    };
  };

  const startDesign = async () => {
    if (!videoFrame) return;
    setLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      const base64Data = videoFrame.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
            { text: `RECONSTRUCT AS A HIGH-END 9:16 COVER. 
              MANDATORY: USE FULL COLOR, VIBRANT SATURATION, NO GRAYSCALE.
              TITLE: "${title || 'MUSE'}" in elegant typography.
              STYLE: ${selectedStyle.prompt}.
              Keep the subject person identical but professionally edited.` }
          ]
        },
        config: { imageConfig: { aspectRatio: "9:16" } }
      });

      const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (imagePart?.inlineData) {
        setResult(`data:image/png;base64,${imagePart.inlineData.data}`);
      } else {
        throw new Error("生成失败");
      }
    } catch (err) {
      setError("AI 暂时休息了，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-viewport scrollbar-hide flex flex-col">
      <header className="px-6 pt-10 pb-4 flex justify-between items-end shrink-0">
        <div>
          <h1 className="font-display italic text-2xl gold-text leading-none tracking-tight">V-Cover Pro</h1>
          <p className="text-[8px] tracking-[0.4em] text-zinc-600 uppercase mt-1">AI Editorial Design</p>
        </div>
        <div className="text-[10px] text-zinc-500 font-mono">v2.3</div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 space-y-6 pb-40 scrollbar-hide">
        <section className="relative w-full aspect-[9/16] rounded-[2.5rem] overflow-hidden shadow-2xl bg-zinc-900/50 border border-white/5">
          {loading && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl">
              <div className="w-10 h-1 bg-amber-500 animate-pulse mb-4 rounded-full"></div>
              <p className="text-[10px] tracking-[0.4em] text-amber-200 uppercase animate-pulse">正在构筑色彩排版</p>
            </div>
          )}
          
          {result ? (
            <img src={result} className="w-full h-full object-cover animate-in fade-in duration-700" />
          ) : videoFrame ? (
            <img src={videoFrame} className="w-full h-full object-cover opacity-50 grayscale" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 cursor-pointer" onClick={() => fileRef.current?.click()}>
              <div className="w-16 h-16 rounded-full border border-dashed border-zinc-700 flex items-center justify-center">
                <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="1.5"/></svg>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500">上传视频素材</p>
            </div>
          )}
        </section>

        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">选择风格</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {DESIGN_PRESETS.map(s => (
                <div 
                  key={s.id} onClick={() => setSelectedStyle(s)} 
                  className={`flex-shrink-0 w-20 aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${selectedStyle.id === s.id ? 'border-amber-500 scale-95 shadow-lg shadow-amber-500/20' : 'border-transparent opacity-40 grayscale'}`}
                >
                  <img src={s.thumbnail} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">封面标题</h3>
            <input 
              value={title} onChange={e => setTitle(e.target.value)} 
              placeholder="输入标题 (如: SUMMER)" 
              className="w-full bg-zinc-900/50 border-b border-zinc-800 text-[11px] py-3 focus:border-amber-500 outline-none text-zinc-200 px-2"
            />
          </div>
        </div>
      </main>

      <footer className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent z-50">
        <div className="flex gap-3 max-w-[400px] mx-auto">
          <button onClick={() => fileRef.current?.click()} className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center active:scale-90 transition-all">
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="1.5"/></svg>
          </button>
          <input ref={fileRef} type="file" className="hidden" accept="video/*" onChange={handleVideoUpload} />
          
          <button 
            onClick={startDesign} disabled={!videoFrame || loading}
            className={`flex-1 rounded-2xl text-[11px] font-bold uppercase tracking-[0.3em] transition-all active:scale-95 ${!videoFrame || loading ? 'bg-zinc-800 text-zinc-700' : 'bg-white text-black shadow-xl'}`}
          >
            {loading ? '处理中...' : '生成彩色封面'}
          </button>

          {result && (
            <button 
              onClick={() => { const a = document.createElement('a'); a.href = result; a.download = 'vcover-pro.png'; a.click(); }} 
              className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg active:scale-90 transition-all"
            >
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth="2.5"/></svg>
            </button>
          )}
        </div>
        {error && <p className="text-[9px] text-red-500 text-center mt-3 uppercase tracking-tighter">{error}</p>}
      </footer>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
