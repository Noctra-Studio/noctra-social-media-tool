import { anthropic } from '@/lib/anthropic';
import { createClient } from '@/lib/supabase/server';

export async function extractLearnings(post: any, feedback: any, userId: string) {
  if (!post || !feedback) return;

  const prompt = `Post platform: ${post.platform}
Post content: ${JSON.stringify(post.content)}
Rating: ${feedback.rating}/5
Published as-is: ${feedback.used_as_published}
Edited before publish: ${feedback.edited_before_publish}
Notes: ${feedback.notes || 'None'}`;

  try {
    const msg = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 500,
      temperature: 0.1,
      system: `You analyze social media post performance feedback to extract actionable learnings. Respond ONLY with JSON:
{
  "learnings": [{
    "context_type": "top_performing" | "avoided" | "style_note",
    "platform": "instagram" | "linkedin" | "x",
    "content": "string"
  }]
}`,
      messages: [ { role: "user", content: prompt } ]
    });

    const textContent = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const cleanJson = textContent.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(cleanJson);

    if (parsed.learnings && parsed.learnings.length > 0) {
      const supabase = await createClient();
      const inserts = parsed.learnings.map((l: any) => ({
        user_id: userId,
        platform: l.platform || post.platform,
        context_type: l.context_type,
        content: l.content.substring(0, 100),
        source_post_id: post.id
      }));
      
      const { error } = await supabase.from('ai_learning_context').insert(inserts);
      if (error) console.error('Failed to insert AI learning context:', error);
    }
    
    return parsed.learnings;
  } catch (error) {
    console.error('Extraction error:', error);
    return [];
  }
}
