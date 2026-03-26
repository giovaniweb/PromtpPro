export interface GenerateParams {
  imageBase64: string;
  mimeType: string;
  prompt: string;
  aspectRatio: string;
}

const ratioMap: Record<string, string> = {
  '1:1': '1:1',
  '4:5': '4:5',
  '2:3': '3:4',
  '4:7': '3:4',
  '9:16': '9:16',
};

/** Imagen 3 via Google AI Studio — requer acesso especial. Tenta primeiro. */
async function tryImagen3(prompt: string, aspectRatio: string): Promise<string> {
  const imageAspectRatio = ratioMap[aspectRatio] ?? '1:1';
  const key = process.env.NANO_BANANA_API_KEY!;
  const url = `${process.env.NANO_BANANA_API_URL}/v1beta/models/imagen-3.0-generate-002:generateImages?key=${key}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      prompt: { text: prompt },
      generationConfig: { sampleCount: 1, aspectRatio: imageAspectRatio },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Imagen3 ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) throw new Error(`Imagen3: sem imagem na resposta — ${JSON.stringify(data).slice(0, 200)}`);
  return b64;
}

/**
 * Gemini 2.0 Flash Experimental — geração de imagem nativa.
 * Disponível para chaves AI Studio padrão.
 */
async function tryGeminiFlashExp(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY!;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${key}`;

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
    throw new Error(`GeminiFlashExp ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const parts: Array<{ inlineData?: { data: string; mimeType: string }; text?: string }> =
    data?.candidates?.[0]?.content?.parts ?? [];

  const imagePart = parts.find((p) => p.inlineData?.data);
  if (!imagePart?.inlineData?.data) {
    throw new Error(`GeminiFlashExp: sem imagem na resposta — parts: ${parts.length}, ${JSON.stringify(parts).slice(0, 200)}`);
  }
  return imagePart.inlineData.data;
}

/**
 * Gera imagem — tenta Imagen 3 primeiro, fallback para Gemini 2.0 Flash Exp.
 * Retorna base64 string da imagem PNG/JPEG gerada.
 */
export async function generateImage(params: GenerateParams): Promise<string> {
  const { prompt, aspectRatio } = params;

  try {
    return await tryImagen3(prompt, aspectRatio);
  } catch (err1) {
    console.warn('[nanoBanana] Imagen3 indisponível, usando Gemini Flash Exp:', err1 instanceof Error ? err1.message : err1);
    try {
      return await tryGeminiFlashExp(prompt);
    } catch (err2) {
      throw new Error(
        `Falha em ambos os modelos.\n` +
        `Imagen3: ${err1 instanceof Error ? err1.message : String(err1)}\n` +
        `GeminiFlashExp: ${err2 instanceof Error ? err2.message : String(err2)}`
      );
    }
  }
}
