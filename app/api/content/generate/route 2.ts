import { NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic';
import { getUser } from '@/lib/auth/get-user';
import { buildUserContext } from '@/lib/ai/build-user-context';

// Type representing the brand voice DB schema
export type BrandVoice = {
  tone?: string;
  values?: string[];
  forbidden_words?: string[];
  example_posts?: string[];
};

export async function POST(req: Request) {
  try {
    let user;
    try {
      user = await getUser();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { idea, platform, angle, brand_voice } = body;

    if (!idea || !platform || !angle) {
      return NextResponse.json({ error: 'Missing idea, platform, or angle' }, { status: 400 });
    }

    const bv: BrandVoice = brand_voice || {};

    let platformRules = '';
    let jsonSchema = '';

    if (platform === 'instagram') {
      platformRules = `- Caption max 150 words.
- Include 5-10 hashtags.
- Strong opening hook.
- Moderate use of emojis.
- Call To Action (CTA) at the end.`;
      jsonSchema = `{ "caption": "The main text with emojis and CTA...", "hashtags": ["#tag1", "#tag2"] }`;
    } else if (platform === 'linkedin') {
      platformRules = `- Post length 150-250 words.
- Max 5 hashtags.
- Thought leadership angle.
- Use line breaks every 2-3 sentences for readability.
- Conversational but professional.`;
      jsonSchema = `{ "caption": "The LinkedIn post...", "hashtags": ["#tag1", "#tag2"] }`;
    } else if (platform === 'x') {
      platformRules = `- If content > 280 chars, generate a thread (array of tweets).
- Each tweet max 270 chars (to reserve room for numbering like 1/5).
- No hashtags unless highly relevant (max 2).`;
      jsonSchema = `{ "thread": ["Tweet 1", "Tweet 2", "Tweet 3"] }`;
    } else {
      return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 });
    }

    const context = await buildUserContext(user.id, platform);

    let learningInjection = '';
    if (context.total_posts_generated >= 5) {
      learningInjection = `
APRENDIZAJES DE POSTS ANTERIORES PARA ${platform.toUpperCase()}:
Posts con mejor rendimiento (referencia de estilo y tono):
${context.top_performing_posts.length > 0 ? context.top_performing_posts.map((p: any) => typeof p.content === 'object' && p.content ? p.content.caption : '').filter(Boolean).join('\n---\n') : 'Ninguno todavía.'}

Patrones a evitar: ${context.avoided_patterns.length > 0 ? context.avoided_patterns.join(', ') : 'Ninguno.'}

Notas de estilo: ${context.style_notes.length > 0 ? context.style_notes.join(', ') : 'Ninguno.'}

Temas recientes (evitar repetición): ${context.recent_topics.length > 0 ? context.recent_topics.join(', ') : 'Ninguno.'}`;
    }

    const systemPrompt = `You are the lead content strategist for Noctra Studio (a digital agency based in Querétaro, Mexico).
Brand voice: "Ingeniería de Claridad" — direct, modern, no fluff, results-oriented.
Language: Spanish (LATAM). Tone: authoritative but approachable.
Target audience: SMBs, startups, independent professionals in Mexico/LATAM.

CUSTOM BRAND VOICE OVERRIDES:
- Tone Guidelines: ${bv.tone || 'direct, modern'}
- Core Values: ${bv.values ? bv.values.join(', ') : 'claridad, resultados'}
- Forbidden Words: ${bv.forbidden_words ? bv.forbidden_words.join(', ') : 'none'}
- Example Posts: ${bv.example_posts?.length ? bv.example_posts.map((p, i) => `Example ${i+1}: ${p}`).join('\n') : 'none'}

${learningInjection}

Your task is to generate social media content based on a raw idea.
You must adhere EXACTLY to the platform rules.
OUTPUT FORMAT: Pure JSON only, exactly matching this schema:
${jsonSchema}`;

    const prompt = `Idea: "${idea}"
Target Platform: ${platform}
Angle / Approach: ${angle}

PLATFORM RULES:
${platformRules}

Generate the content now. Remember: pure JSON output, no markdown blocks.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: prompt }
      ]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const parsedContent = JSON.parse(responseText.trim());

    return NextResponse.json({
      platform,
      content: parsedContent,
      angle,
      raw: idea
    });

  } catch (error: unknown) {
    console.error('Error generating content:', error);
    const msg = error instanceof Error ? error.message : 'Failed to generate content';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
