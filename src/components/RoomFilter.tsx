'use client';

const rooms = [
  { key: 'todos', label: '✨ Todos' },
  { key: 'editorial', label: '📸 Foto de Estúdio' },
  { key: 'corporativo', label: '💼 Foto Profissional' },
  { key: 'social', label: '📱 Foto Lifestyle' },
  { key: 'artistico', label: '🎨 Ilustração & 3D' },
  { key: 'produto', label: '🛍️ Produtos' },
];

interface RoomFilterProps {
  active: string;
  onChange: (room: string) => void;
}

export default function RoomFilter({ active, onChange }: RoomFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {rooms.map((r) => (
        <button
          key={r.key}
          onClick={() => onChange(r.key)}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
            active === r.key
              ? 'bg-violet-600 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
