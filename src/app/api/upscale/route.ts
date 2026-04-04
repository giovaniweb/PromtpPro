import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/nanoBanana';

const UPSCALE_PROMPT = `Upscale and enhance this image to ultra-high resolution.
Tasks: Recover fine details, enhance sharpness and clarity, reduce noise and compression artifacts, improve texture crispness.
Preserve the original colors, composition, subjects, and all scene content exactly as-is.
Output: A clean, sharp, high-quality enhanced version of the same photo.
Do NOT change the content, add or remove elements, or alter the composition in any way.`;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const aspectRatio = (form.get('aspectRatio') as string | null) ?? '1:1';

    if (!file) {
      return NextResponse.json({ error: 'Arquivo obrigatório.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const imageBase64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type || 'image/jpeg';

    const upscaledBase64 = await generateImage({
      imageBase64,
      mimeType,
      prompt: UPSCALE_PROMPT,
      aspectRatio,
    });

    return NextResponse.json({
      upscaledDataUrl: `data:image/png;base64,${upscaledBase64}`,
    });
  } catch (error) {
    console.error('[upscale] Erro:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
