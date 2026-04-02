import { getUser } from '@/lib/auth/get-user';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { anthropic } from '@/lib/anthropic';

export async function POST(req: Request) {
  try {
    let user;
    try {
      user = await getUser();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { idea } = await req.json();

    if (!idea) {
      return NextResponse.json({ error: 'Missing idea' }, { status: 400 });
    }

    // Fetch last 30 posts
    const { data: recentPosts, error } = await supabase
      .from('posts')
      .select('id, angle, content, platform, scheduled_at')
      .neq('status', 'draft')
      .order('scheduled_at', { ascending: false })
      .limit(30);

    if (error) throw error;

    if (!recentPosts || recentPosts.length === 0) {
      return NextResponse.json({ is_repeat: false });
    }

    const postsSummary = recentPosts.map(p => 
      `ID: ${p.id} | Platform: ${p.platform} | Angle: ${p.angle} | Content Extract: ${JSON.stringify(p.content).substring(0, 100)}`
    ).join('\n');

    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      temperature: 0.1,
      system: "You detect if a new post idea repeats a topic already covered recently. Respond ONLY with JSON: { \"is_repeat\": boolean, \"similar_post_id\"?: string, \"similarity_reason\"?: string }",
      messages: [
        { role: "user", content: `New idea: ${idea}\n\nRecent posts: \n${postsSummary}` }
      ]
    });

    const textContent = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const cleanJson = textContent.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(cleanJson);

    return NextResponse.json(parsed);

  } catch (error: unknown) {
    console.error('Error checking repeat:', error);
    // On failure we just assume it's not a repeat to not block the user
    return NextResponse.json({ is_repeat: false });
  }
}
