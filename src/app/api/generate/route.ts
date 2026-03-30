import { NextRequest, NextResponse } from 'next/server';
import { analyzeIdentity, analyzeStyleImage } from '@/lib/gemini';
import { adaptPayload } from '@/lib/semanticAdapter';
import { generateImage } from '@/lib/nanoBanana';
import { uploadGeneratedImage } from '@/lib/supabase';

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
    const form = await req.formData();
    const file          = form.get('file')           as File   | null;
    const styleImageUrl = form.get('styleImageUrl')  as string | null;
    const promptEn      = form.get('promptEn')       as string | null;
    const aspectRatio   = form.get('aspectRatio')    as string | null;
    const styleId       = form.get('styleId')        as string | null;

    if (!file || !promptEn || !aspectRatio || !styleId) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: file, promptEn, aspectRatio, styleId' },
        { status: 400 }
      );
    }

    // Converte selfie para base64
    const arrayBuffer = await file.arrayBuffer();
    const selfieBase64 = Buffer.from(arrayBuffer).toString('base64');
    const selfieMime   = file.type || 'image/jpeg';

    // Busca a imagem de estilo da galeria
    let styleBase64: string | undefined;
    let styleMime: string | undefined;
    if (styleImageUrl) {
      const styleImg = await fetchImageAsBase64(styleImageUrl);
      if (styleImg) {
        styleBase64 = styleImg.base64;
        styleMime   = styleImg.mimeType;
      }
    }

    // === CAMADA 1: Vision Analysis ===
    let fusionPrompt = promptEn;

    try {
      const [identity, styleFeatures] = await Promise.all([
        analyzeIdentity(selfieBase64, selfieMime),
        styleBase64 && styleMime
          ? analyzeStyleImage(styleBase64, styleMime)
          : Promise.resolve(null),
      ]);

      // === CAMADA 2: Semantic Adaptation ===
      if (styleFeatures) {
        const payload = adaptPayload(identity, styleFeatures);
        fusionPrompt  = payload.fusionPrompt;

        console.log('[generate] Fusion payload:', JSON.stringify({
          target_gender:      payload.project_metadata.target_gender,
          gender_mismatch:    payload.project_metadata.gender_mismatch_detected,
          adaptation_applied: payload.project_metadata.adaptation_applied,
          outfit:             payload.creative_direction.visual_attributes.apparel.outfit,
          adaptation_logic:   payload.creative_direction.visual_attributes.apparel.gender_adaptation_logic,
        }, null, 2));
      } else {
        fusionPrompt = `${promptEn}\n\n[Identity]: ${identity.description}\nPreserve the face of this specific person exactly.`;
      }
    } catch (e) {
      console.warn('[generate] Camada 1/2 falhou, usando prompt básico:', e);
    }

    // === CAMADA 3: Multimodal Image Fusion ===
    const generatedBase64 = await generateImage({
      imageBase64:      selfieBase64,
      mimeType:         selfieMime,
      prompt:           fusionPrompt,
      aspectRatio:      aspectRatio,
      styleImageBase64: styleBase64,
      styleMimeType:    styleMime,
    });

    const publicUrl = await uploadGeneratedImage(generatedBase64, styleId);

    return NextResponse.json({
      imageDataUrl: `data:image/png;base64,${generatedBase64}`,
      publicUrl:    publicUrl ?? null,
    });

  } catch (error) {
    console.error('API /generate error:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
