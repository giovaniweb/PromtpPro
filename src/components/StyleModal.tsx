'use client';

import { useEffect, useState, useCallback } from 'react';
import { StyleItem } from '@/data';
import UploadArea from './UploadArea';

interface Props {
  style: StyleItem;
  onClose: () => void;
}

export default function StyleModal({ style, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [error, setError] = useState<string | null>(null);

  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [handleEsc]);

  function handleFile(f: File, url: string) {
    setFile(f);
    setPreview(url);
    setGeneratedUrl(null);
    setGeneratedPrompt(null);
    setError(null);
  }

  function handleClear() {
    setFile(null);
    setPreview(null);
    setGeneratedUrl(null);
    setGeneratedPrompt(null);
    setError(null);
  }

  async function handleAnalyze() {
    if (!file) return;
    setAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('styleImageUrl', style.thumbnail);

      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao gerar prompt');
      setGeneratedPrompt(data.fusionPrompt);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar prompt. Tente novamente.');
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleGenerate() {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('styleImageUrl', style.thumbnail);
      formData.append('promptEn', style.prompt_en);
      formData.append('aspectRatio', aspectRatio);
      formData.append('styleId', style.id);
      if (generatedPrompt) {
        formData.append('precomputedPrompt', generatedPrompt);
      }

      const res = await fetch('/api/generate', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao gerar imagem');
      setGeneratedUrl(data.imageDataUrl);
      if (data.fusionPrompt && !generatedPrompt) setGeneratedPrompt(data.fusionPrompt);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!generatedUrl) return;
    const a = document.createElement('a');
    a.href = generatedUrl;
    a.download = `promptpro-${style.id}-${Date.now()}.png`;
    a.click();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-[#12121a] border border-white/10 p-5">
        {/* Fechar */}
        <button onClick={onClose} className="absolute top-3 right-4 text-gray-400 hover:text-white cursor-pointer text-2xl leading-none">
          &times;
        </button>

        {/* Foto de exemplo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={style.thumbnail} alt={style.title} className="w-full rounded-xl mb-4 object-cover max-h-64" />
        <h2 className="text-xl font-bold mb-4">{style.title}</h2>
        <div className="border-t border-white/10 mb-4" />

        {/* Prompt do estilo */}
        {style.prompt_en && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Prompt do estilo</span>
              <button
                onClick={() => navigator.clipboard.writeText(style.prompt_en)}
                className="text-xs text-violet-400 hover:text-violet-300 cursor-pointer"
              >
                ⎘ Copiar
              </button>
            </div>
            <div className="bg-black/40 rounded-lg p-3 border border-white/10 max-h-28 overflow-y-auto">
              <p className="text-xs text-gray-400 whitespace-pre-wrap leading-relaxed">{style.prompt_en}</p>
            </div>
          </div>
        )}

        {/* Upload */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm text-gray-400">Sua foto</h3>
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-600/20 to-amber-500/20 border border-violet-500/30 text-violet-300">
            ✦ Premium · 1 crédito
          </span>
        </div>
        <UploadArea preview={preview} onFile={handleFile} onClear={handleClear} />

        {/* Configurações */}
        <div className="mt-4">
          <p className="text-sm text-gray-400 mb-2">Proporção</p>
          <div className="flex gap-2">
            {(['9:16', '16:9'] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
                  aspectRatio === ratio
                    ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                }`}
              >
                {ratio === '9:16' ? '9:16 Stories' : '16:9 Widescreen'}
              </button>
            ))}
          </div>
        </div>

        {/* Botão Gerar Prompt */}
        <button
          disabled={!file || analyzing || loading}
          onClick={handleAnalyze}
          className={`w-full mt-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
            file && !analyzing && !loading
              ? 'bg-white/10 text-gray-200 hover:bg-white/15 border border-white/15 cursor-pointer'
              : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'
          }`}
        >
          {analyzing ? (
            <>
              <span className="spinner" />
              <span>Analisando...</span>
            </>
          ) : (
            <>
              <span className="text-violet-400">✦</span>
              {generatedPrompt ? 'Regenerar Prompt' : 'Gerar Prompt'} — Grátis
            </>
          )}
        </button>

        {/* Prompt gerado (editável) */}
        {generatedPrompt && (
          <div className="mt-3 fade-in">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Prompt gerado</span>
              <button
                onClick={() => navigator.clipboard.writeText(generatedPrompt)}
                className="text-xs text-violet-400 hover:text-violet-300 cursor-pointer"
              >
                Copiar
              </button>
            </div>
            <textarea
              value={generatedPrompt}
              onChange={(e) => setGeneratedPrompt(e.target.value)}
              rows={5}
              className="w-full bg-black/40 rounded-lg p-3 text-xs text-gray-300 border border-white/10 focus:border-violet-500/50 focus:outline-none resize-none"
            />
          </div>
        )}

        {/* Botão Gerar Imagem */}
        {!generatedUrl && (
          <button
            disabled={!file || loading || analyzing}
            onClick={handleGenerate}
            className={`w-full mt-3 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              file && !loading && !analyzing
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:opacity-90 cursor-pointer'
                : 'bg-white/10 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <span className="spinner" />
                <span className="text-sm text-gray-300">Gerando sua foto...</span>
              </>
            ) : (
              <>
                Gerar Imagem
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">1 crédito</span>
              </>
            )}
          </button>
        )}

        {/* Erro */}
        {error && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Resultado gerado */}
        {generatedUrl && (
          <div className="mt-4 fade-in">
            <p className="text-sm text-green-400 mb-2 font-medium">✓ Foto gerada com sucesso!</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={generatedUrl} alt="Foto gerada" className="w-full rounded-xl mb-3" />
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium text-sm cursor-pointer hover:opacity-90"
              >
                Baixar foto
              </button>
              <button
                onClick={() => { setGeneratedUrl(null); setError(null); }}
                className="px-4 py-2.5 rounded-xl bg-white/10 text-gray-300 text-sm cursor-pointer hover:bg-white/15"
              >
                Gerar novamente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
