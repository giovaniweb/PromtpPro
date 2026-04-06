import { NextRequest, NextResponse } from 'next/server';
import { analyzeStyleImage, generateStyleTitle } from '@/lib/gemini';
import { generateImage } from '@/lib/nanoBanana';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

function slugify(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });

    const form = await req.formData();
    const file = form.get('file') as File | null;
    const name = (form.get('name') as string | null)?.trim();
    const room = (form.get('room') as string | null) ?? 'editorial';

    if (!file) return NextResponse.json({ error: 'Campo obrigatório: file' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const refBase64   = Buffer.from(arrayBuffer).toString('base64');
    const refMime     = file.type || 'image/jpeg';

    // Se o admin não informou um nome, a IA gera automaticamente
    const [styleFeatures, resolvedName] = await Promise.all([
      analyzeStyleImage(refBase64, refMime),
      name ? Promise.resolve(name) : generateStyleTitle(refBase64, refMime),
    ]);

    const shieldPrompt = [
      `[Protagonista] Modelo virtual hiper-realista e fictício, feições universais e comerciais, olhar cativante, identidade visual única e não rastreável.`,
      `[Câmera] ${styleFeatures.cameraAngle || 'eye-level, 50mm prime'}. Preservar exatamente este enquadramento — distância de framing e ângulo vertical idênticos.`,
      `[Dinâmica Corporal] ${styleFeatures.bodyDynamics || 'natural, relaxed confidence'}. Linguagem corporal autêntica e fluida. NÃO reinterpretar a pose.`,
      `[Cenário] ${styleFeatures.scenarioStyling || styleFeatures.environment || 'studio profissional, backdrop neutro'}.`,
      `[Iluminação — CRÍTICO] ${styleFeatures.lightingExact || styleFeatures.lighting || 'soft studio lighting'}. Preservar exatamente: temperatura de cor, direção, intensidade e padrão de sombras. NÃO substituir por iluminação de estúdio genérica. NÃO neutralizar tons quentes ou frios.`,
      `[Vestuário] ${styleFeatures.outfitDescription}. Cores: ${styleFeatures.colors.join(', ') || 'neutro'}.`,
      styleFeatures.textureDetails
        ? `[Texturas e Materiais] ${styleFeatures.textureDetails}. Preservar todos os detalhes de tecido, acabamentos de hardware e superfícies.`
        : '',
      `[Framing] Proporção vertical 9:16 exata, enquadramento editorial otimizado para formato stories mobile.`,
      `[Optics] f/2.8, nitidez impecável, 8k resolution, ray-traced shadows, comercial de alto padrão.`,
      `[Mood] ${styleFeatures.mood || 'editorial, confident'}.`,
    ].filter(Boolean).join('\n');

    const generatedBase64 = await generateImage({ imageBase64: '', mimeType: 'image/jpeg', prompt: shieldPrompt, aspectRatio: '9:16' });

    const supabaseAdmin = createSupabaseAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const styleId = `admin-${slugify(resolvedName)}-${Date.now()}`;
    const filename = `${styleId}.png`;
    const bytes = Buffer.from(generatedBase64, 'base64');

    const { error: uploadError } = await supabaseAdmin.storage.from('style-thumbnails').upload(filename, bytes, { contentType: 'image/png', upsert: false });
    if (uploadError) return NextResponse.json({ error: 'Falha ao salvar imagem.' }, { status: 500 });

    const { data: urlData } = supabaseAdmin.storage.from('style-thumbnails').getPublicUrl(filename);

    const { data: newStyle, error: insertError } = await supabaseAdmin.from('styles').insert({ id: styleId, name: resolvedName, thumbnail_url: urlData.publicUrl, prompt_en: shieldPrompt, room, is_admin_created: true, usage_count: 0 }).select().single();
    if (insertError) {
      console.error('[admin/create-style] Insert error:', insertError);
      return NextResponse.json({ error: `Falha ao salvar estilo: ${insertError.message}` }, { status: 500 });
    }

    return NextResponse.json({ style: newStyle });
  } catch (error) {
    console.error('[admin/create-style] Erro:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 });
  }
}
