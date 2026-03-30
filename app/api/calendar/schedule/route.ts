import { getUser } from '@/lib/auth/get-user';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    try {
      await getUser();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = await createClient();
    const { post_id, scheduled_at } = await req.json();

    if (!post_id || !scheduled_at) {
      return NextResponse.json({ error: 'Missing post_id or scheduled_at' }, { status: 400 });
    }

    const { error } = await supabase
      .from('posts')
      .update({
        scheduled_at,
        status: 'scheduled'
      })
      .eq('id', post_id);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error('Error scheduling post:', error);
    const msg = error instanceof Error ? error.message : 'Scheduling failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
