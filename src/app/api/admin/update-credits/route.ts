import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
    }

    const { userId, delta } = await req.json() as { userId: string; delta: number };
    if (!userId || typeof delta !== 'number') {
      return NextResponse.json({ error: 'Campos obrigatórios: userId, delta' }, { status: 400 });
    }

    const admin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: current } = await admin
      .from('profiles').select('credits_balance').eq('id', userId).single();

    const newBalance = Math.max(0, (current?.credits_balance ?? 0) + delta);

    const { error: updateError } = await admin
      .from('profiles').update({ credits_balance: newBalance }).eq('id', userId);

    if (updateError) {
      console.error('[update-credits] Erro:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ newBalance });
  } catch (error) {
    console.error('[update-credits] Erro:', error);
    return NextResponse.json({ error: 'Erro desconhecido' }, { status: 500 });
  }
}
