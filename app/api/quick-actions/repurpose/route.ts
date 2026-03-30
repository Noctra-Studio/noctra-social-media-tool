import { NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic';
import { withUserInputLanguageRule } from '@/lib/ai/language-rule';
import { platforms, type Platform } from '@/lib/product';
import {
  asPlatform,
  formatBrandVoice,
  formatPostContentForPrompt,
  getQuickActionContext,
  parseAnthropicJson,
  saveDraftPosts,
} from '@/lib/quick-actions/server';
import type { QuickActionRepurposeAdaptation } from '@/lib/quick-actions/types';

type AdaptationResponse = {
  adaptations?: Array<{
    content?: Record<string, unknown>;
    platform?: unknown;
  }>;
};

type PostRow = {
  angle: string | null;
  content: Record<string, unknown> | null;
  platform: Platform;
};

export async function POST(req: Request) {
  try {
    const { brandVoice, supabase, user } = await getQuickActionContext();
    const body = (await req.json()) as {
      post_id?: unknown;
      source_platform?: unknown;
    };

    if (typeof body.post_id !== 'string') {
      return NextResponse.json({ error: 'Missing post id' }, { status: 400 });
    }

    const sourcePlatform = asPlatform(body.source_platform);

    if (!sourcePlatform) {
      return NextResponse.json({ error: 'Invalid source platform' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('posts')
      .select('angle, content, platform')
      .eq('id', body.post_id)
      .eq('user_id', user.id)
      .maybeSingle();

    const sourcePost = (data as PostRow | null) ?? null;

    if (error) {
      throw error;
    }

    if (!sourcePost || !sourcePost.content) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const originalCaption = formatPostContentForPrompt(sourcePost.content);
    const targetPlatforms = platforms.filter((platform) => platform !== sourcePlatform);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2200,
      system: withUserInputLanguageRule(`You are adapting a social media post for Noctra Studio across platforms.
Brand voice:
${formatBrandVoice(brandVoice)}

Original post (${sourcePlatform}):
${originalCaption}

Adapt this content for the other 2 platforms following these rules:

Instagram: visual hook, max 150 words, 5-8 hashtags, emoji moderate, strong CTA. Keep the core insight, reframe the opening.
LinkedIn: 150-250 words, thought leadership angle, short paragraphs, max 5 hashtags, professional but human tone.
X: if > 270 chars create a thread (array of tweets), each tweet max 270 chars, punchy and direct.

Return ONLY valid JSON:
{ "adaptations": [{ "platform": "linkedin", "content": { "caption": "...", "hashtags": ["#uno"] } }] }`),
      messages: [{ role: 'user', content: `Adapt the post for ${targetPlatforms.join(', ')}.` }],
    });

    const parsed = parseAnthropicJson<AdaptationResponse>(message);
    const normalizedAdaptations = (parsed.adaptations ?? [])
      .map((adaptation) => {
        const platform = asPlatform(adaptation.platform);

        if (!platform || !targetPlatforms.includes(platform) || !adaptation.content) {
          return null;
        }

        return {
          content: adaptation.content,
          platform,
        };
      })
      .filter((item): item is Omit<QuickActionRepurposeAdaptation, 'savedPostId'> => item !== null);

    if (normalizedAdaptations.length === 0) {
      throw new Error('Invalid repurpose response');
    }

    const savedPosts = await saveDraftPosts(
      supabase,
      user.id,
      normalizedAdaptations.map((adaptation) => ({
        angle: sourcePost.angle || 'Repurpose',
        content: adaptation.content,
        ideaText: `Repurpose de ${sourcePlatform}: ${originalCaption.slice(0, 180)}`,
        platform: adaptation.platform,
      }))
    );

    const responseAdaptations: QuickActionRepurposeAdaptation[] = normalizedAdaptations.map((adaptation, index) => ({
      ...adaptation,
      savedPostId: savedPosts[index]?.id ?? '',
    }));

    return NextResponse.json({ adaptations: responseAdaptations });
  } catch (error: unknown) {
    console.error('Error repurposing post:', error);
    const message = error instanceof Error ? error.message : 'Failed to repurpose post';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
