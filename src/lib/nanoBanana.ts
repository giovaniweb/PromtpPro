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

/**
 * Tenta gerar imagem com Imagen 3.
 * Retorna base64 string da imagem ou lança erro.
 */
async function tryImagen3(prompt: string, aspectRatio: string): Promise<string> {
  const imageAspectRatio = ratioMap[aspectRatio] ?? '1:1';
  const url = `${process.env.NANO_BANANA_API_URL}/v1beta/models/imagen-3.0-generate-002:generateImages?key=${process.env.NANO_BANANA_API_KEY}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: { text: prompt },
      generationConfig: { sampleCount: 1, aspectRatio: imageAspectRatio },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Imagen3 ${res.status}: ${err?.error?.message ?? res.statusText}`);
  }

  const data = await res.json();
  const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) throw new Error('Imagen3: resposta sem imagem');
  return b64;
}

/**
 * Fallback: gera imagem com Gemini 2.0 Flash (geração nativa de imagem).
 */
async function tryGeminiFlash(prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`GeminiFlash ${res.status}: ${err?.error?.message ?? res.statusText}`);
  }

  const data = await res.json();
  const parts: Array<{ inlineData?: { data: string } }> = data?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData?.data);
  if (!imagePart?.inlineData?.data) throw new Error('GeminiFlash: resposta sem imagem');
  return imagePart.inlineData.data;
}

/**
 * Gera imagem usando Nano Banana 2 (Imagen 3).
 * Se Imagen 3 não estiver disponível, usa Gemini 2.0 Flash como fallback.
 */
export async function generateImage(params: GenerateParams): Promise<string> {
  const { prompt, aspectRatio } = params;

  try {
    return await tryImagen3(prompt, aspectRatio);
  } catch (imagen3Error) {
    console.warn('[nanoBanana] Imagen 3 falhou, tentando Gemini Flash:', imagen3Error);
    try {
      return await tryGeminiFlash(prompt);
    } catch (geminiError) {
      console.error('[nanoBanana] Gemini Flash também falhou:', geminiError);
      throw new Error(
        `Nenhum modelo disponível.\n` +
        `Imagen3: ${imagen3Error instanceof Error ? imagen3Error.message : String(imagen3Error)}\n` +
        `GeminiFlash: ${geminiError instanceof Error ? geminiError.message : String(geminiError)}`
      );
    }
  }
}
