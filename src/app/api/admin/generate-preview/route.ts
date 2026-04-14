import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/nanoBanana';
import { scoreFidelity } from '@/lib/gemini';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });

    const body = await req.json();
    const { shieldPrompt, referenceBase64, referenceMime } = body as {
      shieldPrompt?: string;
      referenceBase64?: string;
      referenceMime?: string;
    };

    if (!shieldPrompt?.trim()) return NextResponse.json({ error: 'Campo obrigatório: shieldPrompt' }, { status: 400 });

    const imageBase64 = await generateImage({
      imageBase64: '',
      mimeType: 'image/jpeg',
      prompt: shieldPrompt,
      aspectRatio: '9:16',
    });

    // Score fidelity when reference image is provided
    let fidelity = null;
    if (referenceBase64 && referenceMime) {
      fidelity = await scoreFidelity(
        referenceBase64,
        referenceMime,
        imageBase64,
        'image/png',
      );
    }

    console.log('[admin/generate-preview] Preview gerado. Fidelidade:', fidelity?.overall ?? 'n/a');
    return NextResponse.json({ imageBase64, fidelity });
  } catch (error) {
    console.error('[admin/generate-preview] Erro:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 });
  }
}
