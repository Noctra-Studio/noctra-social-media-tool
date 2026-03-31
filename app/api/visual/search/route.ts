import { getUser } from '@/lib/auth/get-user';
import { NextResponse } from 'next/server';
import { createApi } from 'unsplash-js';

const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY || 'placeholder',
  fetch: fetch,
});

import { generateVisualQuery } from '@/lib/unsplash/generate-query';

export async function POST(req: Request) {
  try {
    let user;
    try {
      user = await getUser();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { keywords, platform, context, count } = await req.json();

    let query = '';
    
    // If we have a full context (caption, angle), prefer generating a smart query
    if (context && context.caption && context.angle) {
      query = generateVisualQuery(context.caption, context.angle, platform || 'instagram');
    } else if (keywords && Array.isArray(keywords)) {
      // If keywords are too long/literal, refine them
      const rawQuery = keywords.join(' ');
      if (rawQuery.split(' ').length > 4) {
        query = generateVisualQuery(rawQuery, 'editorial', platform || 'instagram');
      } else {
        query = rawQuery;
      }
    }

    if (!query) {
      return NextResponse.json({ error: 'Missing search context' }, { status: 400 });
    }
    const isX = platform === 'x';
    const numToFetch = count || (isX ? 6 : 12);
    const orientation = isX ? 'landscape' : undefined;

    const result = await unsplash.search.getPhotos({
      query,
      perPage: numToFetch,
      orientation: orientation as 'landscape' | 'portrait' | 'squarish' | undefined,
    });

    if (result.errors) {
      console.error('Unsplash error:', result.errors);
      return NextResponse.json({ error: result.errors[0] }, { status: 500 });
    }

    const photos = result.response.results.map((p) => ({
      id: p.id,
      url: p.urls.regular,
      thumb_url: p.urls.small,
      photographer: p.user.name,
      unsplash_link: p.links.html,
    }));

    return NextResponse.json({ photos });

  } catch (error: unknown) {
    console.error('Unhandled search error:', error);
    const msg = error instanceof Error ? error.message : 'Search failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
