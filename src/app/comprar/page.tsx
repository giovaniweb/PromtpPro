'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Plan {
  key: string;
  name: string;
  credits: number;
  price: string;
  description: string;
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    key: 'basico',
    name: 'Básico',
    credits: 50,
    price: 'R$ 19,90',
    description: 'Para começar e experimentar o studio virtual.',
  },
  {
    key: 'pro',
    name: 'Pro',
    credits: 200,
    price: 'R$ 59,90',
    description: 'Para profissionais com demanda frequente de fotos.',
    highlight: true,
  },
  {
    key: 'business',
    name: 'Business',
    credits: 500,
    price: 'R$ 119,90',
    description: 'Para agências e volume alto de produções.',
  },
];

export default function ComprarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleBuy(planKey: string) {
    setLoading(planKey); setError(null);
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) { router.push('/login?next=/comprar'); return; }
        throw new Error(data.error || 'Erro ao criar sessão de pagamento');
      }
      if (data.url) window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold">Comprar Créditos</h1>
        <p className="text-gray-400 mt-2">Cada geração de foto consome 1 crédito. Escolha o plano ideal para você.</p>
      </div>

      {error && (
        <p className="text-red-400 text-sm p-3 bg-red-500/10 rounded-lg mb-6 text-center">{error}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className={`relative p-6 rounded-2xl border flex flex-col gap-4 transition-all ${
              plan.highlight
                ? 'border-violet-500/60 bg-violet-500/10 ring-1 ring-violet-500/30'
                : 'border-white/10 bg-white/[0.03] hover:border-white/20'
            }`}>
            {plan.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-medium bg-violet-600 text-white">
                Mais popular
              </span>
            )}
            <div>
              <p className="font-semibold text-lg">{plan.name}</p>
              <p className="text-3xl font-bold text-violet-300 mt-1">{plan.credits}</p>
              <p className="text-sm text-gray-500">créditos</p>
            </div>
            <p className="text-sm text-gray-400 flex-1">{plan.description}</p>
            <div>
              <p className="text-lg font-bold mb-3">{plan.price}</p>
              <button
                onClick={() => handleBuy(plan.key)}
                disabled={loading !== null}
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
                  plan.highlight
                    ? 'bg-violet-600 hover:bg-violet-500 text-white'
                    : 'bg-white/10 hover:bg-white/15 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}>
                {loading === plan.key
                  ? <span className="inline-block animate-spin mr-1">↻</span>
                  : null
                }
                {loading === plan.key ? 'Aguarde...' : 'Comprar agora'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-600 mt-8">
        Pagamento 100% seguro via Stripe · Os créditos são adicionados automaticamente após a confirmação.
      </p>
    </main>
  );
}
