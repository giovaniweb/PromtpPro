import HomeGallery from '@/components/HomeGallery';
import { createClient } from '@supabase/supabase-js';
import { allStyles, StyleItem } from '@/data';

async function getTrendingIds(): Promise<Set<string>> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
      .from('styles')
      .select('id')
      .gt('usage_count', 0)
      .order('usage_count', { ascending: false })
      .limit(10);
    return new Set((data ?? []).map((r: { id: string }) => r.id));
  } catch {
    return new Set();
  }
}

async function getAdminStyles(): Promise<StyleItem[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
      .from('styles')
      .select('id, name, thumbnail_url, prompt_en, room')
      .eq('is_admin_created', true)
      .order('created_at', { ascending: false });

    return (data ?? []).map((s: { id: string; name: string; thumbnail_url: string; prompt_en: string; room: string }) => ({
      id:         s.id,
      title:      s.name,
      room:       s.room as StyleItem['room'],
      tags:       [],
      thumbnail:  s.thumbnail_url,
      prompt_pt:  s.prompt_en,
      prompt_en:  s.prompt_en,
      aspect_ratio: '9:16',
    }));
  } catch {
    return [];
  }
}

export default async function Home() {
  const [trendingIds, adminStyles] = await Promise.all([getTrendingIds(), getAdminStyles()]);
  const combined = [...adminStyles, ...allStyles];

  return <HomeGallery styles={combined} trendingIds={trendingIds} />;
}
