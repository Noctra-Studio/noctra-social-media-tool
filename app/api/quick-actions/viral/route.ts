import { NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic';
import { withUserInputLanguageRule } from '@/lib/ai/language-rule';
import {
  asPlatform,
  formatBrandVoice,
  getQuickActionContext,
  parseAnthropicJson,
  saveRawIdeas,
} from '@/lib/quick-actions/server';
import type { QuickActionViralTrend } from '@/lib/quick-actions/types';

type ViralResponse = {
  trends?: Array<{
    angle?: unknown;
    hook?: unknown;
    platform?: unknown;
    trend_context?: unknown;
    urgency?: unknown;
  }>;
};

export async function POST(req: Request) {
  try {
    const { brandVoice, supabase, user } = await getQuickActionContext();
    const body = (await req.json()) as { platform?: unknown };
    const platform = asPlatform(body.platform);

    if (!platform) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    const currentMonth = new Intl.DateTimeFormat('es-MX', { month: 'long' }).format(new Date());
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2600,
      system: withUserInputLanguageRule(`You are a content strategist for Noctra Studio, a digital agency in Querétaro, Mexico specializing in web dev, SEO, and AI automation.

Based on current viral content trends on ${platform} in the LATAM/Mexico digital marketing space, generate 5 content ideas that Noctra Studio could create TODAY to tap into these trends.

For each idea:
- Explain the trend it taps into (1 sentence)
- Provide a specific hook/opening line for Noctra's voice
- Suggest the best angle: opinion | tutorial | story | data
- Rate urgency: high (trending now) | medium (rising) | low (evergreen)

Brand voice:
${formatBrandVoice(brandVoice)}

Return ONLY valid JSON:
{ "trends": [{ "trend_context": "...", "hook": "...", "angle": "opinion", "urgency": "high", "platform": "${platform}" }] }`),
      messages: [
        {
          role: 'user',
          content: `Use web_search to search for:
1. "contenido viral agencias digitales ${platform} 2026 LATAM"
2. "tendencias marketing digital México ${platform} ${currentMonth}"

Then return the JSON only.`,
        },
      ],
      tool_choice: { type: 'auto', disable_parallel_tool_use: true },
      tools: [
        {
          name: 'web_search',
          type: 'web_search_20250305',
          max_uses: 2,
          user_location: {
            city: 'Querétaro',
            country: 'MX',
            region: 'Querétaro',
            type: 'approximate',
          },
        },
      ],
    });

    const parsed = parseAnthropicJson<ViralResponse>(message);
    const normalizedTrends = (parsed.trends ?? [])
      .map((trend) => {
        const trendPlatform = asPlatform(trend.platform);

        if (
          trendPlatform !== platform ||
          typeof trend.trend_context !== 'string' ||
          typeof trend.hook !== 'string' ||
          typeof trend.angle !== 'string' ||
          (trend.urgency !== 'high' && trend.urgency !== 'medium' && trend.urgency !== 'low')
        ) {
          return null;
        }

        return {
          angle: trend.angle.trim(),
          hook: trend.hook.trim(),
          platform,
          trend_context: trend.trend_context.trim(),
          urgency: trend.urgency,
        };
      })
      .filter((item): item is Omit<QuickActionViralTrend, 'savedIdeaId'> => item !== null);

    if (normalizedTrends.length === 0) {
      throw new Error('Invalid viral response');
    }

    const savedIdeas = await saveRawIdeas(
      supabase,
      user.id,
      normalizedTrends.map((trend) => ({
        platform: trend.platform,
        rawIdea: `${trend.hook}\n\nTendencia: ${trend.trend_context}\nUrgencia: ${trend.urgency}\nÁngulo: ${trend.angle}`,
      }))
    );

    const responseTrends: QuickActionViralTrend[] = normalizedTrends.map((trend, index) => ({
      ...trend,
      savedIdeaId: savedIdeas[index]?.id ?? '',
    }));

    return NextResponse.json({ trends: responseTrends });
  } catch (error: unknown) {
    console.error('Error generating viral ideas:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate viral ideas';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
