import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Analisa a foto do usuário com Gemini Vision (gemini-2.0-flash) e retorna
 * uma descrição detalhada do sujeito em inglês para enriquecer o prompt.
 */
export async function analyzePhoto(imageBase64: string, mimeType: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `Analyze this photo and provide a concise description (2-3 sentences) of the person in English.
Focus on: physical appearance (hair color/style, facial features, skin tone), approximate age, expression, and posture.
Do NOT describe clothing — only the person's natural characteristics.
Example: "Young man with short dark hair, olive skin, strong jaw, warm brown eyes. Approximately 28-35 years old. Confident posture with a relaxed, genuine smile."`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
      },
    },
  ]);

  return result.response.text().trim();
}
