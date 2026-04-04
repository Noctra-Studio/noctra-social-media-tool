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
import type { QuickActionThoughtLeadershipPost } from '@/lib/quick-actions/types';

type ThoughtLeadershipResponse = {
  post?: {
    content?: Record<string, unknown>;
    platform?: unknown;
  };
  stance_used?: unknown;
};

export async function POST(req: Request) {
  try {
    const { brandVoice, supabase, user, workspace } = await getQuickActionContext();
    if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 401 })
    const body = (await req.json()) as {
      platform?: unknown;
      stance?: unknown;
      topic?: unknown;
    };

    const platform = asPlatform(body.platform);
    const stance = typeof body.stance === 'string' ? body.stance.trim() : '';

    if (!platform || typeof body.topic !== 'string' || !body.topic.trim()) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const topic = body.topic.trim();

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
      max_tokens: 1900,
      system: withUserInputLanguageRule([
        buildTemporalContext(),
        buildLatamGeoContext(),
        buildNoctraIndustryContext(),
        `You are writing a thought leadership post for Manu, founder of Noctra Studio — a boutique digital agency in Querétaro, Mexico specializing in web development, SEO, branding, and AI automation for LATAM SMBs.

Brand voice:
${formatBrandVoice(brandVoice)}

Topic: ${topic}
Stance provided: ${stance || 'generate a contrarian but defensible stance'}
Platform: ${platform}

Write a thought leadership post that:
- Opens with a bold, specific claim (not a question)
- Challenges a common assumption in the industry
- Backs the argument with 1-2 specific observations from the Mexican/LATAM market context
- Ends with an insight, not a pitch
- Sounds like a practitioner, not a consultant
- NEVER uses: 'innovación', 'ecosistema digital', 'sinergia', 'transformación digital', 'soluciones integrales'

Platform rules:
LinkedIn: 180-250 words, short paragraphs, no hashtag overload (max 4)
X: thread of 4-6 tweets, each tweet a standalone argument
Instagram: 120-150 words, hook + 3 punchy points + CTA

Return ONLY valid JSON:
{ "post": { "platform": "${platform}", "content": { "caption": "..." } }, "stance_used": "..." }`,
        temporalClosingInstruction,
      ].join('\n\n')),
      messages: [{ role: 'user', content: 'Write the thought leadership post now.' }],
    });

    const parsed = parseAnthropicJson<ThoughtLeadershipResponse>(message);
    const resultPlatform = asPlatform(parsed.post?.platform);

    if (
      !resultPlatform ||
      resultPlatform !== platform ||
      !parsed.post?.content ||
      typeof parsed.stance_used !== 'string'
    ) {
      throw new Error('Invalid thought leadership response');
    }

    const savedPosts = await saveDraftPosts(supabase, user.id, workspace.id, [
      {
        angle: 'Thought leadership',
        content: parsed.post.content,
        ideaText: `Thought leadership: ${topic}\nPostura: ${parsed.stance_used}`,
        platform,
      },
    ]);

    const responsePost: QuickActionThoughtLeadershipPost = {
      content: parsed.post.content,
      platform,
      savedPostId: savedPosts[0]?.id ?? '',
      stance_used: parsed.stance_used,
    };

    return NextResponse.json({ post: responsePost });
  } catch (error: unknown) {
    console.error('Error generating thought leadership:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate thought leadership';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
