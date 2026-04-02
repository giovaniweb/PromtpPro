'use client';

import { useState, useEffect, useCallback } from 'react';

interface Props {
  userId: string;
  email: string;
  currentBalance: number;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}

export default function CreditModal({ userId, email, currentBalance, onClose, onSuccess }: Props) {
  const [delta, setDelta] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = parseInt(delta, 10);
  const preview = !isNaN(parsed) ? Math.max(0, currentBalance + parsed) : null;

  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isNaN(parsed) || parsed === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/update-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, delta: parsed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar créditos');
      onSuccess(data.newBalance);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#12121e] p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-bold text-lg">Gerenciar Créditos</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">{email}</p>
          </div>
          <button onClick={handleClose} className="text-gray-500 hover:text-white cursor-pointer text-xl leading-none">×</button>
        </div>

        <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
          <span className="text-sm text-gray-400">Saldo atual</span>
          <span className="font-bold text-violet-300 text-lg">{currentBalance}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              Delta (positivo = adicionar, negativo = remover)
            </label>
            <input
              type="number"
              value={delta}
              onChange={e => setDelta(e.target.value)}
              placeholder="Ex: +50 ou -10"
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-violet-500"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          {preview !== null && (
            <p className="text-xs text-gray-400 text-center">
              Saldo atual: <span className="text-white">{currentBalance}</span>
              {' → '}
              Novo saldo: <span className={preview >= currentBalance ? 'text-green-400' : 'text-red-400'}>{preview}</span>
            </p>
          )}

          {error && <p className="text-red-400 text-xs p-3 bg-red-500/10 rounded-lg">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-sm cursor-pointer hover:bg-white/15">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || isNaN(parsed) || parsed === 0}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40 cursor-pointer"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}
            >
              {loading ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
