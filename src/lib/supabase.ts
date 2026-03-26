import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseAnonKey;

/** Cliente público (browser-safe) */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Cliente admin (server-side only — tem permissão para escrever no Storage) */
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Faz upload de imagem gerada para o bucket 'generated-images'.
 * Deve ser chamado apenas em server-side (API routes).
 * Retorna a URL pública permanente ou null se falhar.
 */
export async function uploadGeneratedImage(
  base64: string,
  styleId: string,
  userId = 'anonymous'
): Promise<string | null> {
  try {
    const bytes = Buffer.from(base64, 'base64');
    const filename = `${userId}/${styleId}-${Date.now()}.png`;

    const { error } = await supabaseAdmin.storage
      .from('generated-images')
      .upload(filename, bytes, {
        contentType: 'image/png',
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error.message);
      return null;
    }

    const { data } = supabaseAdmin.storage
      .from('generated-images')
      .getPublicUrl(filename);

    return data.publicUrl;
  } catch (e) {
    console.error('uploadGeneratedImage failed:', e);
    return null;
  }
}
