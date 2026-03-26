'use client';

import { useRef, useState, DragEvent, ChangeEvent } from 'react';

interface UploadAreaProps {
  onFile: (file: File, preview: string) => void;
  preview: string | null;
  onClear: () => void;
}

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

export default function UploadArea({ onFile, preview, onClear }: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  function handle(file: File) {
    setError('');
    if (!ACCEPTED.includes(file.type)) {
      setError('Formato inválido. Use JPG, PNG ou WebP.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('Arquivo muito grande. Máximo 5MB.');
      return;
    }
    const url = URL.createObjectURL(file);
    onFile(file, url);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) handle(e.dataTransfer.files[0]);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) handle(e.target.files[0]);
  }

  if (preview) {
    return (
      <div className="relative rounded-xl overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="Preview" className="w-full max-h-64 object-cover" />
        <button
          onClick={onClear}
          className="absolute bottom-2 right-2 px-3 py-1 bg-black/70 text-white text-xs rounded-lg cursor-pointer hover:bg-black/90"
        >
          Trocar foto
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragging ? 'border-violet-500 bg-violet-500/10' : 'border-white/20 hover:border-white/40'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <p className="text-gray-400 text-sm">Arraste sua foto ou clique para enviar</p>
        <p className="text-gray-500 text-xs mt-1">JPG, PNG ou WebP — máximo 5MB</p>
      </div>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={onChange} />
    </div>
  );
}
