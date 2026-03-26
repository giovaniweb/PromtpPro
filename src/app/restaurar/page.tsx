'use client';

import { useState } from 'react';
import UploadArea from '@/components/UploadArea';
import BeforeAfter from '@/components/BeforeAfter';

const mockAnalysis = [
  { found: true, text: 'Riscos e arranhões detectados' },
  { found: true, text: 'Descoloração amarelada' },
  { found: true, text: 'Perda de detalhe no rosto' },
  { found: false, text: 'Rasgos (não detectado)' },
];

export default function RestaurarPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [restored, setRestored] = useState(false);

  function handleRestore() {
    setLoading(true);
    setTimeout(() => { setLoading(false); setRestored(true); }, 3000);
  }

  function handleDownload() {
    if (!preview) return;
    const a = document.createElement('a');
    a.href = preview;
    a.download = 'foto-restaurada.jpg';
    a.click();
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Restaurar foto antiga</h1>
      <p className="text-gray-400 mb-8">Suba sua foto danificada e a IA restaura automaticamente</p>

      {!preview && (
        <UploadArea
          preview={null}
          onFile={(_, url) => setPreview(url)}
          onClear={() => {}}
        />
      )}

      {preview && !restored && (
        <div className="fade-in">
          <UploadArea
            preview={preview}
            onFile={(_, url) => { setPreview(url); setRestored(false); }}
            onClear={() => { setPreview(null); setRestored(false); }}
          />

          {/* Análise mock */}
          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-semibold mb-3">Análise da imagem</h3>
            <ul className="space-y-2">
              {mockAnalysis.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className={item.found ? 'text-green-400' : 'text-gray-500'}>
                    {item.found ? '✓' : '✗'}
                  </span>
                  <span className={item.found ? 'text-gray-200' : 'text-gray-500'}>
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleRestore}
            disabled={loading}
            className="w-full mt-6 py-3 rounded-xl font-medium bg-gradient-to-r from-violet-600 to-purple-600 text-white cursor-pointer hover:opacity-90 transition-opacity"
          >
            {loading ? <span className="spinner mx-auto" /> : 'Restaurar foto'}
          </button>
        </div>
      )}

      {restored && preview && (
        <div className="fade-in">
          <BeforeAfter beforeSrc={preview} afterSrc={preview} />
          <button
            onClick={handleDownload}
            className="w-full mt-6 py-3 rounded-xl font-medium bg-gradient-to-r from-violet-600 to-purple-600 text-white cursor-pointer hover:opacity-90 transition-opacity"
          >
            Baixar foto restaurada
          </button>
        </div>
      )}
    </main>
  );
}
