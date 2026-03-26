import { NextResponse } from 'next/server';

// Imagem 1x1 pixel PNG em base64 — mínima possível para testar a API
const PIXEL_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function testGemini() {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent([
      'Say "ok" in one word.',
      { inlineData: { data: PIXEL_PNG, mimeType: 'image/png' } },
    ]);
    const text = result.response.text();
    return { status: 'ok', response: text.slice(0, 50) };
  } catch (e) {
    return { status: 'error', error: e instanceof Error ? e.message : String(e) };
  }
}

async function testImagen() {
  try {
    const url = `${process.env.NANO_BANANA_API_URL}/v1beta/models/imagen-3.0-generate-002:generateImages?key=${process.env.NANO_BANANA_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: { text: 'a red circle' }, generationConfig: { sampleCount: 1 } }),
    });
    const data = await res.json();
    if (!res.ok) return { status: 'error', httpStatus: res.status, error: data?.error?.message ?? JSON.stringify(data) };
    const hasImage = !!data?.predictions?.[0]?.bytesBase64Encoded;
    return { status: hasImage ? 'ok' : 'error', hasImage, raw: hasImage ? '(imagem recebida)' : JSON.stringify(data).slice(0, 200) };
  } catch (e) {
    return { status: 'error', error: e instanceof Error ? e.message : String(e) };
  }
}

async function testGeminiImageGen() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Generate a tiny red circle image.' }] }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
      }),
    });
    const data = await res.json();
    if (!res.ok) return { status: 'error', httpStatus: res.status, error: data?.error?.message ?? JSON.stringify(data).slice(0, 200) };
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const hasImage = parts.some((p: { inlineData?: unknown }) => p.inlineData);
    return { status: hasImage ? 'ok' : 'error', hasImage, partsCount: parts.length };
  } catch (e) {
    return { status: 'error', error: e instanceof Error ? e.message : String(e) };
  }
}

export async function GET() {
  const [gemini, imagen3, geminiImagen] = await Promise.all([
    testGemini(),
    testImagen(),
    testGeminiImageGen(),
  ]);

  const allOk = gemini.status === 'ok' && (imagen3.status === 'ok' || geminiImagen.status === 'ok');

  return NextResponse.json({
    summary: allOk ? '✅ APIs prontas para uso' : '⚠️ Verifique os erros abaixo',
    geminiVision: gemini,
    imagen3_nanoBanana: imagen3,
    geminiImageGen_fallback: geminiImagen,
    recommendation: imagen3.status === 'ok'
      ? 'Usar Imagen 3 (qualidade máxima)'
      : geminiImagen.status === 'ok'
      ? 'Usar Gemini 2.0 Flash Image Gen (fallback ativo)'
      : '❌ Nenhum modelo de geração disponível — verifique as API keys',
  }, { status: 200 });
}
