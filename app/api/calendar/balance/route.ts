import { getUser } from '@/lib/auth/get-user';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { startOfMonth, endOfMonth, parseISO, format, getDaysInMonth } from 'date-fns';

type PillarSummary = {
  color: string | null;
  count: number;
  id: string;
  name: string;
  percentage: number;
};

export async function GET(req: Request) {
  try {
    let user;

    try {
      user = await getUser();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const yearStr = searchParams.get('year');
    const monthStr = searchParams.get('month');

    if (!yearStr || !monthStr) {
      return NextResponse.json({ error: 'Missing year or month' }, { status: 400 });
    }

    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));
    const totalDays = getDaysInMonth(new Date(year, month - 1));

    const [{ data: posts, error }, { data: pillars, error: pillarsError }] = await Promise.all([
      supabase
      .from('posts')
      .select('platform, angle, scheduled_at, pillar_id')
      .gte('scheduled_at', start.toISOString())
      .lte('scheduled_at', end.toISOString())
      .neq('status', 'draft')
      .eq('user_id', user.id),
      supabase
        .from('brand_pillars')
        .select('id, name, color, sort_order')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true }),
    ]);

    if (error || pillarsError) throw error || pillarsError;

    const by_platform: Record<string, number> = { instagram: 0, linkedin: 0, x: 0 };
    const by_angle: Record<string, number> = {};
    const contentDays = new Set<string>();
    const pillarCounts = new Map<string, number>();

    if (posts) {
      posts.forEach(post => {
        if (post.platform) {
          by_platform[post.platform] = (by_platform[post.platform] || 0) + 1;
        }
        if (post.angle) {
          by_angle[post.angle] = (by_angle[post.angle] || 0) + 1;
        }
        if (post.scheduled_at) {
          const day = format(parseISO(post.scheduled_at), 'yyyy-MM-dd');
          contentDays.add(day);
        }
        if (post.pillar_id) {
          pillarCounts.set(post.pillar_id, (pillarCounts.get(post.pillar_id) || 0) + 1);
        }
      });
    }

    const daysWithContent = contentDays.size;
    const totalPosts = posts?.length || 0;
    const by_pillar: PillarSummary[] = ((pillars as Array<{ color: string | null; id: string; name: string }> | null) || []).map((pillar) => {
      const count = pillarCounts.get(pillar.id) || 0;

      return {
        color: pillar.color,
        count,
        id: pillar.id,
        name: pillar.name,
        percentage: totalPosts > 0 ? (count / totalPosts) * 100 : 0,
      };
    });

    return NextResponse.json({
      by_platform,
      by_angle,
      by_pillar,
      total: totalPosts,
      days_with_content: daysWithContent,
      days_without_content: totalDays - daysWithContent
    });

  } catch (error: unknown) {
    console.error('Error fetching calendar balance:', error);
    const msg = error instanceof Error ? error.message : 'Failed to fetch balance';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
