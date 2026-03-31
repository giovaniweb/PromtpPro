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
  '1:1': '1:1', '4:5': '4:5', '2:3': '3:4', '4:7': '3:4', '9:16': '9:16', '16:9': '16:9',
};

/**
 * Embute os pesos de identidade e estilo como instruções textuais no prompt.
 * O modelo Gemini não aceita parâmetros de peso separados — instrução em texto é o mecanismo disponível.
 */
function buildEnrichedPrompt(fusionPrompt: string): string {
  return fusionPrompt + `

=== RENDERING PARAMETERS ===
Identity preservation: 1.0 — ABSOLUTE: The face, skin tone, hair and facial structure from the IDENTITY REFERENCE image must appear in the output exactly as shown. Do not alter, blend, or average facial features with any other person.
Style transfer strength: 0.65 — Use clothing colors, environment and pose from the STYLE REFERENCE image, but freely adapt body proportions, shoulder width, neck, and torso to match the target gender anatomy.
Gender anatomy adaptation: Apply correct skeletal proportions for the stated target gender (broader shoulders, wider neck for male; narrower shoulders for female). Do NOT copy the silhouette outline of the style reference person.
Composite rule: Place the identity face onto a newly generated body that matches the target gender physique wearing the described clothing in the described environment.
CRITICAL FACE LOCK: The face in the output must be identical to the face in the identity_reference_image. Do NOT use, reference, blend, or interpolate the face of the person in the style reference image. If in doubt, discard the style reference face entirely.`;
}

/**
 * Nano Banana 2 (gemini-3.1-flash-image-preview) — modelo mais recente.
 */
async function tryNanoBanana2(
  prompt: string,
  selfieBase64?: string,
  selfieMime?: string,
  // styleBase64 and styleMime are intentionally NOT sent as inlineData —
  // sending a second face image causes the model to blend faces.
  // Style features are already captured as text in the fusionPrompt via adaptPayload.
  _styleBase64?: string,
  _styleMime?: string,
): Promise<string> {
  const key = process.env.NANO_BANANA_API_KEY!;
  const url = `${BASE}/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${key}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parts: any[] = [];

  if (selfieBase64 && selfieMime) {
    parts.push({ text: '[IDENTITY REFERENCE — this is the person whose face must appear in the output. Preserve their face exactly.]' });
    parts.push({ inlineData: { data: selfieBase64, mimeType: selfieMime } });
  }

  parts.push({ text: buildEnrichedPrompt(prompt) });

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
 */
async function tryNanoBananaPro(
  prompt: string,
  selfieBase64?: string,
  selfieMime?: string,
  // styleBase64 and styleMime are intentionally NOT sent as inlineData —
  // sending a second face image causes the model to blend faces.
  // Style features are already captured as text in the fusionPrompt via adaptPayload.
  _styleBase64?: string,
  _styleMime?: string,
): Promise<string> {
  const key = process.env.NANO_BANANA_API_KEY!;
  const url = `${BASE}/v1beta/models/nano-banana-pro-preview:generateContent?key=${key}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proParts: any[] = [];
  if (selfieBase64 && selfieMime) {
    proParts.push({ text: '[IDENTITY REFERENCE — this is the person whose face must appear in the output. Preserve their face exactly.]' });
    proParts.push({ inlineData: { data: selfieBase64, mimeType: selfieMime } });
  }
  proParts.push({ text: buildEnrichedPrompt(prompt) });

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
