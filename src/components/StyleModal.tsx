'use client';

import { useEffect, useState, useCallback } from 'react';
import { StyleItem } from '@/data';
import UploadArea from './UploadArea';

interface Props {
  style: StyleItem;
  onClose: () => void;
}

export default function StyleModal({ style, onClose }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
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

  function handleGenerate() {
    setLoading(true);
    setTimeout(() => { setLoading(false); setDone(true); }, 3000);
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-[#12121a] border border-white/10 p-6">
        {/* Fechar */}
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white cursor-pointer text-xl">
          &times;
        </button>

        {/* Foto de exemplo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={style.thumbnail} alt={style.title} className="w-full rounded-xl mb-4" />
        <h2 className="text-xl font-bold mb-4">{style.title}</h2>
        <div className="border-t border-white/10 mb-4" />

        {/* Upload */}
        <h3 className="text-sm text-gray-400 mb-2">Sua foto</h3>
        <UploadArea
          preview={preview}
          onFile={(_, url) => setPreview(url)}
          onClear={() => { setPreview(null); setDone(false); }}
        />

        {/* Botão Gerar */}
        <button
          disabled={!preview || loading}
          onClick={handleGenerate}
          className={`w-full mt-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${
            preview && !loading
              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:opacity-90'
              : 'bg-white/10 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? <span className="spinner mx-auto" /> : done ? 'Gerado!' : 'Gerar minha foto'}
        </button>

        {done && (
          <p className="text-center text-sm text-gray-400 mt-2">
            Geração de imagem será conectada na próxima fase
          </p>
        )}

        {/* Seção colapsável de prompts */}
        <div className="mt-4">
          <button
            onClick={() => setPromptOpen(!promptOpen)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white cursor-pointer"
          >
            <span className={`transition-transform ${promptOpen ? 'rotate-90' : ''}`}>&#9654;</span>
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
