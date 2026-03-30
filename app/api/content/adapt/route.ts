import { getUser } from '@/lib/auth/get-user';
import { NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic';
import { withUserInputLanguageRule } from '@/lib/ai/language-rule';
import { stripMarkdownJSON } from '@/lib/ai/strip-markdown-json';

export async function POST(req: Request) {
  try {
    let user;
    try {
      user = await getUser();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const { source_post, source_platform, target_platforms } = body;

    if (!source_post || !source_platform || !target_platforms || !Array.isArray(target_platforms)) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const platformRules: Record<string, string> = {
      instagram: `- Caption max 150 words.\n- Include 5-10 hashtags.\n- Strong opening hook.\n- Moderate use of emojis.\n- Call To Action (CTA) at the end.`,
      linkedin: `- Post length 150-250 words.\n- Max 5 hashtags.\n- Thought leadership angle.\n- Use line breaks every 2-3 sentences for readability.\n- Conversational but professional.`,
      x: `- If content > 280 chars, generate a thread (array of tweets).\n- Each tweet max 270 chars.\n- No hashtags unless highly relevant (max 2).`
    };

    const targetRules = target_platforms
      .map(p => `${p.toUpperCase()}:\n${platformRules[p]}`)
      .join('\n\n');

    const prompt = `You are a social media strategist for Noctra Studio (a digital agency based in Querétaro, Mexico).
Brand voice: "Ingeniería de Claridad" — direct, modern, no fluff, results-oriented, Spanish (LATAM).

You have an existing post written for ${source_platform}:
"""
${source_post}
"""

Your task is to ADAPT this exact same content and message to the following platforms: ${target_platforms.join(', ')}

Follow these strict rules for the target platforms:
${targetRules}

Return ONLY a JSON object (no markdown, no backticks, no extra text) with this structure:
{
  "adaptations": [
    {
      "platform": "instagram", // or whatever the target platform is
      "content": {
         // for instagram/linkedin: "caption": "...", "hashtags": [...]
         // for x: "thread": ["tweet 1", "tweet 2"]
      }
    }
  ]
}
`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: withUserInputLanguageRule("You output only pure JSON."),
      messages: [
        { role: 'user', content: prompt }
      ]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = JSON.parse(stripMarkdownJSON(responseText));

    return NextResponse.json(parsed);

  } catch (error: unknown) {
    console.error('Error adapting content:', error);
    const msg = error instanceof Error ? error.message : 'Failed to adapt content';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
