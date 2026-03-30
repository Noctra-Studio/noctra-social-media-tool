import { createClient } from '@/lib/supabase/server';

export async function buildUserContext(userId: string, platform: string) {
  const supabase = await createClient();

  // Query last 30 posts for this user + platform
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('content, angle')
    .eq('user_id', userId)
    .eq('platform', platform)
    .neq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(30);

  // Query post_feedback joined with posts: rating >= 4 OR used_as_published = true
  const { data: feedbackData } = await supabase
    .from('post_feedback')
    .select('rating, used_as_published, posts!inner(content)')
    .eq('user_id', userId)
    .or('rating.gte.4,used_as_published.eq.true');

  const topPerforming = feedbackData?.map((f: any) => f.posts) || [];

  // Query ai_learning_context
  const { data: learningCtx } = await supabase
    .from('ai_learning_context')
    .select('context_type, content')
    .eq('user_id', userId)
    .eq('platform', platform);

  const avoided_patterns = learningCtx?.filter(c => c.context_type === 'avoided').map(c => c.content) || [];
  const style_notes = learningCtx?.filter(c => c.context_type === 'style_note').map(c => c.content) || [];
  
  // Extract recent topics from recent posts content
  const recent_topics = recentPosts?.map(p => {
     try {
       const contentObj = p.content as any;
       return contentObj?.caption ? contentObj.caption.substring(0, 50) : '';
     } catch { return ''; }
  }).filter(Boolean) || [];

  return {
    top_performing_posts: topPerforming,
    avoided_patterns,
    style_notes,
    recent_topics,
    total_posts_generated: recentPosts?.length || 0
  };
}
