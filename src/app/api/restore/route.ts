import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/nanoBanana';

const RESTORE_PROMPT = `Restore this old, damaged photograph to pristine condition.
Tasks: Remove scratches, tears, spots, dust, water stains, and physical damage.
Fix color fading, yellowing, and discoloration — restore natural, vivid tones.
Enhance sharpness and recover lost facial and scene details.
Preserve the original composition, subjects, and background exactly.
Output: A clean, sharp, high-quality restored version of the same photo.
Do NOT change the scene, add or remove people, or alter the composition in any way.`;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Arquivo obrigatório.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const imageBase64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type || 'image/jpeg';

    const restoredBase64 = await generateImage({
      imageBase64,
      mimeType,
      prompt: RESTORE_PROMPT,
      aspectRatio: '1:1',
    });

    return NextResponse.json({
      restoredDataUrl: `data:image/png;base64,${restoredBase64}`,
    });
  } catch (error) {
    console.error('[restore] Erro:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
