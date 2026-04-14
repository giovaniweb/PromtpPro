import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Assinatura ausente.' }, { status: 400 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('[stripe/webhook] Assinatura inválida:', err);
    return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, credits } = session.metadata ?? {};

    if (!userId || !credits) {
      console.error('[stripe/webhook] Metadados ausentes:', session.metadata);
      return NextResponse.json({ error: 'Metadados ausentes.' }, { status: 400 });
    }

    const creditsToAdd = parseInt(credits, 10);
    if (isNaN(creditsToAdd) || creditsToAdd <= 0) {
      return NextResponse.json({ error: 'Valor de créditos inválido.' }, { status: 400 });
    }

    const supabase = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: profile, error: fetchErr } = await supabase
      .from('profiles')
      .select('credits_balance')
      .eq('id', userId)
      .single();

    if (fetchErr || !profile) {
      console.error('[stripe/webhook] Usuário não encontrado:', userId, fetchErr);
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ credits_balance: profile.credits_balance + creditsToAdd })
      .eq('id', userId);

    if (updateErr) {
      console.error('[stripe/webhook] Falha ao atualizar créditos:', updateErr);
      return NextResponse.json({ error: 'Falha ao adicionar créditos.' }, { status: 500 });
    }

    console.log(`[stripe/webhook] +${creditsToAdd} créditos adicionados para ${userId}`);
  }

  return NextResponse.json({ received: true });
}
