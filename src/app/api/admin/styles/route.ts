import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

async function getAdminOrError() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Não autorizado.' }, { status: 401 }) };

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) {
    return { error: NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 }) };
  }

  const admin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  return { admin };
}

export async function GET() {
  try {
    const result = await getAdminOrError();
    if (result.error) return result.error;
    const { admin } = result;

    const { data: styles, error } = await admin!
      .from('styles')
      .select('id, name, thumbnail_url, room, usage_count, is_admin_created, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin/styles GET]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ styles: styles ?? [] });
  } catch (e) {
    console.error('[admin/styles GET]', e);
    return NextResponse.json({ error: 'Erro desconhecido' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const result = await getAdminOrError();
    if (result.error) return result.error;
    const { admin } = result;

    const { id, name, room } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 });

    const updates: Record<string, string> = {};
    if (name !== undefined) updates.name = name;
    if (room !== undefined) updates.room = room;

    const { data: style, error } = await admin!
      .from('styles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[admin/styles PATCH]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ style });
  } catch (e) {
    console.error('[admin/styles PATCH]', e);
    return NextResponse.json({ error: 'Erro desconhecido' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const result = await getAdminOrError();
    if (result.error) return result.error;
    const { admin } = result;

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 });

    const { error } = await admin!
      .from('styles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[admin/styles DELETE]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[admin/styles DELETE]', e);
    return NextResponse.json({ error: 'Erro desconhecido' }, { status: 500 });
  }
}
