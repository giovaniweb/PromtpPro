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
  aesthetic: string;
  mood: string;
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

  const prompt = `Analyze this fashion/style photo and return ONLY a valid JSON object (no markdown, no explanation):
{
  "referenceGender": "male" or "female" or "unknown",
  "outfitDescription": "complete outfit in one sentence",
  "outfitItems": ["top", "bottom", "jacket", etc],
  "colors": ["primary color", "secondary color"],
  "footwear": "footwear description",
  "accessories": ["accessory1"],
  "pose": "body pose and stance description",
  "environment": "setting and background description",
  "lighting": "lighting type and quality",
  "aesthetic": "photographic style and aesthetic",
  "mood": "overall mood and vibe"
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
      aesthetic: 'editorial photography',
      mood: '',
    };
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
