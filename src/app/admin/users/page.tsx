'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CreditModal from '@/components/admin/CreditModal';

interface Profile {
  id: string;
  email: string;
  credits_balance: number;
  created_at: string;
}

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Profile | null>(null);

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(d => { setProfiles(d.profiles ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function handleSuccess(userId: string, newBalance: number) {
    setProfiles(prev => prev.map(p => p.id === userId ? { ...p, credits_balance: newBalance } : p));
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/styles" className="text-sm text-gray-400 hover:text-white">← Voltar</Link>
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-gray-400 text-sm mt-0.5">{profiles.length} cadastros</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500 text-sm">Carregando...</div>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Cadastro</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-400">Créditos</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p, i) => (
                <tr key={p.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.id.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-gray-200">{p.email}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(p.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-bold text-violet-300">{p.credits_balance}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelected(p)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30 transition-colors cursor-pointer"
                    >
                      Gerenciar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {profiles.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">Nenhum usuário encontrado.</div>
          )}
        </div>
      )}

      {selected && (
        <CreditModal
          userId={selected.id}
          email={selected.email}
          currentBalance={selected.credits_balance}
          onClose={() => setSelected(null)}
          onSuccess={(newBalance) => { handleSuccess(selected.id, newBalance); setSelected(null); }}
        />
      )}
    </main>
  );
}
