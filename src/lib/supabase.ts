import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Faz upload de imagem gerada para o bucket 'generated-images' do Supabase Storage.
 * Retorna a URL pública permanente.
 */
export async function uploadGeneratedImage(
  base64: string,
  styleId: string,
  userId = 'anonymous'
): Promise<string | null> {
  try {
    const bytes = Buffer.from(base64, 'base64');
    const filename = `${userId}/${styleId}-${Date.now()}.png`;

    const { error } = await supabase.storage
      .from('generated-images')
      .upload(filename, bytes, {
        contentType: 'image/png',
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error.message);
      return null;
    }

    const { data } = supabase.storage
      .from('generated-images')
      .getPublicUrl(filename);

    return data.publicUrl;
  } catch (e) {
    console.error('uploadGeneratedImage failed:', e);
    return null;
  }
}
