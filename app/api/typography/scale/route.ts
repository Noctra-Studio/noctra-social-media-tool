import { getUser } from '@/lib/auth/get-user';
import { NextResponse } from 'next/server';
import { recommendTypeScale } from '@/lib/typography/type-scale';

export async function POST(req: Request) {
  try {
    try {
      await getUser();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slideType, headlineText, bodyText, hasStat } = await req.json();

    const scale = recommendTypeScale(
      slideType,
      (headlineText || '').length,
      !!bodyText,
      !!hasStat
    );

    return NextResponse.json(scale);
  } catch (error: any) {
    console.error('Error in type-scale route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
