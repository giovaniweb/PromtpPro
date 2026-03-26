'use client';

import { useState } from 'react';
import { allStyles, StyleItem } from '@/data';
import RoomFilter from '@/components/RoomFilter';
import GalleryGrid from '@/components/GalleryGrid';
import StyleModal from '@/components/StyleModal';

export default function Home() {
  const [room, setRoom] = useState('todos');
  const [selected, setSelected] = useState<StyleItem | null>(null);

  const filtered = room === 'todos'
    ? allStyles
    : allStyles.filter((s) => s.room === room);

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Galeria de Estilos</h1>
      <RoomFilter active={room} onChange={setRoom} />
      <div className="mt-6">
        <GalleryGrid items={filtered} onSelect={setSelected} />
      </div>
      {selected && (
        <StyleModal style={selected} onClose={() => setSelected(null)} />
      )}
    </main>
  );
}
