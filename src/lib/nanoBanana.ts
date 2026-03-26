export interface GenerateParams {
  imageBase64: string;
  mimeType: string;
  prompt: string;
  aspectRatio: string;
}

/**
 * Gera imagem usando Nano Banana 2 (Imagen 3 via Google Generative Language API).
 * Retorna a imagem gerada como base64 string.
 */
export async function generateImage(params: GenerateParams): Promise<string> {
  const { prompt, aspectRatio } = params;

  // Mapeia aspect_ratio do estilo para o formato aceito pelo Imagen 3
  const ratioMap: Record<string, string> = {
    '1:1':  '1:1',
    '4:5':  '4:5',
    '2:3':  '3:4',
    '4:7':  '3:4',
    '9:16': '9:16',
  };
  const imageAspectRatio = ratioMap[aspectRatio] ?? '1:1';

  const url = `${process.env.NANO_BANANA_API_URL}/v1beta/models/imagen-3.0-generate-002:generateImages?key=${process.env.NANO_BANANA_API_KEY}`;

  const body = {
    prompt: { text: prompt },
    generationConfig: {
      sampleCount: 1,
      aspectRatio: imageAspectRatio,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Nano Banana API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const b64 = data?.predictions?.[0]?.bytesBase64Encoded;

  if (!b64) {
    throw new Error('Nano Banana: resposta inesperada — sem imagem gerada.');
  }

  return b64; // base64 string da imagem PNG/JPEG gerada
}
