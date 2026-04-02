import { getUser } from '@/lib/auth/get-user';
import { NextResponse } from 'next/server';
import { processImageForSlide, ImageProcessingOptions } from '@/lib/images/processor';

async function handleRequest(
  params: { 
    imageUrl?: string; 
    slideType?: string; 
    mood?: string; 
    width?: number; 
    height?: number; 
  }
) {
  const { imageUrl, slideType, mood, width = 1080, height = 1080 } = params;

  if (!imageUrl) {
    return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
  }

  // 1. Fetch original image
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error('Failed to fetch original image');
  }

  const arrayBuffer = await imageResponse.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  // 2. Process with Sharp
  const processed = await processImageForSlide(inputBuffer, {
    slideType: slideType as any,
    mood: mood as string,
    targetWidth: width,
    targetHeight: height,
  });
 
  // 3. Return as binary image
  return new Response(new Uint8Array(processed.data), {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=86400, s-maxage=31536000',
    },
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const params = {
      imageUrl: searchParams.get('imageUrl') || undefined,
      slideType: searchParams.get('slideType') || undefined,
      mood: searchParams.get('mood') || undefined,
      width: searchParams.get('width') ? Number(searchParams.get('width')) : undefined,
      height: searchParams.get('height') ? Number(searchParams.get('height')) : undefined,
    };

    return await handleRequest(params);
  } catch (error: unknown) {
    console.error('Image processing GET error:', error);
    const msg = error instanceof Error ? error.message : 'Processing failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Auth check
    try {
      await getUser();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    return await handleRequest(body);
  } catch (error: unknown) {
    console.error('Image processing POST error:', error);
    const msg = error instanceof Error ? error.message : 'Processing failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
