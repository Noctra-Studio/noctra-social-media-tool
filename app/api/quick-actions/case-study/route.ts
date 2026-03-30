import { NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic';
import {
  asPlatform,
  formatBrandVoice,
  getQuickActionContext,
  parseAnthropicJson,
  saveDraftPosts,
} from '@/lib/quick-actions/server';
import type { QuickActionSavedPost } from '@/lib/quick-actions/types';

type CaseStudyResponse = {
  post?: {
    content?: Record<string, unknown>;
    platform?: unknown;
  };
};

export async function POST(req: Request) {
  try {
    const { brandVoice, supabase, user } = await getQuickActionContext();
    const body = (await req.json()) as {
      client?: unknown;
      platform?: unknown;
      result?: unknown;
      service?: unknown;
    };

    const platform = asPlatform(body.platform);

    if (
      !platform ||
      typeof body.client !== 'string' ||
      typeof body.service !== 'string' ||
      typeof body.result !== 'string' ||
      !body.client.trim() ||
      !body.service.trim() ||
      !body.result.trim()
    ) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const client = body.client.trim();
    const service = body.service.trim();
    const result = body.result.trim();

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1800,
      system: `You are writing a case study post for Noctra Studio, a boutique digital agency in Querétaro, Mexico.
Brand voice:
${formatBrandVoice(brandVoice)}

Client: ${client}
Service delivered: ${service}
Result: ${result}
Platform: ${platform}

Write a case study post following this structure:
1. Hook — the result, stated boldly (no fluff intro)
2. Context — who the client was and what they needed (2-3 sentences)
3. What we did — the specific approach, not generic (3-4 sentences)
4. The result — quantified if possible
5. Takeaway — one transferable lesson for the reader

Platform rules:
Instagram: max 150 words, 5 hashtags, visual storytelling tone
LinkedIn: 200-250 words, professional, emphasize ROI and process
X: thread of 4-5 tweets, each punchy and standalone

IMPORTANT: Never mention client names without placeholder approval.
Use 'un cliente de [industry]' format unless client field explicitly contains a public brand name.

Return ONLY valid JSON:
{ "post": { "platform": "${platform}", "content": { "caption": "...", "hashtags": ["#uno"] } } }`,
      messages: [{ role: 'user', content: 'Write the case study now.' }],
    });

    const parsed = parseAnthropicJson<CaseStudyResponse>(message);
    const resultPlatform = asPlatform(parsed.post?.platform);

    if (!resultPlatform || resultPlatform !== platform || !parsed.post?.content) {
      throw new Error('Invalid case study response');
    }

    const savedPosts = await saveDraftPosts(supabase, user.id, [
      {
        angle: 'Caso de estudio',
        content: parsed.post.content,
        ideaText: `Caso de estudio: ${service} · ${result}`,
        platform,
      },
    ]);

    const responsePost: QuickActionSavedPost = {
      content: parsed.post.content,
      platform,
      savedPostId: savedPosts[0]?.id ?? '',
    };

    return NextResponse.json({ post: responsePost });
  } catch (error: unknown) {
    console.error('Error generating case study:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate case study';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
