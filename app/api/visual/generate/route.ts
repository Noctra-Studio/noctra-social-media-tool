import { getUser } from '@/lib/auth/get-user';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    let user;
    try {
      user = await getUser();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { prompt, platform, style } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    const enhancedPrompt = `Minimal, dark background, editorial style, tech brand aesthetic — ${prompt} ${style ? `(${style})` : ''}`;

    // Note: The public @google/generative-ai SDK currently emphasizes text/multimodal text-generation.
    // For Imagen 3 via API keys, many use the REST endpoint directly because the JS SDK is optimized for text completion.
    // We will do a generic REST call for Imagen 3 generation here to guarantee it works.
    
    // As of current docs, the correct endpoint for Imagen is:
    // POST https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict
    
    // Ratios based on platform:
    let aspectRatio = "1:1";
    if (platform === 'linkedin') aspectRatio = "16:9";
    if (platform === 'x') aspectRatio = "16:9";

    const API_KEY = process.env.GEMINI_API_KEY;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt: enhancedPrompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: aspectRatio
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Imagen API Error:', errText);
      throw new Error('Failed to generate image via Imagen');
    }

    const data = await response.json();
    const base64Image = data.predictions?.[0]?.bytesBase64Encoded;
    
    if (!base64Image) {
      throw new Error('No image returned from generation');
    }

    // Return the image as a data URL so the client can display/save it
    const imageUrl = `data:image/png;base64,${base64Image}`;

    return NextResponse.json({
      image_url: imageUrl,
      revised_prompt: enhancedPrompt
    });

  } catch (error: unknown) {
    console.error('Error generating image:', error);
    const msg = error instanceof Error ? error.message : 'Generation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
