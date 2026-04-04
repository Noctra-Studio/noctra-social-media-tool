import { NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic';
import { withUserInputLanguageRule } from '@/lib/ai/language-rule';
import { buildTemporalContext, buildLatamGeoContext, buildNoctraIndustryContext } from '@/lib/ai/temporal-context';
import {
  asPlatform,
  formatBrandVoice,
  getQuickActionContext,
  parseAnthropicJson,
  saveDraftPosts,
} from '@/lib/quick-actions/server';
import type { QuickActionFaqPost } from '@/lib/quick-actions/types';

type FaqResponse = {
  posts?: Array<{
    content?: Record<string, unknown>;
    platform?: unknown;
    question_used?: unknown;
  }>;
};

export async function POST(req: Request) {
  try {
    const { brandVoice, supabase, user, workspace } = await getQuickActionContext();
    if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 401 })
    const body = (await req.json()) as {
      count?: unknown;
      platform?: unknown;
      questions?: unknown;
    };

    const platform = asPlatform(body.platform);
    const count = typeof body.count === 'number' ? Math.trunc(body.count) : Number(body.count);

    if (
      !platform ||
      !Number.isFinite(count) ||
      count < 1 ||
      count > 5 ||
      typeof body.questions !== 'string' ||
      !body.questions.trim()
    ) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const questions = body.questions.trim();

    const temporalClosingInstruction = `
INSTRUCCIÓN FINAL — TIEMPO:
Antes de escribir este post, confirma mentalmente:
- ¿Estoy usando el año actual (${new Date().getFullYear()}) como presente? ✓
- ¿Estoy usando el año pasado (${new Date().getFullYear() - 1}) solo como historia
  o contraste, nunca como presente o futuro? ✓
- ¿Mis proyecciones usan horizonte relativo ("próximos meses", "para ${new Date().getFullYear() + 1}")
  y no años que ya pasaron? ✓
Si cualquier respuesta es NO — reescribe esa parte antes de responder.
`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2600,
      system: withUserInputLanguageRule([
        buildTemporalContext(),
        buildLatamGeoContext(),
        buildNoctraIndustryContext(),
        `You are a content strategist for Noctra Studio, a boutique digital agency in Querétaro, Mexico. You convert real client FAQs into educational social media content that builds authority.

Brand voice:
${formatBrandVoice(brandVoice)}

Client questions received:
${questions}

Platform: ${platform}
Number of posts to generate: ${count}

For each post:
- Pick one question (or combine related ones)
- Open with the question as a hook (reframed as a statement or bold claim, not literally as a question)
- Answer it clearly, specifically, and without jargon
- Add context only a practitioner would know
- End with what the reader should do with this information

NEVER make the brand sound like it's advertising.
The post should feel like genuine education, not a sales pitch.

Platform rules:
Instagram: max 150 words, 5 hashtags, conversational tone
LinkedIn: 180-220 words, professional, cite specific numbers if possible
X: thread of 3-4 tweets per FAQ, punchy and direct

Return ONLY valid JSON:
{ "posts": [{ "question_used": "...", "platform": "${platform}", "content": { "caption": "..." } }] }`,
        temporalClosingInstruction,
      ].join('\n\n')),
      messages: [{ role: 'user', content: 'Convert these FAQs into content now.' }],
    });

    const parsed = parseAnthropicJson<FaqResponse>(message);
    const normalizedPosts = (parsed.posts ?? [])
      .slice(0, count)
      .map((post) => {
        const postPlatform = asPlatform(post.platform);

        if (
          postPlatform !== platform ||
          typeof post.question_used !== 'string' ||
          !post.content
        ) {
          return null;
        }

        return {
          content: post.content,
          platform,
          question_used: post.question_used.trim(),
        };
      })
      .filter((item): item is Omit<QuickActionFaqPost, 'savedPostId'> => item !== null);

    if (normalizedPosts.length === 0) {
      throw new Error('Invalid FAQ response');
    }

    const savedPosts = await saveDraftPosts(
      supabase,
      user.id,
      workspace.id,
      normalizedPosts.map((post) => ({
        angle: 'FAQ',
        content: post.content,
        ideaText: `FAQ: ${post.question_used}`,
        platform,
      }))
    );

    const responsePosts: QuickActionFaqPost[] = normalizedPosts.map((post, index) => ({
      ...post,
      savedPostId: savedPosts[index]?.id ?? '',
    }));

    return NextResponse.json({ posts: responsePosts });
  } catch (error: unknown) {
    console.error('Error generating FAQ posts:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate FAQ posts';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
