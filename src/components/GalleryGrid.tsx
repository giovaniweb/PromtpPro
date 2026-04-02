'use client';

import { StyleItem } from '@/data';

interface GalleryGridProps {
  items: StyleItem[];
  onSelect: (item: StyleItem) => void;
  trendingIds?: Set<string>;
}

export default function GalleryGrid({ items, onSelect, trendingIds }: GalleryGridProps) {
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
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
              <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">Usar este estilo</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white text-sm font-medium">{item.title}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
