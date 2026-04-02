import { NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic';
import { withUserInputLanguageRule } from '@/lib/ai/language-rule';
import { type Platform } from '@/lib/product';
import {
  asPlatform,
  formatBrandVoice,
  getQuickActionContext,
  parseAnthropicJson,
  saveRawIdeas,
} from '@/lib/quick-actions/server';
import type { QuickActionPlanItem } from '@/lib/quick-actions/types';

type PlanResponse = {
  plan?: Array<{
    angle?: unknown;
    day?: unknown;
    hook?: unknown;
    platform?: unknown;
    why?: unknown;
  }>;
};

export async function POST(req: Request) {
  try {
    const { brandVoice, supabase, user } = await getQuickActionContext();
    const body = (await req.json()) as {
      days?: unknown;
      platforms?: unknown;
      user_id?: unknown;
      history?: string[];
    };

    const days = typeof body.days === 'number' ? Math.trunc(body.days) : Number(body.days);
    const requestedPlatforms = Array.isArray(body.platforms)
      ? body.platforms.map((item) => asPlatform(item)).filter((item): item is Platform => item !== null)
      : [];

    if (!Number.isFinite(days) || days < 3 || days > 30 || requestedPlatforms.length === 0) {
      return NextResponse.json({ error: 'Invalid quick action payload' }, { status: 400 });
    }

    const history = Array.isArray(body.history) ? body.history : [];
    const historyContext = history.length > 0 
      ? `\n\nThe following ideas have already been suggested in this session: \n- ${history.join('\n- ')}\n\nDO NOT repeat these topics, hooks, or angles. Explore DIFFERENT creative directions.`
      : '';

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2200,
      system: withUserInputLanguageRule(`You are a social media content strategist for Noctra Studio, a boutique digital agency in Querétaro, Mexico.
Brand voice:
${formatBrandVoice(brandVoice)}

Generate a ${days}-day content plan for: ${requestedPlatforms.join(', ')}.${historyContext}

Rules:
- Distribute content types evenly: opinion, tutorial, story, data
- No two consecutive posts on the same topic
- Each idea must feel specific to Noctra's services (web dev, SEO, branding, AI automation for LATAM SMBs)
- For each day/platform, provide:
  { day: number, platform: string, angle: string, hook: string, why: string }

Return ONLY valid JSON:
{ "plan": [{ "day": 1, "platform": "linkedin", "angle": "opinion", "hook": "...", "why": "..." }] }`),
      messages: [{ role: 'user', content: 'Generate the plan now.' }],
    });

    const parsed = parseAnthropicJson<PlanResponse>(message);
    const normalizedPlan = (parsed.plan ?? [])
      .map((item) => {
        const platform = asPlatform(item.platform);
        const day = typeof item.day === 'number' ? Math.trunc(item.day) : Number(item.day);

        if (
          !platform ||
          !requestedPlatforms.includes(platform) ||
          !Number.isFinite(day) ||
          day < 1 ||
          day > days ||
          typeof item.angle !== 'string' ||
          typeof item.hook !== 'string' ||
          typeof item.why !== 'string'
        ) {
          return null;
        }

        return {
          angle: item.angle.trim(),
          day,
          hook: item.hook.trim(),
          platform,
          why: item.why.trim(),
        };
      })
      .filter((item): item is Omit<QuickActionPlanItem, 'savedIdeaId'> => item !== null);

    if (normalizedPlan.length === 0) {
      throw new Error('Invalid plan response');
    }

    const savedIdeas = await saveRawIdeas(
      supabase,
      user.id,
      normalizedPlan.map((item) => ({
        platform: item.platform,
        rawIdea: `Día ${item.day}: ${item.hook}\n\nÁngulo: ${item.angle}\n\nPor qué: ${item.why}`,
      }))
    );

    const responsePlan: QuickActionPlanItem[] = normalizedPlan.map((item, index) => ({
      ...item,
      savedIdeaId: savedIdeas[index]?.id ?? '',
    }));

    return NextResponse.json({ plan: responsePlan });
  } catch (error: unknown) {
    console.error('Error generating quick plan:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate plan';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
