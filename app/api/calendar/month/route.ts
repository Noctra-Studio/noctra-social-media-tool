import { getUser } from '@/lib/auth/get-user';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { startOfMonth, endOfMonth, parseISO, format } from 'date-fns';

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
    const month = parseInt(monthStr); // 1-12
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));

    // Fetch scheduled/published for this month
    const { data: scheduledPosts, error: scheduledError } = await supabase
      .from('posts')
      .select('*, content_ideas(raw_idea)')
      .gte('scheduled_at', start.toISOString())
      .lte('scheduled_at', end.toISOString())
      .neq('status', 'draft')
      .order('scheduled_at', { ascending: true });

    if (scheduledError) throw scheduledError;

    // Fetch all unscheduled drafts
    const { data: drafts, error: draftsError } = await supabase
      .from('posts')
      .select('*, content_ideas(raw_idea)')
      .eq('status', 'draft')
      .is('scheduled_at', null)
      .order('created_at', { ascending: false });

    if (draftsError) throw draftsError;

    // Group scheduled posts by date (YYYY-MM-DD)
    const grouped: Record<string, typeof scheduledPosts> = {};
    if (scheduledPosts) {
      scheduledPosts.forEach(post => {
        if (!post.scheduled_at) return;
        const dateKey = format(parseISO(post.scheduled_at), 'yyyy-MM-dd');
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(post);
      });
    }

    const calendarObj = Object.assign({}, ...Object.entries(grouped).map(([date, posts]) => ({ [date]: posts })));

    return NextResponse.json({
      scheduled: calendarObj,
      drafts: drafts || []
    });

  } catch (error: unknown) {
    console.error('Error in /month API:', error);
    const msg = error instanceof Error ? error.message : 'Failed to fetch month data';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
