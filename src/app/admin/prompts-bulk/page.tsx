'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';

interface PreviewRow {
  id: string;
  name: string;
  thumbnail_url: string;
  room: string;
}

function parsePreview(text: string, isJson: boolean): PreviewRow[] {
  try {
    if (isJson) {
      const arr = JSON.parse(text);
      return (Array.isArray(arr) ? arr : []).slice(0, 5).map((o: Record<string, unknown>) => ({
        id:            String(o.id || '—'),
        name:          String(o.name || '—'),
        thumbnail_url: String(o.thumbnail_url || '—'),
        room:          String(o.room || 'editorial'),
      }));
    } else {
      const lines = text.trim().split('\n').filter(l => l.trim());
      if (lines.length < 2) return [];
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      return lines.slice(1, 6).map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
        return {
          id:            obj.id || '(gerado)',
          name:          obj.name || '—',
          thumbnail_url: obj.thumbnail_url || '—',
          room:          obj.room || 'editorial',
        };
      });
    }
  } catch {
    return [];
  }
}

function countRows(text: string, isJson: boolean): number {
  try {
    if (isJson) {
      const arr = JSON.parse(text);
      return Array.isArray(arr) ? arr.length : 0;
    } else {
      return text.trim().split('\n').filter(l => l.trim()).length - 1;
    }
  } catch {
    return 0;
  }
}

export default function PromptsBulkPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ inserted: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    const text = await f.text();
    const isJson = f.name.endsWith('.json');
    setPreview(parsePreview(text, isJson));
    setTotal(countRows(text, isJson));
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError(null);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/admin/bulk-import', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao importar');
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setFile(null);
    setPreview([]);
    setTotal(0);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/styles" className="text-sm text-gray-400 hover:text-white">← Voltar</Link>
        <div>
          <h1 className="text-2xl font-bold">Importação em Massa</h1>
          <p className="text-gray-400 text-sm mt-0.5">Importe estilos via CSV ou JSON direto na tabela styles</p>
        </div>
      </div>

      {/* Formato esperado */}
      <div className="mb-6 p-4 rounded-xl border border-white/10 bg-white/[0.02] text-xs text-gray-400 space-y-1">
        <p className="font-medium text-gray-300 mb-2">Formato esperado:</p>
        <p><span className="text-violet-300">CSV:</span> <code>id,name,thumbnail_url,prompt_en,room</code></p>
        <p><span className="text-violet-300">JSON:</span> <code>{`[{"id":"...","name":"...","thumbnail_url":"...","room":"editorial"}]`}</code></p>
        <p className="text-gray-500 mt-1">Campos obrigatórios: <code>name</code>, <code>thumbnail_url</code>. O campo <code>id</code> é gerado automaticamente se ausente.</p>
      </div>

      {/* Drop zone */}
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.json"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {!file ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`w-full h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
            dragging ? 'border-violet-500 bg-violet-500/10' : 'border-white/20 hover:border-violet-500/50 hover:bg-white/5'
          }`}
        >
          <span className="text-3xl">📂</span>
          <p className="text-sm text-gray-400">Arraste um arquivo <span className="text-white">.csv</span> ou <span className="text-white">.json</span> aqui</p>
          <p className="text-xs text-gray-600">ou clique para selecionar</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* File info */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-lg">{file.name.endsWith('.json') ? '📋' : '📊'}</span>
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-400">{total} registro{total !== 1 ? 's' : ''} detectado{total !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <button onClick={handleReset} className="text-xs text-gray-500 hover:text-white cursor-pointer">Trocar arquivo</button>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-2">Preview (primeiros {preview.length} registros):</p>
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03]">
                      <th className="text-left px-3 py-2 text-gray-400 font-medium">ID</th>
                      <th className="text-left px-3 py-2 text-gray-400 font-medium">Nome</th>
                      <th className="text-left px-3 py-2 text-gray-400 font-medium">Thumbnail URL</th>
                      <th className="text-left px-3 py-2 text-gray-400 font-medium">Room</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b border-white/5 last:border-0">
                        <td className="px-3 py-2 font-mono text-gray-500">{row.id.slice(0, 12)}{row.id.length > 12 ? '…' : ''}</td>
                        <td className="px-3 py-2 text-gray-200">{row.name}</td>
                        <td className="px-3 py-2 text-gray-500 max-w-[180px] truncate">{row.thumbnail_url}</td>
                        <td className="px-3 py-2 text-gray-400">{row.room}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {total > 5 && (
                <p className="text-xs text-gray-600 mt-1 text-center">… e mais {total - 5} registros</p>
              )}
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm p-3 bg-red-500/10 rounded-lg border border-red-500/20">{error}</p>
          )}

          {result ? (
            <div className="p-4 rounded-2xl border border-green-500/30 bg-green-500/5 text-center">
              <p className="text-green-400 font-bold text-lg">✓ Importação concluída</p>
              <p className="text-sm text-gray-300 mt-1">
                <span className="text-white font-medium">{result.inserted}</span> estilos inseridos
                {result.total - result.inserted > 0 && (
                  <span className="text-gray-500"> · {result.total - result.inserted} ignorados (já existiam)</span>
                )}
              </p>
              <button onClick={handleReset} className="mt-4 text-xs text-violet-400 hover:text-violet-300 cursor-pointer">
                Nova importação
              </button>
            </div>
          ) : (
            <button
              onClick={handleImport}
              disabled={loading || total === 0}
              className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                !loading && total > 0
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:opacity-90 cursor-pointer'
                  : 'bg-white/10 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading
                ? <><span className="spinner" /><span>Importando...</span></>
                : `Importar ${total} estilo${total !== 1 ? 's' : ''}`
              }
            </button>
          )}
        </div>
      )}
    </main>
  );
}
