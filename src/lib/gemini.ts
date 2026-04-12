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
  medium: string;
  magicalElements: string;
  poseHandsDetail: string;
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

  const prompt = `You are a Subject Swap Specialist and Visual DNA Extractor. Your mission: extract every visual fingerprint from this image so that a new subject can be placed into the EXACT same scene, pose, medium, and atmosphere. The subject's FACE will be replaced — everything else must be cloned with forensic precision. Return ONLY a valid JSON object (no markdown, no explanation).

=== PRIORITY 1 — MEDIUM & ARTISTIC STYLE (most critical) ===
Identify the EXACT artistic medium. This determines the entire rendering pipeline.
- If it is a digital painting: say "intricate digital painting with visible painterly brushstrokes and rich color layering, NOT a 3D CGI render, NOT a photograph"
- If it is an oil painting: say "oil painting on canvas, painterly impasto texture, NOT a photograph"
- If it is a 3D CGI render: say "3D CGI render, subsurface scattering skin, ray-traced reflections, NOT a photograph"
- If it is a photograph: say "photorealistic photograph, [lens/film characteristics]"
- Other: anime illustration, watercolor, concept art, etc. — be equally explicit
- ALWAYS add a "NOT [wrong medium]" clause to prevent the model from defaulting to its bias

=== PRIORITY 2 — POSE PRECISION (including hands and arms) ===
For bodyDynamics: describe weight distribution, axis tilt degrees, shoulder/hip offset, limb positioning, kinetic state. INCLUDE the state of arms — "arms raised above head" / "arms at sides" / "one arm extended upward".
For poseHandsDetail: describe exact arm and hand positions explicitly. Example: "both arms raised overhead, right arm fully extended upward with fingers spread wide, left arm bent at elbow with forearm at 90° angle, palms open facing forward, head tilted slightly left"
For pose: structural orientation ONLY, no clothing references. Example: "three-quarter turn, facing camera-left, chin slightly down"

=== PRIORITY 3 — COSTUME & MAGICAL ELEMENTS ===
For outfitDescription and textureDetails: include filigree patterns, glowing emblems, luminescent armor details.
For magicalElements: describe ALL supernatural visual effects visible — glowing elements, particle effects, halos, light blooms, luminescent patterns, magical auras. Example: "glowing golden chest emblem emitting warm light; luminescent teal filigree armor patterns with inner glow; soft golden particle effects around raised hands; warm light bloom emanating from crown of head". Empty string if none present.

=== PRIORITY 4 — LIGHTING & COLOR PALETTE ===
For lighting: single label only — e.g. "golden hour" / "mystical twilight" / "hard studio" / "neon" / "blue hour"
For lightingExact: full fingerprint — color temperature in Kelvin, clock-position of key light, sun/source angle in degrees above horizon, key/fill/rim roles and relative intensities, shadow hardness, dominant chromatic palette, any lens artifacts. Example: "~3200K warm amber dominant, mystical teal secondary, key from above-right at 45° elevation, soft volumetric fill, no hard shadows, golden bloom at top of frame"

=== PRIORITY 5 — SCENE CLONE ===
For scenarioStyling: location scout note — architecture materials, prop inventory, surface textures, dominant color palette, time of day, atmospheric condition.
For cameraAngle: BOTH framing distance (ECU/CU/MCU/MS/MLS/FS/EWS) AND vertical angle (bird's eye/high/slight plongée/eye-level/slight contre-plongée/contre-plongée/worm's eye) AND lens estimate. Example: "medium-shot, slight contre-plongée, 50mm prime"
For textureDetails: enumerate every distinct material — fabric weave type, hardware finish (matte/gloss/brushed/hammered), leather grain, embroidery, embossing, armor plating style. Example: "hammered gold filigree armor plates with etched floral motifs; teal silk underlayer with subtle sheen; articulated pauldrons with gemstone inlays"

{
  "referenceGender": "male" or "female" or "unknown",
  "outfitDescription": "complete outfit in one precise sentence including all visible materials and any magical/luminescent elements",
  "outfitItems": ["each item with its material, e.g. 'hammered gold filigree breastplate'"],
  "colors": ["exact color names, e.g. 'deep teal', 'burnished gold', 'midnight black'"],
  "footwear": "footwear with material and sole detail",
  "accessories": ["each accessory with material and finish"],
  "pose": "structural orientation only per PRIORITY 2 above",
  "environment": "one sentence location summary",
  "lighting": "single label per PRIORITY 4 above",
  "lightingExact": "full cinematographic fingerprint per PRIORITY 4 above",
  "aesthetic": "artistic style and editorial aesthetic",
  "mood": "emotional tone and vibe",
  "cameraAngle": "framing distance + vertical angle + lens estimate per PRIORITY 5 above",
  "bodyDynamics": "structural body language including arm state per PRIORITY 2 above",
  "scenarioStyling": "location scout note per PRIORITY 5 above",
  "textureDetails": "material and texture inventory per PRIORITY 5 above",
  "medium": "artistic medium per PRIORITY 1 above — always include NOT [wrong medium] clause",
  "magicalElements": "all supernatural visual effects per PRIORITY 3, or empty string if none",
  "poseHandsDetail": "exact arm and hand positions per PRIORITY 2 above"
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
      medium: 'photorealistic editorial photography',
      magicalElements: '',
      poseHandsDetail: '',
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
