export interface GenerateParams {
  imageBase64: string;
  mimeType: string;
  prompt: string;
  aspectRatio: string;
}

const BASE = 'https://generativelanguage.googleapis.com';

const ratioMap: Record<string, string> = {
  '1:1': '1:1', '4:5': '4:5', '2:3': '3:4', '4:7': '3:4', '9:16': '9:16',
};

async function tryNanoBanana(prompt: string): Promise<string> {
  const key = process.env.NANO_BANANA_API_KEY!;
  const url = `${BASE}/v1beta/models/nano-banana-pro-preview:generateContent?key=${key}`;

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
    throw new Error(`NanoBanana ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const parts: Array<{ inlineData?: { data: string } }> =
    data?.candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p) => p.inlineData?.data);
  if (!img?.inlineData?.data) throw new Error(`NanoBanana: sem imagem — ${JSON.stringify(parts).slice(0, 150)}`);
  return img.inlineData.data;
}

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

export async function generateImage(params: GenerateParams): Promise<string> {
  const { prompt, aspectRatio } = params;
  const errors: string[] = [];

  for (const [name, fn] of [
    ['NanoBanana', () => tryNanoBanana(prompt)],
    ['Imagen4',    () => tryImagen4(prompt, aspectRatio)],
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
