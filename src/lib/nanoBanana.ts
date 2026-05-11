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

function buildShieldEnrichedPrompt(shieldPrompt: string): string {
  return shieldPrompt + `

=== HYPERREALISM HARD REQUIREMENTS ===
This MUST look like an UNEDITED real photograph from a real camera, NOT an AI generation:
- RAW photo aesthetic: shot on real cine camera (RED Komodo, ARRI Alexa, or Sony FX6), 35mm or 50mm prime lens
- Skin: visible pores at 100% zoom, micro-hairs on face and arms, real skin oil sheen, subtle redness on nose/ears/knuckles, mild blemishes, NO airbrushing, NO frequency separation, NO beauty filter
- Fabric: visible weave, real wrinkles, fabric pilling where appropriate, light wear patterns
- Lighting: real bounce light with subtle color contamination from environment, NOT studio-perfect
- Photographic imperfections welcome: slight chromatic aberration on highlight edges, mild film grain, realistic motion micro-blur if applicable
- Color: slightly desaturated and naturally graded — NOT the oversaturated AI-look
- Anatomy: asymmetric features (real human faces are never perfectly symmetric), natural ear/nose proportions, real eye reflections (small + irregular catchlight)

ANONYMITY HARD RULES — the generated subject MUST be an anonymous everyday adult:
- NOT Cristiano Ronaldo, NOT Lionel Messi, NOT Neymar, NOT LeBron James, NOT any famous athlete
- NOT Brad Pitt, NOT George Clooney, NOT Tom Cruise, NOT any Hollywood actor
- NOT any celebrity, influencer, politician, or public figure from any country
- NOT the "AI default handsome face" — avoid generic AI-attractive symmetric features
- Face must be forgettable and unremarkable — like a stranger on the subway, NOT a magazine cover
- If reference shows specific ethnic look, match it; but anonymous

NEGATIVE PROMPT (ABSOLUTELY AVOID):
plastic skin, CGI render, 3D illustration, over-smoothed skin, glass eyes, beauty filter, artificial bloom, distorted proportions, uncanny valley, celebrity likeness, AI-generated look, default AI face, perfect symmetry, glossy plastic skin, frequency-separated skin, magazine retouch, Instagram filter, render artifacts.

=== AGE & LIGHTING FIDELITY ===
- AGE: The replacement subject must be the same apparent age as the original (±2 years). If the reference shows a 55-year-old with weathered skin, generate a 55-year-old with weathered skin. NEVER make the subject younger or smoother.
- LIGHTING: Reproduce the EXACT lighting of the reference — same key light angle, same shadow depth, same contrast ratio. If the reference has dramatic studio chiaroscuro, KEEP IT DRAMATIC. Do not add fill light. Do not soften shadows.
- WRINKLES & SKIN MARKS: If visible in the reference (forehead lines, crow's feet, beard texture, sun spots), preserve them exactly. These are NOT imperfections to fix — they are identity-defining features of the reference style.`;
}

function buildEnrichedPrompt(fusionPrompt: string): string {
  return fusionPrompt + `

=== RENDERING PARAMETERS ===
Identity preservation: 1.0 — ABSOLUTE: The face, skin tone, hair and facial structure from the IDENTITY REFERENCE image must appear in the output exactly as shown. Do not alter, blend, or average facial features with any other person.
Style transfer strength: 0.65 — Use clothing colors, environment and pose from the STYLE REFERENCE image, but freely adapt body proportions, shoulder width, neck, and torso to match the target gender anatomy.
Gender anatomy adaptation: Apply correct skeletal proportions for the stated target gender (broader shoulders, wider neck for male; narrower shoulders for female). Do NOT copy the silhouette outline of the style reference person.
Composite rule: Place the identity face onto a newly generated body that matches the target gender physique wearing the described clothing in the described environment.
CRITICAL FACE LOCK: The face in the output must be identical to the face in the identity_reference_image. Do NOT use, reference, blend, or interpolate the face of the person in the style reference image. If in doubt, discard the style reference face entirely.
Composition rules: Generate only what is explicitly described in the SCENE section. Do NOT add hands, arms, props, or background elements not mentioned. Keep the composition clean and anatomically correct. Avoid touching hands near the face unless explicitly stated.
PHOTOGRAPHY SPECS: Shot on Sony A7R IV with 85mm f/1.4 G Master lens. Natural skin texture with visible pores and subtle imperfections. Cinematic color grading. Detailed fabric folds and material texture. High dynamic range. Shallow depth of field bokeh. Ultra-realistic, no beauty filter, no retouching.
AVOID: plastic skin, CGI render, 3D illustration, over-smoothed skin, glass eyes, beauty filter, artificial bloom, distorted proportions, uncanny valley.`;
}

async function tryNanoBananaPro(
  prompt: string,
  aspectRatio: string,
  selfieBase64?: string,
  selfieMime?: string,
  styleBase64?: string,
  styleMime?: string,
): Promise<string> {
  const key = process.env.NANO_BANANA_API_KEY!;
  const url = `${BASE}/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${key}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proParts: any[] = [];

  const isShieldMode = !selfieBase64 && !!styleBase64;

  if (isShieldMode && styleBase64 && styleMime) {
    proParts.push({ text: '[CENA ORIGINAL — clone esta imagem com precisão forense. Substitua SOMENTE o rosto e a identidade da pessoa por um modelo virtual fictício, genérico e não rastreável. NÃO altere absolutamente nada mais: roupa, cores, materiais, textura do tecido, logos, pose, mãos, fundo, iluminação, temperatura de cor, enquadramento, ângulo de câmera.]' });
    proParts.push({ inlineData: { data: styleBase64, mimeType: styleMime } });
  }

  if (selfieBase64 && selfieMime) {
    proParts.push({ text: '[IDENTITY REFERENCE — this is the person whose face must appear in the output. Preserve their face exactly.]' });
    proParts.push({ inlineData: { data: selfieBase64, mimeType: selfieMime } });
  }

  if (selfieBase64 && styleBase64 && styleMime) {
    proParts.push({ text: '[STYLE REFERENCE — copy the clothing, pose, environment, and lighting from this image. Do NOT copy the face.]' });
    proParts.push({ inlineData: { data: styleBase64, mimeType: styleMime } });
  }

  proParts.push({ text: isShieldMode ? buildShieldEnrichedPrompt(prompt) : buildEnrichedPrompt(prompt) });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: proParts }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: { aspectRatio: ratioMap[aspectRatio] ?? '1:1' },
      },
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

async function tryNanoBanana2(
  prompt: string,
  aspectRatio: string,
  selfieBase64?: string,
  selfieMime?: string,
  styleBase64?: string,
  styleMime?: string,
): Promise<string> {
  const key = process.env.NANO_BANANA_API_KEY!;
  const url = `${BASE}/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${key}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parts: any[] = [];

  const isShieldMode = !selfieBase64 && !!styleBase64;

  if (isShieldMode && styleBase64 && styleMime) {
    parts.push({ text: '[CENA ORIGINAL — clone esta imagem com precisão forense. Substitua SOMENTE o rosto e a identidade da pessoa por um modelo virtual fictício, genérico e não rastreável. NÃO altere absolutamente nada mais: roupa, cores, materiais, textura do tecido, logos, pose, mãos, fundo, iluminação, temperatura de cor, enquadramento, ângulo de câmera.]' });
    parts.push({ inlineData: { data: styleBase64, mimeType: styleMime } });
  }

  if (selfieBase64 && selfieMime) {
    parts.push({ text: '[IDENTITY REFERENCE — this is the person whose face must appear in the output. Preserve their face exactly.]' });
    parts.push({ inlineData: { data: selfieBase64, mimeType: selfieMime } });
  }

  if (selfieBase64 && styleBase64 && styleMime) {
    parts.push({ text: '[STYLE REFERENCE — copy the clothing, pose, environment, and lighting from this image. Do NOT copy the face.]' });
    parts.push({ inlineData: { data: styleBase64, mimeType: styleMime } });
  }

  parts.push({ text: isShieldMode ? buildShieldEnrichedPrompt(prompt) : buildEnrichedPrompt(prompt) });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: { aspectRatio: ratioMap[aspectRatio] ?? '1:1' },
      },
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

export async function generateImage(params: GenerateParams): Promise<string> {
  const { prompt, aspectRatio, imageBase64, mimeType, styleImageBase64, styleMimeType } = params;
  const errors: string[] = [];

  const isShieldMode = !imageBase64 && !!styleImageBase64;

  const models: [string, () => Promise<string>][] = [
    ['NanoBananaPro', () => tryNanoBananaPro(prompt, aspectRatio, imageBase64, mimeType, styleImageBase64, styleMimeType)],
    ['NanoBanana2',   () => tryNanoBanana2(prompt, aspectRatio, imageBase64, mimeType, styleImageBase64, styleMimeType)],
    // Imagen4 has no image input — skip in shield mode where visual reference is required
    ...(!isShieldMode ? [['Imagen4', () => tryImagen4(prompt, aspectRatio)] as [string, () => Promise<string>]] : []),
  ];

  for (const [name, fn] of models) {
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
