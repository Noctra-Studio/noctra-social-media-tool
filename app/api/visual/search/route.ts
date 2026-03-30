import { getUser } from '@/lib/auth/get-user';
import { NextResponse } from 'next/server';
import { createApi } from 'unsplash-js';

const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY || 'placeholder',
  fetch: fetch,
});

export async function POST(req: Request) {
  try {
    let user;
    try {
      user = await getUser();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { keywords, platform, count } = await req.json();

    if (!keywords || !Array.isArray(keywords)) {
      return NextResponse.json({ error: 'Missing keywords array' }, { status: 400 });
    }

    const query = keywords.join(' ');
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
