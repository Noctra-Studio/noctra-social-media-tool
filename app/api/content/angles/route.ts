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
    const { idea, platform } = body;

    if (!idea || !platform) {
      return NextResponse.json({ error: 'Missing idea or platform' }, { status: 400 });
    }

    const prompt = `You are an expert social media strategist. 
The user has a raw idea: "${idea}"
They want to post this on ${platform}.

Please suggest exactly 4 different "angles" or creative approaches to present this idea.
Common angles include: opinion, tutorial, story, data/insights, contrarian, behind-the-scenes, etc.

Return ONLY a JSON object (no markdown, no backticks, no extra text) with this structure:
{
  "angles": [
    {
      "type": "opinion",
      "hook": "A short, catchy hook that stops the scroll.",
      "one_liner": "A 1-sentence preview of what this angle would produce."
    },
    ... (3 more)
  ]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: withUserInputLanguageRule("You output only pure JSON."),
      messages: [
        { role: 'user', content: prompt }
      ]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = JSON.parse(stripMarkdownJSON(responseText));

    return NextResponse.json(parsed);

  } catch (error: unknown) {
    console.error('Error generating angles:', error);
    const msg = error instanceof Error ? error.message : 'Failed to generate angles';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
