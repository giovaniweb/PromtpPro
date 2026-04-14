import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

interface Generation {
  id: string;
  image_url: string;
  style_id: string | null;
  prompt_json: Record<string, string> | null;
  created_at: string;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ compra?: string }>;
}) {
  const { compra } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profile }, { data: generations }] = await Promise.all([
    supabase.from('profiles').select('email, credits_balance, is_admin').eq('id', user.id).single(),
    supabase.from('generations').select('id, image_url, style_id, prompt_json, created_at')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
  ]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {compra === 'sucesso' && (
        <div className="mb-6 p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-sm font-medium">
          ✓ Pagamento confirmado! Seus créditos foram adicionados à conta.
        </div>
      )}

      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Meu Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">{profile?.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl border border-violet-500/30 bg-violet-500/10">
            <p className="text-xs text-gray-400">Créditos</p>
            <p className="text-xl font-bold text-violet-300">{profile?.credits_balance ?? 0}</p>
          </div>
          {profile?.is_admin && (
            <Link href="/admin/styles" className="px-4 py-2 rounded-xl text-sm font-medium bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 transition-colors">
              ⚡ Admin
            </Link>
          )}
        </div>
      </div>

      <div className="mb-10 p-5 rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-300">Comprar mais créditos</h2>
          <Link href="/comprar" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
            Ver todos os planos →
          </Link>
        </div>
        <div className="flex gap-3 flex-wrap">
          {[
            { name: 'Básico', credits: 50, price: 'R$ 19,90' },
            { name: 'Pro', credits: 200, price: 'R$ 59,90' },
            { name: 'Business', credits: 500, price: 'R$ 119,90' },
          ].map((plan) => (
            <Link key={plan.name} href="/comprar" className="flex-1 min-w-[120px] p-4 rounded-xl border border-white/10 bg-white/5 hover:border-violet-500/40 transition-colors">
              <p className="font-medium text-sm">{plan.name}</p>
              <p className="text-violet-300 text-lg font-bold">{plan.credits}</p>
              <p className="text-xs text-gray-500">créditos</p>
              <p className="text-xs text-gray-400 mt-2">{plan.price}</p>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-4">Minhas Criações ({generations?.length ?? 0})</h2>
        {!generations || generations.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-4xl mb-3">🎨</div>
            <p className="text-sm">Você ainda não gerou nenhuma foto.</p>
            <Link href="/" className="inline-block mt-4 text-violet-400 hover:text-violet-300 text-sm">Explorar estilos →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {(generations as Generation[]).map((gen) => (
              <div key={gen.id} className="group relative rounded-xl overflow-hidden bg-white/5 aspect-[3/4]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={gen.image_url} alt={gen.style_id ?? 'Geração'} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <a href={gen.image_url} download className="px-3 py-1.5 rounded-lg bg-white text-black text-xs font-medium cursor-pointer">Baixar</a>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70">
                  <p className="text-[10px] text-gray-400">{new Date(gen.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
