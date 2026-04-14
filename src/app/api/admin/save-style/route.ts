import { NextRequest, NextResponse } from 'next/server';
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

    const body = await req.json();
    const { imageBase64, shieldPrompt, resolvedName, room } = body as {
      imageBase64?: string;
      shieldPrompt?: string;
      resolvedName?: string;
      room?: string;
    };

    if (!imageBase64 || !shieldPrompt || !resolvedName || !room) {
      return NextResponse.json({ error: 'Campos obrigatórios: imageBase64, shieldPrompt, resolvedName, room' }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const styleId = `admin-${slugify(resolvedName)}-${Date.now()}`;
    const filename = `${styleId}.png`;
    const bytes = Buffer.from(imageBase64, 'base64');

    const { error: uploadError } = await supabaseAdmin.storage
      .from('style-thumbnails')
      .upload(filename, bytes, { contentType: 'image/png', upsert: false });

    if (uploadError) {
      console.error('[admin/save-style] Upload error:', uploadError);
      return NextResponse.json({ error: 'Falha ao salvar imagem.' }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage.from('style-thumbnails').getPublicUrl(filename);

    const { data: newStyle, error: insertError } = await supabaseAdmin
      .from('styles')
      .insert({
        id: styleId,
        name: resolvedName,
        thumbnail_url: urlData.publicUrl,
        prompt_en: shieldPrompt,
        room,
        is_admin_created: true,
        usage_count: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[admin/save-style] Insert error:', insertError);
      return NextResponse.json({ error: `Falha ao salvar estilo: ${insertError.message}` }, { status: 500 });
    }

    console.log('[admin/save-style] Estilo salvo:', styleId);
    return NextResponse.json({ style: newStyle });
  } catch (error) {
    console.error('[admin/save-style] Erro:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 });
  }
}
