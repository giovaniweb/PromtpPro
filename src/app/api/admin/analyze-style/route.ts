import { NextRequest, NextResponse } from 'next/server';
import { analyzeStyleImage, generateStyleTitle } from '@/lib/gemini';
import { buildShieldPrompt } from '@/lib/shieldPrompt';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });

    const form = await req.formData();
    const file = form.get('file') as File | null;
    const name = (form.get('name') as string | null)?.trim();
    const originalPrompt = (form.get('originalPrompt') as string | null)?.trim() || undefined;

    if (!file) return NextResponse.json({ error: 'Campo obrigatório: file' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const refBase64 = Buffer.from(arrayBuffer).toString('base64');
    const refMime = file.type || 'image/jpeg';

    const [styleFeatures, resolvedName] = await Promise.all([
      analyzeStyleImage(refBase64, refMime, originalPrompt),
      name ? Promise.resolve(name) : generateStyleTitle(refBase64, refMime),
    ]);

    const shieldPrompt = buildShieldPrompt(styleFeatures);

    console.log('[admin/analyze-style] Análise concluída para:', resolvedName);
    return NextResponse.json({ shieldPrompt, resolvedName });
  } catch (error) {
    console.error('[admin/analyze-style] Erro:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 });
  }
}
