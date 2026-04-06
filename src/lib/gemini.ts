import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface IdentityFeatures {
  gender: 'male' | 'female' | 'unknown';
  description: string;
  facialFeatures: string;
  skinTone: string;
  hairStyle: string;
  bodyType: string;
  approximateAge: string;
}

export interface StyleFeatures {
  referenceGender: 'male' | 'female' | 'unknown';
  outfitDescription: string;
  outfitItems: string[];
  colors: string[];
  footwear: string;
  accessories: string[];
  pose: string;
  environment: string;
  lighting: string;
  lightingExact: string;
  aesthetic: string;
  mood: string;
  cameraAngle: string;
  bodyDynamics: string;
  scenarioStyling: string;
  textureDetails: string;
}

type MimeType = 'image/jpeg' | 'image/png' | 'image/webp';

/**
 * Analisa a selfie do usuário e extrai features de identidade.
 * Camada 1 do Identity Fusion Pipeline.
 */
export async function analyzeIdentity(imageBase64: string, mimeType: string): Promise<IdentityFeatures> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Analyze this person's photo and return ONLY a valid JSON object (no markdown, no explanation):
{
  "gender": "male" or "female" or "unknown",
  "description": "2-sentence natural description of their appearance",
  "facialFeatures": "detailed facial features: jaw, eyes, nose, expression",
  "skinTone": "skin tone and complexion",
  "hairStyle": "hair style, length and color",
  "bodyType": "body build and posture",
  "approximateAge": "age range like 25-35"
}`;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageBase64, mimeType: mimeType as MimeType } },
    ]);
    const text = result.response.text().trim().replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch {
    return {
      gender: 'unknown',
      description: 'Person in the uploaded photo.',
      facialFeatures: '',
      skinTone: '',
      hairStyle: '',
      bodyType: '',
      approximateAge: '',
    };
  }
}

/**
 * Analisa a imagem de referência do estilo e extrai features visuais.
 * Camada 1 do Identity Fusion Pipeline.
 */
export async function analyzeStyleImage(imageBase64: string, mimeType: string): Promise<StyleFeatures> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are an obsessively precise Director of Photography and Fashion Editor. Your mission is to extract every visual fingerprint from this photo with forensic accuracy so the exact atmosphere can be reproduced. Return ONLY a valid JSON object (no markdown, no explanation).

EXTRACTION RULES — read carefully before filling each field:
- lighting: single label only — e.g. "golden hour" / "overcast" / "hard studio" / "neon" / "blue hour"
- lightingExact: full cinematographic fingerprint — color temperature in Kelvin, clock-position of key light, sun/source angle in degrees above horizon, key/fill/rim roles and relative intensities, shadow hardness, any lens artifacts (flare, halation). Example: "~2700K, key at 4-o'clock 20° above horizon, hard key from camera-right, warm amber rim on left shoulder, no fill, deep camera-left shadows, mild lens flare streak top-right corner"
- textureDetails: enumerate every distinct material and its surface texture observable — fabric weave type (e.g. 2x2 rib, jersey, canvas), hardware finish (matte/gloss/brushed/hammered), zipper style/brand if visible, leather grain pattern, knit gauge, embroidery, embossing. Example: "2x2 ribbed merino knit at cuffs; YKK brass-finish metal zipper with pull tab; hammered rectangular belt buckle in aged brass; full-grain cowhide leather with visible pore pattern; coarse canvas outer shell"
- cameraAngle: state BOTH framing distance (ECU/CU/MCU/MS/MLS/FS/EWS) AND vertical angle (bird's eye/high/slight plongée/eye-level/slight contre-plongée/contre-plongée/worm's eye) AND lens estimate. Example: "medium-close-up, eye-level, 85mm portrait prime"
- bodyDynamics: structural body language — weight distribution, axis tilt degrees, shoulder/hip offset, limb positioning, kinetic state. Example: "contrapposto — weight on right hip, left shoulder dropped 15°, right arm extended downward, torso rotated 20° toward camera, static"
- pose: structural orientation ONLY, no clothing references. Example: "three-quarter turn, facing camera-left, chin slightly down"
- scenarioStyling: location scout note — architecture materials, prop inventory, surface textures of the environment, dominant color palette, time of day, atmospheric condition. Example: "brutalist poured-concrete rooftop, rusted industrial railings, warm desaturated amber tones, golden hour atmosphere, no props"

{
  "referenceGender": "male" or "female" or "unknown",
  "outfitDescription": "complete outfit in one precise sentence including all visible materials",
  "outfitItems": ["each item with its material, e.g. 'ribbed merino wool turtleneck'"],
  "colors": ["exact color names, e.g. 'burnt sienna', 'off-white ivory'"],
  "footwear": "footwear with material and sole detail",
  "accessories": ["each accessory with material and finish"],
  "pose": "structural orientation only per rules above",
  "environment": "one sentence location summary",
  "lighting": "single label per rules above",
  "lightingExact": "full cinematographic fingerprint per rules above",
  "aesthetic": "photographic style and editorial aesthetic",
  "mood": "emotional tone and vibe",
  "cameraAngle": "framing distance + vertical angle + lens estimate per rules above",
  "bodyDynamics": "structural body language per rules above",
  "scenarioStyling": "location scout note per rules above",
  "textureDetails": "material and texture inventory per rules above"
}`;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageBase64, mimeType: mimeType as MimeType } },
    ]);
    const text = result.response.text().trim().replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch {
    return {
      referenceGender: 'unknown',
      outfitDescription: 'Fashion style outfit.',
      outfitItems: [],
      colors: [],
      footwear: '',
      accessories: [],
      pose: '',
      environment: '',
      lighting: 'natural light',
      lightingExact: 'natural light, direction unknown, intensity unknown',
      aesthetic: 'editorial photography',
      mood: '',
      cameraAngle: 'eye-level, 50mm prime',
      bodyDynamics: 'natural, relaxed confidence',
      scenarioStyling: 'professional studio, clean backdrop, soft diffused light',
      textureDetails: '',
    };
  }
}

/**
 * Gera um título comercial curto (máx 4 palavras, em português) para um estilo fashion/editorial.
 * Usado pelo Copyright Shield quando o admin não informa o nome manualmente.
 */
export async function generateStyleTitle(imageBase64: string, mimeType: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Look at this fashion/editorial photo and generate a short commercial style name in Brazilian Portuguese.
Maximum 4 words, no quotes, capitalize each word.
Examples: Retrato Neon, Moda Urbana, Executivo Moderno, Editorial Clean, Fantasia Dourada.
Reply ONLY with the title, nothing else.`;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageBase64, mimeType: mimeType as MimeType } },
    ]);
    const title = result.response.text().trim().replace(/['"]/g, '');
    return title || 'Estilo Editorial';
  } catch {
    return 'Estilo Editorial';
  }
}

/**
 * Descrição simples da foto (legacy — usado como fallback).
 */
export async function analyzePhoto(imageBase64: string, mimeType: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Analyze this photo and provide a concise description (2-3 sentences) of the person in English.
Focus on: physical appearance (hair color/style, facial features, skin tone), approximate age, expression, and posture.
Do NOT describe clothing — only the person's natural characteristics.`;

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: imageBase64, mimeType: mimeType as MimeType } },
  ]);

  return result.response.text().trim();
}
