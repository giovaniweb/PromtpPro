'use client';

import { useState } from 'react';
import UploadArea from '@/components/UploadArea';
import BeforeAfter from '@/components/BeforeAfter';

export default function RestaurarPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [restoredUrl, setRestoredUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(f: File, url: string) {
    setFile(f);
    setPreview(url);
    setRestoredUrl(null);
    setError(null);
  }

  function handleClear() {
    setFile(null);
    setPreview(null);
    setRestoredUrl(null);
    setError(null);
  }

  async function handleRestore() {
    if (!file) return;
    setLoading(true);
    setError(null);

    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/api/restore', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao restaurar foto');
      setRestoredUrl(data.restoredDataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!restoredUrl) return;
    const a = document.createElement('a');
    a.href = restoredUrl;
    a.download = 'foto-restaurada.png';
    a.click();
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Restaurar foto antiga</h1>
      <p className="text-gray-400 mb-8">
        Suba sua foto danificada e a IA remove arranhões, descoloração e deterioração automaticamente.
      </p>

      {!restoredUrl ? (
        <>
          <UploadArea
            preview={preview}
            onFile={handleFile}
            onClear={handleClear}
          />

          {error && (
            <p className="mt-4 text-red-400 text-sm p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              {error}
            </p>
          )}

          {preview && (
            <button
              onClick={handleRestore}
              disabled={loading}
              className="w-full mt-6 py-3 rounded-xl font-medium bg-gradient-to-r from-violet-600 to-purple-600 text-white cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="spinner" /><span>Restaurando...</span></>
              ) : (
                '✨ Restaurar foto'
              )}
            </button>
          )}
        </>
      ) : (
        <div className="fade-in">
          <BeforeAfter beforeSrc={preview!} afterSrc={restoredUrl} />
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleDownload}
              className="flex-1 py-3 rounded-xl font-medium bg-gradient-to-r from-violet-600 to-purple-600 text-white cursor-pointer hover:opacity-90 transition-opacity"
            >
              Baixar foto restaurada
            </button>
            <button
              onClick={handleClear}
              className="px-6 py-3 rounded-xl bg-white/10 text-white cursor-pointer hover:bg-white/15"
            >
              Nova foto
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
