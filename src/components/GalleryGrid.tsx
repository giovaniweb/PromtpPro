'use client';

import { useState } from 'react';
import { StyleItem } from '@/data';

interface GalleryGridProps {
  items: StyleItem[];
  onSelect: (item: StyleItem) => void;
  onCopy: (item: StyleItem) => void;
  trendingIds?: Set<string>;
}

export default function GalleryGrid({ items, onSelect, onCopy, trendingIds }: GalleryGridProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function handleCopy(e: React.MouseEvent, item: StyleItem) {
    e.stopPropagation();
    onCopy(item);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="masonry-grid">
      <style>{`
        .masonry-grid { column-count: 2; column-gap: 16px; }
        @media (min-width: 640px) { .masonry-grid { column-count: 3; } }
        @media (min-width: 1024px) { .masonry-grid { column-count: 4; } }
      `}</style>
      {items.map((item, i) => (
        <div key={item.id} className="break-inside-avoid mb-4 group cursor-pointer fade-in"
          style={{ animationDelay: `${i * 0.05}s` }} onClick={() => onSelect(item)}>
          <div className="relative rounded-xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.thumbnail} alt={item.title} className="w-full block transition-transform duration-300 group-hover:scale-[1.02]" loading="lazy" />
            {trendingIds?.has(item.id) && (
              <div className="absolute top-2 left-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-lg">
                  🔥 Em Alta
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex flex-col justify-end p-3 gap-2">
              <button
                onClick={e => { e.stopPropagation(); onSelect(item); }}
                className="w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:opacity-90"
              >
                ↗ Usar estilo
              </button>
              {item.prompt_en && (
                <button
                  onClick={e => handleCopy(e, item)}
                  className="w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 py-1.5 rounded-lg text-xs font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20"
                >
                  {copiedId === item.id ? '✓ Copiado!' : '⎘ Copiar Prompt'}
                </button>
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent group-hover:opacity-0 transition-opacity duration-300">
              <p className="text-white text-sm font-medium">{item.title}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
