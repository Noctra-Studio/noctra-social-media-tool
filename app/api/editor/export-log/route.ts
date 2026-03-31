import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/get-user'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const postId = searchParams.get('postId')

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
    }

    const user = await getUser()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('exports')
      .select('exported_at')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .order('exported_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      count: data.length,
      lastExport: data[0]?.exported_at || null
    })
  } catch (error) {
    console.error('Fetch export log error:', error)
    return NextResponse.json({ error: 'Failed to fetch export log' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser()
    const body = await req.json()
    const { postId, platform, format } = body

    if (!postId || !platform || !format) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('exports')
      .insert([
        {
          user_id: user.id,
          post_id: postId,
          platform,
          format,
          exported_at: new Date().toISOString()
        }
      ])

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Export log error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to log export' },
      { status: 500 }
    )
  }
}
