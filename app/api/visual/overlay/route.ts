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
    const { image_url, text, platform } = await req.json();

    if (!image_url) {
      return NextResponse.json({ error: 'Missing image_url' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }, { apiVersion: 'v1beta' });

    // Fetch image
    const fetchRes = await fetch(image_url);
    if (!fetchRes.ok) throw new Error('Failed to fetch image for overlay analysis');
    
    const arrayBuffer = await fetchRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    const mimeType = fetchRes.headers.get('content-type') || 'image/jpeg';

    const prompt = `Analyze this image and return ONLY JSON string:
{
  "placement": "top" | "center" | "bottom",
  "text_color": "#ffffff" | "#0A0A0A" | "#E8FF00",
  "bg_needed": boolean,
  "reason": "string"
}

Context: The overlay text is "${text || 'sample text'}", destined for ${platform}. Choose placement where subjects aren't blocked, and color that contrasts well. bg_needed true if image is too noisy.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType
        }
      }
    ]);

    let textResp = result.response.text();
    textResp = textResp.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(textResp);

    return NextResponse.json({
      placement: parsed.placement,
      text_color: parsed.text_color,
      bg_needed: parsed.bg_needed,
      image_url,
      suggested_text: text
    });

  } catch (error: unknown) {
    console.error('Error analyzing overlay:', error);
    const msg = error instanceof Error ? error.message : 'Overlay analysis failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
