'use client';

import { useState } from 'react';
import UploadArea from '@/components/UploadArea';

type Room = 'editorial' | 'corporativo' | 'social' | 'artistico' | 'produto';

const ROOM_LABELS: Record<Room, string> = {
  editorial:   '📸 Foto de Estúdio',
  corporativo: '💼 Foto Profissional',
  social:      '📱 Foto Lifestyle',
  artistico:   '🎨 Ilustração & 3D',
  produto:     '🛍️ Produtos',
};

interface CreatedStyle {
  id: string;
  name: string;
  thumbnail_url: string;
  room: string;
}

export default function AdminStylesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [room, setRoom] = useState<Room>('editorial');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreatedStyle | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(f: File, url: string) {
    setFile(f); setPreview(url); setResult(null); setError(null);
  }

  async function handleCreate() {
    if (!file || !name.trim()) return;
    setLoading(true); setError(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name.trim());
    formData.append('room', room);
    try {
      const res = await fetch('/api/admin/create-style', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar estilo');
      setResult(data.style);
      setFile(null); setPreview(null); setName('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Copyright Shield</h1>
        <p className="text-gray-400 text-sm mt-1">
          Faça upload de uma referência (Pinterest/Instagram). O sistema extrai o estilo via IA,
          recria a imagem com um modelo virtual fictício e salva na galeria. A foto original nunca é salva.
        </p>
      </div>
      <div className="space-y-5 p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5">
        <div>
          <p className="text-sm text-gray-400 mb-2">Imagem de referência (será descartada)</p>
          <UploadArea preview={preview} onFile={handleFile} onClear={() => { setFile(null); setPreview(null); }} />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Nome do estilo</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Moda Urbana Verão"
            className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-amber-500"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Categoria</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(ROOM_LABELS) as Room[]).map(r => (
              <button key={r} onClick={() => setRoom(r)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all cursor-pointer ${room === r ? 'bg-amber-500/30 border border-amber-500/50 text-amber-300' : 'bg-white/5 border border-white/10 text-gray-400 hover:border-white/20'}`}>
                {ROOM_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-red-400 text-sm p-3 bg-red-500/10 rounded-lg">{error}</p>}
        <button disabled={!file || !name.trim() || loading} onClick={handleCreate}
          className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${file && name.trim() && !loading ? 'bg-amber-500 text-black hover:bg-amber-400 cursor-pointer' : 'bg-white/10 text-gray-500 cursor-not-allowed'}`}>
          {loading ? <span className="text-sm">Analisando e gerando estilo...</span> : '⚡ Gerar Estilo Seguro'}
        </button>
      </div>
      {result && (
        <div className="mt-6 p-4 rounded-2xl border border-green-500/30 bg-green-500/5">
          <p className="text-green-400 font-medium mb-3">✓ Estilo criado com sucesso!</p>
          <div className="flex gap-4 items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.thumbnail_url} alt={result.name} className="w-24 rounded-xl object-cover aspect-[3/4]" />
            <div>
              <p className="font-medium">{result.name}</p>
              <p className="text-sm text-gray-400">{result.room}</p>
              <p className="text-xs text-gray-500 mt-1">ID: {result.id}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
