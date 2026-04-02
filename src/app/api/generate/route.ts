import { NextRequest, NextResponse } from 'next/server';
import { analyzeIdentity, analyzeStyleImage } from '@/lib/gemini';
import { adaptPayload } from '@/lib/semanticAdapter';
import { generateImage } from '@/lib/nanoBanana';
import { uploadGeneratedImage } from '@/lib/supabase';
import { createClient, createAdminClient } from '@/lib/supabase/server';

async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const mime = res.headers.get('content-type') || 'image/jpeg';
    return { base64: Buffer.from(buffer).toString('base64'), mimeType: mime.split(';')[0] };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('credits_balance').eq('id', user.id).single();
    if (!profile || profile.credits_balance < 1) {
      return NextResponse.json({ error: 'Créditos insuficientes. Compre mais créditos.' }, { status: 402 });
    }

    const form = await req.formData();
    const file              = form.get('file')              as File   | null;
    const styleImageUrl     = form.get('styleImageUrl')     as string | null;
    const promptEn          = form.get('promptEn')          as string | null;
    const aspectRatio       = form.get('aspectRatio')       as string | null;
    const styleId           = form.get('styleId')           as string | null;
    const precomputedPrompt = form.get('precomputedPrompt') as string | null;

    if (!file || !promptEn || !aspectRatio || !styleId) {
      return NextResponse.json({ error: 'Campos obrigatórios: file, promptEn, aspectRatio, styleId' }, { status: 400 });
    }

    const arrayBuffer  = await file.arrayBuffer();
    const selfieBase64 = Buffer.from(arrayBuffer).toString('base64');
    const selfieMime   = file.type || 'image/jpeg';

    let styleBase64: string | undefined;
    let styleMime:   string | undefined;
    if (styleImageUrl) {
      const styleImg = await fetchImageAsBase64(styleImageUrl);
      if (styleImg) { styleBase64 = styleImg.base64; styleMime = styleImg.mimeType; }
    }

    let fusionPrompt = precomputedPrompt ?? promptEn;
    if (!precomputedPrompt) {
      try {
        const [identity, styleFeatures] = await Promise.all([
          analyzeIdentity(selfieBase64, selfieMime),
          styleBase64 && styleMime ? analyzeStyleImage(styleBase64, styleMime) : Promise.resolve(null),
        ]);
        if (styleFeatures) {
          fusionPrompt = adaptPayload(identity, styleFeatures).fusionPrompt;
        } else {
          fusionPrompt = `${promptEn}\n\n[Identity]: ${identity.description}\nPreserve the face of this specific person exactly.`;
        }
      } catch (e) {
        console.warn('[generate] Camadas 1/2 falharam, usando promptEn como fallback:', e);
      }
    }

    const generatedBase64 = await generateImage({
      imageBase64: selfieBase64, mimeType: selfieMime,
      prompt: fusionPrompt, aspectRatio,
      styleImageBase64: styleBase64, styleMimeType: styleMime,
    });

    const publicUrl = await uploadGeneratedImage(generatedBase64, styleId, user.id);

    const admin = await createAdminClient();
    await Promise.allSettled([
      admin.from('profiles').update({ credits_balance: profile.credits_balance - 1 }).eq('id', user.id),
      publicUrl ? admin.from('generations').insert({ user_id: user.id, image_url: publicUrl, style_id: styleId, prompt_json: { fusionPrompt } }) : null,
      admin.rpc('increment_style_usage', { p_style_id: styleId }),
    ]);

    return NextResponse.json({ imageDataUrl: `data:image/png;base64,${generatedBase64}`, publicUrl: publicUrl ?? null, fusionPrompt });
  } catch (error) {
    console.error('[generate] Erro:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
