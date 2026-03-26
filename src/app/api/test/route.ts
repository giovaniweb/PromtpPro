import { NextResponse } from 'next/server';

const PIXEL_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const KEY = process.env.GEMINI_API_KEY!;
const BASE = 'https://generativelanguage.googleapis.com';

/** Testa Gemini Vision com gemini-2.0-flash */
async function testGeminiVision() {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent([
      'Describe this image in one word.',
      { inlineData: { data: PIXEL_PNG, mimeType: 'image/png' } },
    ]);
    return { status: 'ok', response: result.response.text().slice(0, 80) };
  } catch (e) {
    return { status: 'error', error: e instanceof Error ? e.message : String(e) };
  }
}

/** Testa Imagen 3 */
async function testImagen3() {
  try {
    const url = `${BASE}/v1beta/models/imagen-3.0-generate-002:generateImages?key=${KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
      body: JSON.stringify({ prompt: { text: 'a red circle' }, generationConfig: { sampleCount: 1 } }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { status: 'error', httpStatus: res.status, error: data?.error?.message ?? JSON.stringify(data).slice(0, 200) };
    const hasImage = !!data?.predictions?.[0]?.bytesBase64Encoded;
    return { status: hasImage ? 'ok' : 'error', hasImage };
  } catch (e) {
    return { status: 'error', error: e instanceof Error ? e.message : String(e) };
  }
}

/** Testa Gemini 2.0 Flash Exp (geração de imagem nativa) */
async function testGeminiFlashExp() {
  try {
    const url = `${BASE}/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Generate a tiny red circle.' }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { status: 'error', httpStatus: res.status, error: data?.error?.message ?? JSON.stringify(data).slice(0, 200) };
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const hasImage = parts.some((p: { inlineData?: unknown }) => p.inlineData);
    return { status: hasImage ? 'ok' : 'no-image', partsCount: parts.length, hasImage };
  } catch (e) {
    return { status: 'error', error: e instanceof Error ? e.message : String(e) };
  }
}

/** Lista modelos disponíveis para esta API key */
async function listModels() {
  try {
    const res = await fetch(`${BASE}/v1beta/models?key=${KEY}&pageSize=100`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { status: 'error', error: data?.error?.message };
    const names = (data.models ?? []).map((m: { name: string }) => m.name);
    return { status: 'ok', count: names.length, models: names };
  } catch (e) {
    return { status: 'error', error: e instanceof Error ? e.message : String(e) };
  }
}

export async function GET() {
  const [vision, imagen3, flashExp, models] = await Promise.all([
    testGeminiVision(),
    testImagen3(),
    testGeminiFlashExp(),
    listModels(),
  ]);

  const imageGenOk = imagen3.status === 'ok' || flashExp.status === 'ok';

  return NextResponse.json({
    summary: vision.status === 'ok' && imageGenOk ? '✅ APIs prontas' : '⚠️ Verifique erros abaixo',
    geminiVision_2_0_flash: vision,
    imagen3: imagen3,
    geminiFlashExp_imageGen: flashExp,
    recommendation: imagen3.status === 'ok'
      ? 'Usar Imagen 3'
      : flashExp.status === 'ok'
      ? 'Usar Gemini 2.0 Flash Exp (fallback ativo)'
      : '❌ Nenhum modelo de geração disponível',
    availableModels: models,
  });
}
