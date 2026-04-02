'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Props {
  user: { email?: string | null } | null;
  credits: number | null;
}

export default function HeaderAuth({ user, credits }: Props) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  if (!user) {
    return (
      <Link href="/login"
        className="ml-2 px-4 py-1.5 rounded-full text-sm font-medium text-white cursor-pointer transition-opacity hover:opacity-90"
        style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
        Entrar
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2 ml-2">
      <Link href="/dashboard"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition-colors cursor-pointer">
        <span>✶</span>
        <span>{credits ?? 0} créditos</span>
      </Link>
      <div className="relative group">
        <button className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-pointer"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
          {(user.email?.[0] ?? 'U').toUpperCase()}
        </button>
        <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-white/10 bg-[#1a1a2e] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          <Link href="/dashboard" className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-t-xl">Meu Dashboard</Link>
          <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 rounded-b-xl cursor-pointer">Sair</button>
        </div>
      </div>
    </div>
  );
}
