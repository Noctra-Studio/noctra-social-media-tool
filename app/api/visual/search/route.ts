import { getUser } from '@/lib/auth/get-user';
import { NextResponse } from 'next/server';
import { createApi } from 'unsplash-js';
import { genAI } from '@/lib/gemini';
import { MOOD_CATEGORIES, generateSmartQuery } from '@/lib/unsplash/query-engine';

const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY || '',
  fetch: fetch,
});

export type UnifiedPhoto = {
  id: string;
  source: 'unsplash' | 'pexels';
  url: string;          // full resolution (large)
  thumbUrl: string;     // thumbnail for grid display
  previewUrl: string;   // medium size for canvas preview
  photographer: string;
  photographerUrl: string;
  sourceUrl: string;    // link back to original (required by both APIs)
  width: number;
  height: number;
  color: string;        // dominant color hex
  onBrandScore?: number; // added after Gemini scoring
};

// Pexels integration
async function searchPexels(
  query: string,
  options: { count: number; page: number; platform: string }
): Promise<UnifiedPhoto[]> {
  try {
    if (!process.env.PEXELS_API_KEY) return [];

    const orientation = options.platform === 'x' ? 'landscape' : 'square';
    
    const response = await fetch(
      `https://api.pexels.com/v1/search?` +
      `query=${encodeURIComponent(query)}` +
      `&per_page=${options.count}` +
      `&page=${options.page}` +
      `&orientation=${orientation}`,
      {
        headers: {
          'Authorization': process.env.PEXELS_API_KEY
        }
      }
    );

    if (!response.ok) return [];
    
    const data = await response.json();
    
    // Normalize Pexels response to UnifiedPhoto
    return (data.photos || []).map((photo: any) => ({
      id: `pexels_${photo.id}`,
      source: 'pexels',
      url: photo.src.original,
      thumbUrl: photo.src.tiny,
      previewUrl: photo.src.large,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      sourceUrl: photo.url,
      width: photo.width,
      height: photo.height,
      color: photo.avg_color,
    }));
  } catch (error) {
    console.error('Pexels search error:', error);
    return [];
  }
}

async function searchUnsplash(
  query: string,
  options: { count: number; page: number; platform: string }
): Promise<UnifiedPhoto[]> {
  try {
    const orientation = options.platform === 'x' ? 'landscape' : 'squarish';
    
    const result = await unsplash.search.getPhotos({
      query,
      page: options.page,
      perPage: options.count,
      orientation: orientation as any,
      contentFilter: 'high',
      orderBy: 'relevant'
    });

    if (result.errors) {
      console.error('Unsplash API Errors:', result.errors);
      return [];
    }

    if (!result.response) return [];

    return result.response.results.map((p: any) => ({
      id: p.id,
      source: 'unsplash',
      url: `${p.urls.regular}&w=1080&q=90`,
      thumbUrl: `${p.urls.small}&w=400&q=80`,
      previewUrl: p.urls.regular,
      photographer: p.user.name,
      photographerUrl: p.user.links.html,
      sourceUrl: p.links.html,
      width: p.width,
      height: p.height,
      color: p.color || '#000000',
    }));
  } catch (error) {
    console.error('Unsplash search error:', error);
    return [];
  }
}

function normalizeColorBucket(hex: string): string {
  // Convert hex to very rough groups for deduplication
  // We use a simplified HSL-like approach or just basic intensity/tint buckets
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  
  // Create 30-step buckets for each channel
  const rb = Math.floor(r / 30) * 30;
  const gb = Math.floor(g / 30) * 30;
  const bb = Math.floor(b / 30) * 30;
  
  return `rgb(${rb},${gb},${bb})`;
}

function mergeAndDeduplicate(
  unsplash: UnifiedPhoto[],
  pexels: UnifiedPhoto[]
): UnifiedPhoto[] {
  const all = [...unsplash, ...pexels];
  const seenColors = new Set<string>();
  const seenSizes = new Set<string>();
  
  return all.filter(photo => {
    const colorBucket = normalizeColorBucket(photo.color);
    const sizeBucket = `${Math.floor(photo.width / 500)}x${Math.floor(photo.height / 500)}`;
    const combinedKey = `${colorBucket}-${sizeBucket}`;

    if (seenColors.has(combinedKey)) return false;
    seenColors.add(combinedKey);
    return true;
  });
}

async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
  try {
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return {
      data: buffer.toString('base64'),
      mimeType: res.headers.get('content-type') || 'image/jpeg'
    };
  } catch (err) {
    console.error('Error fetching image for scoring:', url, err);
    throw err;
  }
}

export async function POST(req: Request) {
  try {
    let user;
    try {
      user = await getUser();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      keywords, 
      query: directQuery, 
      moodId, 
      platform = 'instagram', 
      count = 12, 
      page = 1,
      slideType = 'content',
      caption, // context for scoring
      isManualSearch = false
    } = body;

    let finalQuery = '';
    if (directQuery) {
      if (isManualSearch) {
        // Expand manual search with visual quality keywords
        const visualModifiers = ['minimal', 'professional', 'dark aesthetic', 'high quality', 'clean'];
        const modifier = visualModifiers[Math.floor(Math.random() * visualModifiers.length)];
        finalQuery = `${directQuery} ${modifier}`;
      } else {
        finalQuery = directQuery;
      }
    } else if (keywords && Array.isArray(keywords) && keywords.length > 0) {
      // If keywords provided, we use the smart engine to get a better visual query
      const { query } = generateSmartQuery(keywords.join(' '), 'editorial', platform, slideType);
      finalQuery = query;
    } else if (moodId) {
      const mood = MOOD_CATEGORIES.find(m => m.id === moodId);
      if (mood) {
        const queryIndex = (page - 1) % mood.queries.length;
        finalQuery = mood.queries[queryIndex];
      }
    }

    if (!finalQuery) {
      finalQuery = 'dark minimal professional workspace';
    }

    // STEP 1: Search both simultaneously
    const [unsplashResults, pexelsResults] = await Promise.allSettled([
      searchUnsplash(finalQuery, { count, page, platform }),
      searchPexels(finalQuery, { count, page, platform })
    ]);

    const uRes = unsplashResults.status === 'fulfilled' ? unsplashResults.value : [];
    const pRes = pexelsResults.status === 'fulfilled' ? pexelsResults.value : [];

    // STEP 2: Merge and Deduplicate
    let photos = mergeAndDeduplicate(uRes, pRes);

    // STEP 3: Gemini Scoring (if context provided)
    // We score the top 8 results to balance speed and quality
    const scoringContext = caption || directQuery || finalQuery;
    if (scoringContext && photos.length > 0) {
      const photosToScore = photos.slice(0, 3);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const scoredBatch: any[] = [];
      let quotaExhausted = false;

      for (const photo of photosToScore) {
        if (quotaExhausted) {
          scoredBatch.push({ ...photo, onBrandScore: 0.5 });
          continue;
        }

        try {
          const { data, mimeType } = await fetchImageAsBase64(photo.thumbUrl);
          const prompt = `You are a professional art director for a B2B digital agency in Mexico creating social media carousels.

Score this image (0.0-1.0) for use as a slide background for this specific content: "${scoringContext}"

Criteria:
- Dark, professional aesthetic (prefer dark backgrounds): +0.3
- Abstract, minimal, or architectural: +0.2
- Relevant to the topic without being literal: +0.2
- Text legibility when overlaid: +0.2
- Avoid: stock photo clichés, generic AI imagery, bright colors: -0.3
- Avoid: people's faces unless the post is about people: -0.2

For topic "${scoringContext}":
- If about technology/AI/SEO: prefer abstract tech, code, dark gradients
- If about real estate: prefer architecture, spaces, urban
- If about business: prefer minimal workspaces, not handshakes

Respond ONLY: { "score": float }`;

          const result = await model.generateContent([
            { inlineData: { data, mimeType } },
            { text: prompt }
          ]);

          const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
          const startIdx = responseText.indexOf('{');
          const endIdx = responseText.lastIndexOf('}');
          
          if (startIdx === -1) throw new Error('Invalid JSON');
          
          const parsed = JSON.parse(responseText.slice(startIdx, endIdx + 1));
          scoredBatch.push({ ...photo, onBrandScore: Number(parsed.score) });
          
          await new Promise(res => setTimeout(res, 1800));
        } catch (err: any) {
          if (err?.status === 429) {
            quotaExhausted = true;
            console.warn('Gemini Search Scoring 429: Bailing.');
          }
          scoredBatch.push({ ...photo, onBrandScore: 0.5 });
        }
        
        if (!quotaExhausted) {
          await new Promise(res => setTimeout(res, 1800));
        }
      }
      
      const remaining = photos.slice(3).map(p => ({ ...p, onBrandScore: 0.5 }));
      photos = [...scoredBatch, ...remaining];
    }

    return NextResponse.json({ 
      photos,
      total: (uRes.length + pRes.length) * 5, // Approximate total across sources
      page: page,
      query_used: finalQuery
    });

  } catch (error: unknown) {
    console.error('Unhandled search error:', error);
    const msg = error instanceof Error ? error.message : 'Search failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
