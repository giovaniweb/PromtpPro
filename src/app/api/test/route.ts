import { NextResponse } from 'next/server';

const PIXEL_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const KEY = process.env.GEMINI_API_KEY!;
const BASE = 'https://generativelanguage.googleapis.com';

async function testVision() {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent([
      'Say "ok".',
      { inlineData: { data: PIXEL_PNG, mimeType: 'image/png' } },
    ]);
    return { status: 'ok', model: 'gemini-2.5-flash', response: result.response.text().slice(0, 60) };
  } catch (e) {
    return { status: 'error', error: e instanceof Error ? e.message : String(e) };
  }
}

async function testModel(name: string, body: object, endpoint: 'generateContent' | 'generateImages') {
  try {
    const url = `${BASE}/v1beta/models/${name}:${endpoint}?key=${KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { status: 'error', httpStatus: res.status, error: data?.error?.message ?? JSON.stringify(data).slice(0, 150) };

    let hasImage = false;
    if (endpoint === 'generateImages') {
      hasImage = !!data?.predictions?.[0]?.bytesBase64Encoded;
    } else {
      const parts = data?.candidates?.[0]?.content?.parts ?? [];
      hasImage = parts.some((p: { inlineData?: unknown }) => p.inlineData);
    }
    return { status: hasImage ? 'ok' : 'no-image', hasImage };
  } catch (e) {
    return { status: 'error', error: e instanceof Error ? e.message : String(e) };
  }
}

export async function GET() {
  const promptBody = {
    contents: [{ parts: [{ text: 'Generate a small red circle image.' }] }],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
  };
  const imagenBody = {
    prompt: { text: 'a red circle' },
    generationConfig: { sampleCount: 1 },
  };

  const [vision, nanoBanana, imagen4, gemini25img] = await Promise.all([
    testVision(),
    testModel('nano-banana-pro-preview', promptBody, 'generateContent'),
    testModel('imagen-4.0-generate-001', imagenBody, 'generateImages'),
    testModel('gemini-2.5-flash-image',  promptBody, 'generateContent'),
  ]);

  const imageGenOk = [nanoBanana, imagen4, gemini25img].some(r => r.status === 'ok');

  return NextResponse.json({
    summary: vision.status === 'ok' && imageGenOk ? '✅ APIs prontas' : '⚠️ Verifique erros',
    vision_gemini25flash: vision,
    nanoBananaPro: nanoBanana,
    imagen4: imagen4,
    gemini25FlashImage: gemini25img,
    recommendation: nanoBanana.status === 'ok' ? 'Nano Banana Pro ✅'
      : imagen4.status === 'ok'     ? 'Imagen 4 ✅'
      : gemini25img.status === 'ok' ? 'Gemini 2.5 Flash Image ✅'
      : '❌ Nenhum modelo disponível — verifique API keys no Vercel',
  });
}
