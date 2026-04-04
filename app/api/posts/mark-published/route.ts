import { NextResponse } from 'next/server'
import { z } from 'zod'
import { extractPostId } from '@/lib/social/urls'
import { isSocialMetricPlatform } from '@/lib/social/platforms'
import { requireActiveWorkspaceRouteContext } from '@/lib/workspace/route'

const markPublishedSchema = z.object({
  external_post_id: z.string().trim().optional(),
  post_id: z.string().uuid(),
  post_url: z.string().trim().optional(),
  published_at: z.string().datetime().optional(),
})

export async function POST(request: Request) {
  try {
    const workspaceContext = await requireActiveWorkspaceRouteContext()

    if ('response' in workspaceContext) {
      return workspaceContext.response
    }

    const parsed = markPublishedSchema.safeParse(await request.json())

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid mark-published payload.', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { data: post, error: postError } = await workspaceContext.admin
      .from('posts')
      .select('id, platform, external_post_id')
      .eq('workspace_id', workspaceContext.workspaceId)
      .eq('id', parsed.data.post_id)
      .maybeSingle()

    if (postError) {
      throw postError
    }

    if (!post) {
      return NextResponse.json({ error: 'Post no encontrado.' }, { status: 404 })
    }

    if (!isSocialMetricPlatform(post.platform)) {
      return NextResponse.json({ error: 'Esta plataforma no soporta métricas todavía.' }, { status: 400 })
    }

    const parsedUrlId = parsed.data.post_url
      ? extractPostId(post.platform, parsed.data.post_url)
      : null
    const explicitId = parsed.data.external_post_id?.trim() || null
    const resolvedExternalId = explicitId || parsedUrlId || post.external_post_id || null
    const publishedAt = parsed.data.published_at || new Date().toISOString()

    const { data: updatedPost, error: updateError } = await workspaceContext.admin
      .from('posts')
      .update({
        external_post_id: resolvedExternalId,
        published_at: publishedAt,
        status: 'published',
      })
      .eq('id', parsed.data.post_id)
      .eq('workspace_id', workspaceContext.workspaceId)
      .select('id, platform, external_post_id, published_at, status')
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      post: updatedPost,
      warning: resolvedExternalId
        ? null
        : 'El post se marcó como publicado, pero todavía no tiene un ID/URL externa para sincronizar métricas.',
    })
  } catch (error) {
    console.error('Mark published failed', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'No fue posible marcar el post como publicado.',
      },
      { status: 500 }
    )
  }
}
