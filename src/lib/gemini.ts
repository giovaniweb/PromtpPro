import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Analisa a foto do usuário com Gemini Vision e retorna uma descrição
 * detalhada do sujeito em inglês para enriquecer o prompt de geração.
 */
export async function analyzePhoto(imageBase64: string, mimeType: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Analyze this photo and provide a concise description (2-3 sentences) of the person in English.
Focus on: physical appearance (hair color/style, facial features, skin tone),
approximate age, expression, and posture.
Do NOT include clothing details — only the person's natural characteristics.
Example: "Young woman with long dark curly hair, light brown skin, high cheekbones, warm smile.
Approximately 25-30 years old. Confident upright posture with a relaxed, approachable expression."`;

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
