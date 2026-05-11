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

export type MediumType = 'photograph' | 'digital_painting' | 'oil_painting' | '3d_render' | 'illustration' | 'anime' | 'watercolor';

export interface StyleFeatures {
  mediumType: MediumType;
  mediumDescription: string;
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
  medium: string;
  magicalElements: string;
  poseHandsDetail: string;
}

type MimeType = 'image/jpeg' | 'image/png' | 'image/webp';

const AI_BRAND_BLOCKLIST = [
  'nano banana', 'nanobeen', 'midjourney', 'dall-e', 'dalle', 'stable diffusion',
  'flux', 'ideogram', 'leonardo', 'firefly', 'imagen', 'gemini', 'sora',
  'runway', 'krea', 'recraft', 'adobe', 'bing create', 'fotor', 'canva ai',
];

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

export async function analyzeStyleImage(imageBase64: string, mimeType: string, originalPrompt?: string): Promise<StyleFeatures> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const additionalContext = originalPrompt
    ? `\n\n=== ADDITIONAL CONTEXT (original creation prompt) ===\nThis image was generated using the following prompt. Cross-reference it with the image to resolve ambiguities and improve accuracy:\n"${originalPrompt}"\n`
    : '';

  const prompt = `You are a Visual DNA Extractor. Extract every visual fingerprint from this image so that a new anonymous subject can be placed into the EXACT same scene, pose, medium, and atmosphere. Return ONLY a valid JSON object (no markdown, no explanation).${additionalContext}

=== PRIORITY 1 — MEDIUM TYPE (most critical — controls entire rendering pipeline) ===
Classify the EXACT medium. Choose ONE from: "photograph", "digital_painting", "oil_painting", "3d_render", "illustration", "anime", "watercolor"
- Use "photograph" for any realistic camera-based image (photoshoot, editorial, studio, outdoor photo)
- NEVER classify a photograph as digital_painting or vice versa

=== PRIORITY 2 — POSE PRECISION (including hands and arms) ===
bodyDynamics: weight distribution, axis tilt, shoulder/hip offset, limb positions, kinetic state
poseHandsDetail: exact arm/hand positions with angles. E.g.: "both hands clasped in lap, elbows on armrests, shoulders square"
pose: structural orientation only, no clothing. E.g.: "frontal, eye-level, chin neutral"

=== PRIORITY 3 — COSTUME & SCENE ===
outfitDescription: full outfit with materials, colors, details
textureDetails: fabric weave, hardware finish (matte/gloss), leather grain, embroidery
magicalElements: supernatural effects (glows, particles, auras) or empty string

=== PRIORITY 4 — LIGHTING ===
lighting: single label (e.g. "soft studio", "golden hour", "neon", "blue hour")
lightingExact: color temperature (Kelvin), key light position (clock angle + degrees elevation), key/fill/rim roles, shadow hardness, dominant palette, lens artifacts

=== PRIORITY 5 — SCENE CLONE ===
scenarioStyling: location materials, props, surface textures, color palette, atmospheric condition
cameraAngle: framing distance (ECU/CU/MCU/MS/MLS/FS/EWS) + vertical angle + lens estimate

{
  "mediumType": "photograph" or "digital_painting" or "oil_painting" or "3d_render" or "illustration" or "anime" or "watercolor",
  "mediumDescription": "full medium description with NOT [wrong medium] clause, e.g. 'photorealistic editorial photograph, sharp focus, natural skin texture, NOT a CGI render, NOT a painting'",
  "referenceGender": "male" or "female" or "unknown",
  "outfitDescription": "complete outfit in one precise sentence",
  "outfitItems": ["each item with material"],
  "colors": ["exact color names"],
  "footwear": "footwear with material and detail",
  "accessories": ["each accessory with material"],
  "pose": "structural orientation only",
  "environment": "one sentence location summary",
  "lighting": "single label",
  "lightingExact": "full cinematographic fingerprint",
  "aesthetic": "artistic style and editorial aesthetic",
  "mood": "emotional tone",
  "cameraAngle": "framing distance + vertical angle + lens estimate",
  "bodyDynamics": "structural body language including arm state",
  "scenarioStyling": "location scout note",
  "textureDetails": "material and texture inventory",
  "medium": "same as mediumDescription (legacy field)",
  "magicalElements": "supernatural effects or empty string",
  "poseHandsDetail": "exact arm and hand positions"
}`;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageBase64, mimeType: mimeType as MimeType } },
    ]);
    const text = result.response.text().trim().replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(text);
    // Ensure mediumType is a valid value; default to photograph for realistic images
    if (!['photograph', 'digital_painting', 'oil_painting', '3d_render', 'illustration', 'anime', 'watercolor'].includes(parsed.mediumType)) {
      parsed.mediumType = 'photograph';
    }
    // Sync legacy field
    parsed.medium = parsed.mediumDescription || parsed.medium;
    return parsed;
  } catch {
    return {
      mediumType: 'photograph',
      mediumDescription: 'photorealistic editorial photography, NOT a CGI render, NOT a painting',
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
      medium: 'photorealistic editorial photography',
      magicalElements: '',
      poseHandsDetail: '',
    };
  }
}

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

export interface FidelityScore {
  overall: number;
  pose: number;
  lighting: number;
  environment: number;
  costume: number;
  medium: number;
  feedback: string;
  regenerate: boolean;
}

export async function scoreFidelity(
  referenceBase64: string,
  referenceMime: string,
  generatedBase64: string,
  generatedMime: string,
): Promise<FidelityScore> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are a Visual Fidelity Judge. Compare image A (reference/original) with image B (AI-generated recreation) and score how faithfully image B reproduces the STYLE of image A (NOT the person — the subject is intentionally replaced).

Score each dimension from 0 to 100:
- pose: similarity of body posture, arms, head tilt
- lighting: color temperature, direction, shadow pattern, intensity
- environment: background, location, props, atmosphere
- costume: outfit type, colors, materials, accessories
- medium: artistic medium match (photography vs painting vs 3D, etc.)
- overall: weighted average (medium 30%, lighting 25%, costume 20%, pose 15%, environment 10%)

Return ONLY valid JSON (no markdown):
{
  "overall": number,
  "pose": number,
  "lighting": number,
  "environment": number,
  "costume": number,
  "medium": number,
  "feedback": "concise Portuguese sentence about the main divergences (max 2 sentences)",
  "regenerate": boolean (true if overall < 70)
}`;

  try {
    const result = await model.generateContent([
      { text: '[IMAGE A — Reference/Original]:' },
      { inlineData: { data: referenceBase64, mimeType: referenceMime as MimeType } },
      { text: '[IMAGE B — AI-Generated Recreation]:' },
      { inlineData: { data: generatedBase64, mimeType: generatedMime as MimeType } },
      { text: prompt },
    ]);
    const text = result.response.text().trim().replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch {
    return {
      overall: 0,
      pose: 0,
      lighting: 0,
      environment: 0,
      costume: 0,
      medium: 0,
      feedback: 'Não foi possível avaliar a fidelidade automaticamente.',
      regenerate: false,
    };
  }
}

export async function extractPromptFromImage(imageBase64: string, mimeType: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Inspect this image for embedded AI generation prompt text (usually a multi-sentence paragraph overlaid at the bottom or edges).

Rules:
- Extract ONLY the actual generation prompt text (sentences describing the scene/person/style)
- EXCLUDE: AI tool brand names (nano banana, midjourney, dall-e, stable diffusion, flux, gemini, imagen, firefly, runway, etc.)
- EXCLUDE: @username handles, website domains, URLs, social media handles
- EXCLUDE: short single-word labels, watermarks positioned at corners/edges
- EXCLUDE: any Midjourney parameter flags: --ar, --v, --chaos, --stylize, --style, --quality, --q
- If no multi-sentence generation prompt is visible, return exactly the word: NONE

Return ONLY the cleaned prompt text, or NONE.`;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageBase64, mimeType: mimeType as MimeType } },
    ]);
    let text = result.response.text().trim();
    if (!text || text === 'NONE' || text.length < 15) return '';

    // Post-process: strip known AI brands and handles
    for (const brand of AI_BRAND_BLOCKLIST) {
      text = text.replace(new RegExp(`\\b${brand}\\b`, 'gi'), '');
    }
    text = text.replace(/@\w+/g, '').replace(/https?:\/\/\S+/g, '').replace(/\s{2,}/g, ' ').trim();

    return text.length >= 15 ? text : '';
  } catch {
    return '';
  }
}

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
