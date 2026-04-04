'use client';

import { useState, useRef } from 'react';
import UploadArea from '@/components/UploadArea';
import BeforeAfter from '@/components/BeforeAfter';

type Resolution = '2k' | '4k';

function computeAspectRatio(w: number, h: number): string {
  if (w === 0 || h === 0) return '1:1';
  const ratio = w / h;
  if (ratio > 1.5) return '16:9';
  if (ratio < 0.75) return '2:3';
  return '1:1';
}

export default function UpscalePage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [resolution, setResolution] = useState<Resolution>('2k');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [upscaledUrl, setUpscaledUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<File | null>(null);

  function handleFile(file: File, url: string) {
    fileRef.current = file;
    setPreview(url);
    setDone(false);
    setUpscaledUrl(null);
    setError(null);
    const img = new Image();
    img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
  }

  async function handleUpscale() {
    const file = fileRef.current;
    if (!file || !preview) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('aspectRatio', computeAspectRatio(dims.w, dims.h));
      const res = await fetch('/api/upscale', { method: 'POST', body: form });
      const data = await res.json();
      if (data.upscaledDataUrl) {
        setUpscaledUrl(data.upscaledDataUrl);
        setDone(true);
      } else {
        setError(data.error ?? 'Erro ao processar imagem.');
      }
    } catch {
      setError('Falha na conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    const src = upscaledUrl ?? preview;
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = `foto-${resolution}.png`;
    a.click();
  }

  const resLabel = resolution === '2k' ? '2048px' : '4096px';

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Melhorar resolução</h1>
      <p className="text-gray-400 mb-8">Transforme fotos borradas em imagens nítidas de alta resolução</p>

      {!preview && (
        <UploadArea preview={null} onFile={handleFile} onClear={() => {}} />
      )}

      {preview && !done && (
        <div className="fade-in">
          <UploadArea
            preview={preview}
            onFile={handleFile}
            onClear={() => { setPreview(null); setDone(false); fileRef.current = null; }}
          />

          {dims.w > 0 && (
            <p className="text-sm text-gray-400 mt-4">
              Resolução atual: <span className="text-white font-medium">{dims.w} x {dims.h}</span>
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 mt-4">
            <ResCard
              active={resolution === '2k'}
              onClick={() => setResolution('2k')}
              title="2K (2048px)"
              subtitle="Ideal para redes sociais"
            />
            <ResCard
              active={resolution === '4k'}
              onClick={() => setResolution('4k')}
              title="4K (4096px)"
              subtitle="Qualidade profissional"
              badge="Pro"
            />
          </div>

          <button
            onClick={handleUpscale}
            disabled={loading}
            className="w-full mt-6 py-3 rounded-xl font-medium bg-gradient-to-r from-violet-600 to-purple-600 text-white cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? <span className="spinner mx-auto" /> : 'Melhorar resolução'}
          </button>

          {error && (
            <p className="mt-3 text-sm text-red-400 text-center">{error}</p>
          )}
        </div>
      )}

      {done && preview && (
        <div className="fade-in">
          <BeforeAfter beforeSrc={preview} afterSrc={upscaledUrl ?? preview} />
          <p className="text-center text-sm text-gray-400 mt-3">
            Resolução melhorada para <span className="text-white font-medium">{resLabel}</span>
          </p>
          <button
            onClick={handleDownload}
            className="w-full mt-4 py-3 rounded-xl font-medium bg-gradient-to-r from-violet-600 to-purple-600 text-white cursor-pointer hover:opacity-90 transition-opacity"
          >
            Baixar em alta resolução
          </button>
          <button
            onClick={() => { setDone(false); setUpscaledUrl(null); }}
            className="w-full mt-2 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            Tentar novamente
          </button>
        </div>
      )}
    </main>
  );
}

function ResCard({ active, onClick, title, subtitle, badge }: {
  active: boolean; onClick: () => void; title: string; subtitle: string; badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative p-4 rounded-xl border text-left cursor-pointer transition-all ${
        active ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'
      }`}
    >
      {badge && (
        <span className="absolute top-2 right-2 text-[10px] bg-violet-600 text-white px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </button>
  );
}
