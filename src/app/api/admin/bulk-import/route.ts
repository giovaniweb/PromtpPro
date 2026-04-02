import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

interface StyleRecord {
  id: string;
  name: string;
  thumbnail_url: string;
  prompt_en: string;
  room: string;
  usage_count: number;
}

function parseCSV(text: string): StyleRecord[] {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ''; });
    return {
      id:            obj.id || crypto.randomUUID(),
      name:          obj.name || 'Sem nome',
      thumbnail_url: obj.thumbnail_url || '',
      prompt_en:     obj.prompt_en || '',
      room:          obj.room || 'editorial',
      usage_count:   parseInt(obj.usage_count ?? '0', 10) || 0,
    };
  }).filter(r => r.name && r.thumbnail_url);
}

function parseJSON(text: string): StyleRecord[] {
  const arr = JSON.parse(text);
  if (!Array.isArray(arr)) throw new Error('JSON deve ser um array de objetos.');
  return arr.map((obj: Record<string, unknown>) => ({
    id:            (obj.id as string) || crypto.randomUUID(),
    name:          (obj.name as string) || 'Sem nome',
    thumbnail_url: (obj.thumbnail_url as string) || '',
    prompt_en:     (obj.prompt_en as string) || '',
    room:          (obj.room as string) || 'editorial',
    usage_count:   Number(obj.usage_count) || 0,
  })).filter(r => r.name && r.thumbnail_url);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
    }

    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'Arquivo obrigatório.' }, { status: 400 });

    const text = await file.text();
    let records: StyleRecord[];

    try {
      if (file.name.endsWith('.json')) {
        records = parseJSON(text);
      } else {
        records = parseCSV(text);
      }
    } catch (e) {
      return NextResponse.json({
        error: `Erro ao processar arquivo: ${e instanceof Error ? e.message : 'formato inválido'}`,
      }, { status: 400 });
    }

    if (records.length === 0) {
      return NextResponse.json({ error: 'Nenhum registro válido encontrado. Verifique se name e thumbnail_url estão preenchidos.' }, { status: 400 });
    }

    const admin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: upsertError, data } = await admin
      .from('styles')
      .upsert(records, { onConflict: 'id', ignoreDuplicates: true })
      .select('id');

    if (upsertError) {
      console.error('[bulk-import] Erro:', upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({
      total: records.length,
      inserted: data?.length ?? 0,
    });
  } catch (error) {
    console.error('[bulk-import] Erro:', error);
    return NextResponse.json({ error: 'Erro desconhecido' }, { status: 500 });
  }
}
