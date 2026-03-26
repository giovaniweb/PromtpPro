import { NextRequest, NextResponse } from 'next/server';
import { analyzePhoto } from '@/lib/gemini';
import { generateImage } from '@/lib/nanoBanana';
import { uploadGeneratedImage } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const promptEn = form.get('promptEn') as string | null;
    const aspectRatio = form.get('aspectRatio') as string | null;
    const styleId = form.get('styleId') as string | null;

    if (!file || !promptEn || !aspectRatio || !styleId) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: file, promptEn, aspectRatio, styleId' },
        { status: 400 }
      );
    }

    // Converte o arquivo para base64
    const arrayBuffer = await file.arrayBuffer();
    const imageBase64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type || 'image/jpeg';

    // Etapa 1: Gemini Vision analisa a foto e descreve o sujeito
    let personDescription = '';
    try {
      personDescription = await analyzePhoto(imageBase64, mimeType);
    } catch (e) {
      console.warn('Gemini Vision falhou, continuando sem descrição:', e);
    }

    // Etapa 2: Monta o prompt enriquecido para o Nano Banana 2
    const enrichedPrompt = personDescription
      ? `${promptEn}\n\n[Real person from the photo]: ${personDescription}\nTransform this real person to match the style above exactly. Preserve their facial features and identity.`
      : `${promptEn}\nCreate a professional photograph matching this style.`;

    // Etapa 3: Nano Banana 2 gera a imagem
    const generatedBase64 = await generateImage({
      imageBase64,
      mimeType,
      prompt: enrichedPrompt,
      aspectRatio: aspectRatio,
    });

    // Etapa 4: Tenta salvar no Supabase Storage (não bloqueia se falhar)
    const publicUrl = await uploadGeneratedImage(generatedBase64, styleId);

    // Retorna a imagem como base64 data URL (mais o publicUrl se disponível)
    return NextResponse.json({
      imageDataUrl: `data:image/png;base64,${generatedBase64}`,
      publicUrl: publicUrl ?? null,
    });
  } catch (error) {
    console.error('API /generate error:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
