'use client';

import { useState } from 'react';
import { StyleItem } from '@/data';
import RoomFilter from './RoomFilter';
import GalleryGrid from './GalleryGrid';
import StyleModal from './StyleModal';

interface Props {
  styles: StyleItem[];
  trendingIds: Set<string>;
}

export default function HomeGallery({ styles, trendingIds }: Props) {
  const [room, setRoom] = useState('todos');
  const [selected, setSelected] = useState<StyleItem | null>(null);

  const filtered = room === 'todos' ? styles : styles.filter(s => s.room === room);

  async function handleCopy(item: StyleItem) {
    if (item.prompt_en) {
      await navigator.clipboard.writeText(item.prompt_en);
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Galeria de Estilos</h1>
      <RoomFilter active={room} onChange={setRoom} />
      <div className="mt-6">
        <GalleryGrid items={filtered} onSelect={setSelected} onCopy={handleCopy} trendingIds={trendingIds} />
      </div>
      {selected && (
        <StyleModal style={selected} onClose={() => setSelected(null)} />
      )}
    </main>
  );
}
