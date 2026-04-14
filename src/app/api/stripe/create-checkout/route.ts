import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const PLANS: Record<string, { credits: number; priceId: string }> = {
  basico:   { credits: 50,  priceId: process.env.STRIPE_PRICE_BASICO!   },
  pro:      { credits: 200, priceId: process.env.STRIPE_PRICE_PRO!      },
  business: { credits: 500, priceId: process.env.STRIPE_PRICE_BUSINESS! },
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

    const body = await req.json();
    const { planKey } = body as { planKey?: string };

    const plan = planKey ? PLANS[planKey] : undefined;
    if (!plan?.priceId) {
      return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: plan.priceId, quantity: 1 }],
      metadata: { userId: user.id, planKey, credits: String(plan.credits) },
      success_url: `${origin}/dashboard?compra=sucesso`,
      cancel_url:  `${origin}/comprar`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[stripe/create-checkout] Erro:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 });
  }
}
