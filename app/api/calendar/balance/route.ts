import { getUser } from '@/lib/auth/get-user';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { startOfMonth, endOfMonth, parseISO, format, getDaysInMonth } from 'date-fns';

export async function GET(req: Request) {
  try {
    try {
      await getUser();
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

    const { data: posts, error } = await supabase
      .from('posts')
      .select('platform, angle, scheduled_at')
      .gte('scheduled_at', start.toISOString())
      .lte('scheduled_at', end.toISOString())
      .neq('status', 'draft');

    if (error) throw error;

    const by_platform: Record<string, number> = { instagram: 0, linkedin: 0, x: 0 };
    const by_angle: Record<string, number> = {};
    const contentDays = new Set<string>();

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
      });
    }

    const daysWithContent = contentDays.size;

    return NextResponse.json({
      by_platform,
      by_angle,
      total: posts?.length || 0,
      days_with_content: daysWithContent,
      days_without_content: totalDays - daysWithContent
    });

  } catch (error: unknown) {
    console.error('Error fetching calendar balance:', error);
    const msg = error instanceof Error ? error.message : 'Failed to fetch balance';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
