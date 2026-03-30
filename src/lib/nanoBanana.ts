export interface GenerateParams {
  imageBase64: string;
  mimeType: string;
  prompt: string;
  aspectRatio: string;
  styleImageBase64?: string;
  styleMimeType?: string;
}

const BASE = 'https://generativelanguage.googleapis.com';

const ratioMap: Record<string, string> = {
  '1:1': '1:1', '4:5': '4:5', '2:3': '3:4', '4:7': '3:4', '9:16': '9:16',
};

/**
 * Nano Banana 2 (gemini-3.1-flash-image-preview) — modelo mais recente.
 * Suporta múltiplas imagens: selfie do usuário + imagem de estilo da galeria.
 */
async function tryNanoBanana2(
  prompt: string,
  selfieBase64?: string,
  selfieMime?: string,
  styleBase64?: string,
  styleMime?: string,
): Promise<string> {
  const key = process.env.NANO_BANANA_API_KEY!;
  const url = `${BASE}/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${key}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parts: any[] = [];

  if (selfieBase64 && selfieMime) {
    parts.push({ text: '[IDENTITY REFERENCE — preserve this person\'s face exactly]' });
    parts.push({ inlineData: { data: selfieBase64, mimeType: selfieMime } });
  }

  if (styleBase64 && styleMime) {
    parts.push({ text: '[STYLE REFERENCE — use this for clothing, pose, colors, and environment]' });
    parts.push({ inlineData: { data: styleBase64, mimeType: styleMime } });
  }

  parts.push({ text: prompt });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`NanoBanana2 ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const responseParts2: Array<{ inlineData?: { data: string } }> =
    data?.candidates?.[0]?.content?.parts ?? [];
  const img = responseParts2.find((p) => p.inlineData?.data);
  if (!img?.inlineData?.data) throw new Error(`NanoBanana2: sem imagem — ${JSON.stringify(responseParts2).slice(0, 150)}`);
  return img.inlineData.data;
}

/**
 * Nano Banana Pro (nano-banana-pro-preview) — segundo fallback.
 * Também suporta múltiplas imagens.
 */
async function tryNanoBananaPro(
  prompt: string,
  selfieBase64?: string,
  selfieMime?: string,
  styleBase64?: string,
  styleMime?: string,
): Promise<string> {
  const key = process.env.NANO_BANANA_API_KEY!;
  const url = `${BASE}/v1beta/models/nano-banana-pro-preview:generateContent?key=${key}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proParts: any[] = [];
  if (selfieBase64 && selfieMime) {
    proParts.push({ text: '[IDENTITY REFERENCE — preserve this person\'s face exactly]' });
    proParts.push({ inlineData: { data: selfieBase64, mimeType: selfieMime } });
  }
  if (styleBase64 && styleMime) {
    proParts.push({ text: '[STYLE REFERENCE — use this for clothing, pose, colors, and environment]' });
    proParts.push({ inlineData: { data: styleBase64, mimeType: styleMime } });
  }
  proParts.push({ text: prompt });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: proParts }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`NanoBananaPro ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const responseParts: Array<{ inlineData?: { data: string } }> =
    data?.candidates?.[0]?.content?.parts ?? [];
  const img = responseParts.find((p) => p.inlineData?.data);
  if (!img?.inlineData?.data) throw new Error(`NanoBananaPro: sem imagem — ${JSON.stringify(responseParts).slice(0, 150)}`);
  return img.inlineData.data;
}

/**
 * Imagen 4 — geração de alta qualidade.
 */
async function tryImagen4(prompt: string, aspectRatio: string): Promise<string> {
  const key = process.env.NANO_BANANA_API_KEY!;
  const url = `${BASE}/v1beta/models/imagen-4.0-generate-001:generateImages?key=${key}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      prompt: { text: prompt },
      generationConfig: { sampleCount: 1, aspectRatio: ratioMap[aspectRatio] ?? '1:1' },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Imagen4 ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) throw new Error(`Imagen4: sem imagem — ${JSON.stringify(data).slice(0, 150)}`);
  return b64;
}

/**
 * Gemini 2.5 Flash Image — geração nativa de imagem (terceiro fallback).
 */
async function tryGemini25FlashImage(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY!;
  const url = `${BASE}/v1beta/models/gemini-2.5-flash-image:generateContent?key=${key}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Gemini25FlashImage ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const parts: Array<{ inlineData?: { data: string } }> =
    data?.candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p) => p.inlineData?.data);
  if (!img?.inlineData?.data) throw new Error(`Gemini25FlashImage: sem imagem`);
  return img.inlineData.data;
}

/**
 * Geração de imagem com cascata de modelos:
 * 1. Nano Banana 2 (gemini-3.1-flash-image-preview) — mais recente
 * 2. Nano Banana Pro (nano-banana-pro-preview)
 * 3. Gemini 2.5 Flash Image
 */
export async function generateImage(params: GenerateParams): Promise<string> {
  const { prompt, aspectRatio, imageBase64, mimeType, styleImageBase64, styleMimeType } = params;
  const errors: string[] = [];

  for (const [name, fn] of [
    ['NanoBanana2',        () => tryNanoBanana2(prompt, imageBase64, mimeType, styleImageBase64, styleMimeType)],
    ['NanoBananaPro',      () => tryNanoBananaPro(prompt, imageBase64, mimeType, styleImageBase64, styleMimeType)],
    ['Gemini25FlashImage', () => tryGemini25FlashImage(prompt)],
  ] as [string, () => Promise<string>][]) {
    try {
      const result = await fn();
      console.log(`[nanoBanana] Gerado com: ${name}`);
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[nanoBanana] ${name} falhou:`, msg);
      errors.push(`${name}: ${msg}`);
    }
  }

  throw new Error(`Todos os modelos falharam:\n${errors.join('\n')}`);
}
