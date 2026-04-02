'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos.'
        : error.message);
      setLoading(false);
    } else {
      router.push(next);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label className="text-xs text-gray-400 mb-1 block">E-mail</label>
        <input
          type="email" required value={email} onChange={e => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-violet-500"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-gray-400">Senha</label>
          <Link href="/auth/forgot-password" className="text-xs text-violet-400 hover:text-violet-300">
            Esqueci a senha
          </Link>
        </div>
        <input
          type="password" required value={password} onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-violet-500"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
      </div>
      {error && (
        <p className="text-red-400 text-xs p-3 bg-red-500/10 rounded-lg border border-red-500/20">{error}</p>
      )}
      <button type="submit" disabled={loading}
        className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
        style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            PromptPro
          </h1>
          <p className="text-gray-400 text-sm mt-1">Entre na sua conta</p>
        </div>
        <Suspense fallback={<div className="h-48 flex items-center justify-center text-gray-500 text-sm">Carregando...</div>}>
          <LoginForm />
        </Suspense>
        <p className="text-center text-sm text-gray-500 mt-6">
          Não tem conta?{' '}
          <Link href="/signup" className="text-violet-400 hover:text-violet-300">
            Criar conta grátis
          </Link>
        </p>
      </div>
    </div>
  );
}
