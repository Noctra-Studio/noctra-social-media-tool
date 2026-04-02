import { getUser } from '@/lib/auth/get-user';
import { NextResponse } from 'next/server';
import { processImageForSlide, moodToStyle, type ProcessingStyle } from '@/lib/images/processor';

// Simple in-memory cache (LRU-like with 50 items)
const cache = new Map<string, any>();

function getCacheKey(url: string, style: string, w: number, h: number): string {
  // Use a simple string key; for a more robust solution use a hash function
  return `${url}_${style}_${w}_${h}`;
}

export async function POST(req: Request) {
  try {
    try {
      await getUser();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrl, slideType, mood, style: overrideStyle } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
    }

    const targetWidth = 1080;
    const targetHeight = 1080;
    const style: ProcessingStyle = overrideStyle || moodToStyle(mood);
    
    const cacheKey = getCacheKey(imageUrl, style, targetWidth, targetHeight);
    
    if (cache.has(cacheKey)) {
      return NextResponse.json(cache.get(cacheKey));
    }

    const processed = await processImageForSlide(imageUrl, {
      slideType,
      mood,
      targetWidth,
      targetHeight,
      style,
    });

    const result = {
      dataUrl: processed.dataUrl,
      dominantColor: processed.dominantColor,
      palette: processed.palette,
      focalPoint: processed.focalPoint,
      processingApplied: processed.processingApplied,
    };

    // Keep cache at 50 items
    if (cache.size >= 50) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    cache.set(cacheKey, result);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error in processing route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
