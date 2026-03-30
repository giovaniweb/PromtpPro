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
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);

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
    setError(null);
  }

  function handleClear() {
    setFile(null);
    setPreview(null);
    setGeneratedUrl(null);
    setError(null);
  }

  async function handleGenerate() {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('styleImageUrl', style.thumbnail); // imagem de referência de estilo
      formData.append('promptEn', style.prompt_en);
      formData.append('aspectRatio', style.aspect_ratio);
      formData.append('styleId', style.id);

      const res = await fetch('/api/generate', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao gerar imagem');
      setGeneratedUrl(data.imageDataUrl);
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

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
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

        {/* Upload */}
        <h3 className="text-sm text-gray-400 mb-2">Sua foto</h3>
        <UploadArea preview={preview} onFile={handleFile} onClear={handleClear} />

        {/* Botão Gerar */}
        {!generatedUrl && (
          <button
            disabled={!file || loading}
            onClick={handleGenerate}
            className={`w-full mt-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              file && !loading
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:opacity-90 cursor-pointer'
                : 'bg-white/10 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <span className="spinner" />
                <span className="text-sm text-gray-300">Gerando sua foto...</span>
              </>
            ) : 'Gerar minha foto'}
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
                className="px-4 py--2.5 rounded-xl bg-white/10 text-gray-300 text-sm cursor-pointer hover:bg-white/15"
              >
                Gerar novamente
              </button>
            </div>
          </div>
        )}

        {/* Prompts colapsáveis */}
        <div className="mt-5">
          <button
            onClick={() => setPromptOpen(!promptOpen)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white cursor-pointer"
          >
            <span className={`transition-transform inline-block ${promptOpen ? 'rotate-90' : ''}`}>&#9654;</span>
            Copiar prompt
          </button>
          {promptOpen && (
            <div className="mt-3 space-y-3">
              <PromptBox label="Português" text={style.prompt_pt} onCopy={copyText} />
              <PromptBox label="English" text={style.prompt_en} onCopy={copyText} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PromptBox({ label, text, onCopy }: { label: string; text: string; onCopy: (t: string) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <button onClick={() => onCopy(text)} className="text-xs text-violet-400 hover:text-violet-300 cursor-pointer">
          Copiar
        </button>
      </div>
      <pre className="bg-black/40 rounded-lg p-3 text-xs text-gray-300 whitespace-pre-wrap break-words overflow-auto max-h-32">
        {text}
      </pre>
    </div>
  );
}
