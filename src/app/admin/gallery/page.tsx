'use client';

import { useEffect, useState, useCallback } from 'react';

const ROOM_LABELS: Record<string, string> = {
  editorial:   '📸 Foto de Estúdio',
  corporativo: '💼 Foto Profissional',
  social:      '📱 Foto Lifestyle',
  artistico:   '🎨 Ilustração & 3D',
  produto:     '🛍️ Produtos',
};

const ROOMS = Object.entries(ROOM_LABELS).map(([key, label]) => ({ key, label }));

interface Style {
  id: string;
  name: string;
  thumbnail_url: string;
  room: string;
  usage_count: number;
  is_admin_created: boolean;
  created_at: string;
}

export default function AdminGalleryPage() {
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Style | null>(null);
  const [editName, setEditName] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/styles')
      .then(r => r.json())
      .then(d => { setStyles(d.styles ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = styles.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  function openEdit(s: Style) {
    setEditing(s);
    setEditName(s.name);
    setEditRoom(s.room);
  }

  const closeEdit = useCallback(() => setEditing(null), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') closeEdit(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeEdit]);

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/styles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, name: editName, room: editRoom }),
      });
      const data = await res.json();
      if (data.style) {
        setStyles(prev => prev.map(s => s.id === data.style.id ? data.style : s));
        closeEdit();
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete(id: string) {
    const res = await fetch(`/api/admin/styles?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.ok) {
      setStyles(prev => prev.filter(s => s.id !== id));
      setDeleting(null);
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Catálogo</h1>
          <p className="text-gray-400 text-sm mt-0.5">{styles.length} estilos no catálogo</p>
        </div>
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 w-64"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500 text-sm">Carregando...</div>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 w-12"></th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Categoria</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-400">Usos</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Origem</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Criado em</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                  <td className="px-4 py-2">
                    {s.thumbnail_url ? (
                      <img src={s.thumbnail_url} alt={s.name} className="w-8 h-10 object-cover rounded-md" />
                    ) : (
                      <div className="w-8 h-10 rounded-md bg-white/10 flex items-center justify-center text-lg">🖼️</div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-200 font-medium">{s.name}</td>
                  <td className="px-4 py-2 text-gray-400 text-xs">{ROOM_LABELS[s.room] ?? s.room}</td>
                  <td className="px-4 py-2 text-right text-gray-300">{s.usage_count}</td>
                  <td className="px-4 py-2">
                    {s.is_admin_created ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">Admin</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-500 border border-white/10">Estático</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-xs">
                    {new Date(s.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(s)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        Editar
                      </button>
                      {deleting === s.id ? (
                        <>
                          <button
                            onClick={() => confirmDelete(s.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-colors cursor-pointer"
                          >
                            Confirmar?
                          </button>
                          <button
                            onClick={() => setDeleting(null)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setDeleting(s.id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">
              {search ? 'Nenhum estilo encontrado para essa busca.' : 'Nenhum estilo no catálogo.'}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) closeEdit(); }}
        >
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold mb-4">Editar Estilo</h2>

            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-1.5">Nome do estilo</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="mb-6">
              <label className="block text-xs text-gray-400 mb-2">Categoria</label>
              <div className="flex flex-wrap gap-2">
                {ROOMS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setEditRoom(key)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                      editRoom === key
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={closeEdit}
                className="text-sm px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                disabled={saving || !editName.trim()}
                className="text-sm px-4 py-2 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
