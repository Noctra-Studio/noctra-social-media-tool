import { getUser } from '@/lib/auth/get-user';
import { NextResponse } from 'next/server';
import { genAI } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    let user;
    try {
      user = await getUser();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { images, brand_context } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'Missing images array' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }, { apiVersion: 'v1beta' });

    // Score sequentially or in parallel? Parallel is faster but might hit rate limits. We'll do a simple Promise.all
    // For each image, fetch the thumb_url and pass it to Gemini
    const scorePromises = images.map(async (img) => {
      try {
        const fetchRes = await fetch(img.url);
        if (!fetchRes.ok) throw new Error('Failed to fetch image');
        
        const arrayBuffer = await fetchRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = buffer.toString('base64');
        const mimeType = fetchRes.headers.get('content-type') || 'image/jpeg';

        const prompt = `Score this image for brand fit on a scale 0.0-1.0 based on:
- Color palette alignment: dark/minimal preferred (#0A0A0A, #F5F5F5 tones)
- Mood: professional, modern, tech-adjacent or editorial
- Subject matter relevance to: ${brand_context || 'Noctra Studio (Digital Agency)'}

Respond ONLY with JSON: { "score": float, "reason": "string" }`;

        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType
            }
          }
        ]);

        const text = result.response.text();
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonStr);

        return {
          ...img,
          on_brand_score: parsed.score,
          score_reason: parsed.reason,
        };
      } catch (err) {
        console.error('Error scoring image', img.id, err);
        // Default score on failure
        return {
          ...img,
          on_brand_score: 0.5,
          score_reason: 'Scoring failed',
        };
      }
    });

    const scoredImages = await Promise.all(scorePromises);

    // Sort descending
    scoredImages.sort((a, b) => b.on_brand_score - a.on_brand_score);

    return NextResponse.json({ images: scoredImages });

  } catch (error: unknown) {
    console.error('Error in visual score route:', error);
    const msg = error instanceof Error ? error.message : 'Scoring failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
