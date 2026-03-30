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

async function listBananaModels(): Promise<string[]> {
  try {
    const url = `${BASE}/v1beta/models?key=${KEY}&pageSize=200`;
    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));
    const models: Array<{ name: string }> = data?.models ?? [];
    return models
      .map((m) => m.name.replace('models/', ''))
      .filter((n) => n.includes('banana') || n.includes('nano'));
  } catch {
    return [];
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

  const [vision, nanoBanana2, nanoBananaPro, imagen4, gemini25img, bananaModels] = await Promise.all([
    testVision(),
    testModel('gemini-3.1-flash-image-preview', promptBody, 'generateContent'),
    testModel('nano-banana-pro-preview',         promptBody, 'generateContent'),
    testModel('imagen-4.0-generate-001',         imagenBody, 'generateImages'),
    testModel('gemini-2.5-flash-image',          promptBody, 'generateContent'),
    listBananaModels(),
  ]);

  const imageGenOk = [nanoBanana2, nanoBananaPro, imagen4, gemini25img].some(r => r.status === 'ok');

  return NextResponse.json({
    summary: vision.status === 'ok' && imageGenOk ? '\u2705 APIs prontas' : '\u26a0\ufe0f Verifique erros',
    vision_gemini25flash: vision,
    nanoBanana2_gemini31: nanoBanana2,
    nanoBananaPro: nanoBananaPro,
    imagen4: imagen4,
    gemini25FlashImage: gemini25img,
    availableBananaModels: bananaModels,
    recommendation: nanoBanana2.status === 'ok' ? 'Nano Banana 2 \u2705 (gemini-3.1-flash-image-preview)'
      : nanoBananaPro.status === 'ok' ? 'Nano Banana Pro \u2705'
      : imagen4.status === 'ok'       ? 'Imagen 4 \u2705'
      : gemini25img.status === 'ok'   ? 'Gemini 2.5 Flash Image \u2705'
      : '\u274c Nenhum modelo de gera\u00e7\u00e3o dispon\u00edvel \u2014 verifique API keys no Vercel',
  });
}
