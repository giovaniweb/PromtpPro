'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/reset-password`,
    });
    if (error) { setError(error.message); setLoading(false); }
    else setDone(true);
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-4">📩</div>
        <h2 className="text-xl font-bold mb-2">Link enviado!</h2>
        <p className="text-gray-400 text-sm">Verifique seu e-mail para redefinir a senha.</p>
        <Link href="/login" className="inline-block mt-6 text-violet-400 hover:text-violet-300 text-sm">← Voltar para login</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-white">Esqueci a senha</h1>
          <p className="text-gray-400 text-sm mt-1">Enviaremos um link para redefinir</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-violet-500"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
          {error && <p className="text-red-400 text-xs p-3 bg-red-500/10 rounded-lg">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
            {loading ? 'Enviando...' : 'Enviar link'}
          </button>
        </form>
        <p className="text-center mt-4"><Link href="/login" className="text-sm text-violet-400 hover:text-violet-300">← Voltar</Link></p>
      </div>
    </div>
  );
}
