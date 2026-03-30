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
    const { post_id } = await req.json();

    if (!post_id) {
      return NextResponse.json({ error: 'Missing post_id' }, { status: 400 });
    }

    const { error } = await supabase
      .from('posts')
      .update({
        scheduled_at: null,
        status: 'draft'
      })
      .eq('id', post_id);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error('Error unscheduling post:', error);
    const msg = error instanceof Error ? error.message : 'Unscheduling failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
