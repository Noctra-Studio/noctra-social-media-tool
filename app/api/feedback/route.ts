import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/get-user';
import { extractLearnings } from '@/lib/ai/extract-learnings';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    let user;
    try {
      user = await getUser();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { post_id, rating, used_as_published, edited_before_publish, notes } = body;

    if (!post_id || !rating) {
      return NextResponse.json({ error: 'Missing standard params' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify post ownership & get details synchronously
    const { data: post, error: postErr } = await supabase
      .from('posts')
      .select('*')
      .eq('id', post_id)
      .eq('user_id', user.id)
      .single();

    if (postErr || !post) {
      return NextResponse.json({ error: 'Post not found or unauthorized' }, { status: 404 });
    }

    const feedbackObj = {
      post_id,
      user_id: user.id,
      rating,
      used_as_published: used_as_published || false,
      edited_before_publish: edited_before_publish || false,
      notes: notes || null
    };

    // Save strictly
    const { data: feedbackRow, error: fbErr } = await supabase
      .from('post_feedback')
      .insert([feedbackObj])
      .select('*')
      .single();

    if (fbErr) {
      throw new Error(fbErr.message);
    }

    // Fire and forget Haiku AI extraction layer so UI resolves at 200 ms
    extractLearnings(post, feedbackRow, user.id).catch(err => {
      console.error('Background LLM extraction failed:', err);
    });

    return NextResponse.json({ success: true, feedback: feedbackRow });

  } catch (error: unknown) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
