import { NextResponse } from 'next/server'
import { requireActiveWorkspaceRouteContext } from '@/lib/workspace/route'

const WORKSPACE_ASSETS_BUCKET = 'workspace-assets'
const MAX_LOGO_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/svg+xml',
  'image/webp',
])

function getFileExtension(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase()

  if (fromName) {
    return fromName
  }

  switch (file.type) {
    case 'image/png':
      return 'png'
    case 'image/svg+xml':
      return 'svg'
    case 'image/webp':
      return 'webp'
    default:
      return 'jpg'
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireActiveWorkspaceRouteContext()

    if ('response' in context) {
      return context.response
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Formato de logo no soportado.' }, { status: 400 })
    }

    if (file.size > MAX_LOGO_SIZE) {
      return NextResponse.json(
        { error: 'El logo debe pesar menos de 5 MB.' },
        { status: 400 }
      )
    }

    const { data: currentConfig, error: currentConfigError } = await context.admin
      .from('workspace_config')
      .select('logo_storage_path')
      .eq('workspace_id', context.workspaceId)
      .maybeSingle()

    if (currentConfigError) {
      throw currentConfigError
    }

    const extension = getFileExtension(file)
    const storagePath = `${context.workspaceId}/logo.${extension}`
    const buffer = await file.arrayBuffer()

    if (
      currentConfig?.logo_storage_path &&
      currentConfig.logo_storage_path !== storagePath
    ) {
      await context.admin.storage
        .from(WORKSPACE_ASSETS_BUCKET)
        .remove([currentConfig.logo_storage_path])
    }

    const { error: uploadError } = await context.admin.storage
      .from(WORKSPACE_ASSETS_BUCKET)
      .upload(storagePath, buffer, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      throw uploadError
    }

    const { data: signedUrlData, error: signedUrlError } = await context.admin.storage
      .from(WORKSPACE_ASSETS_BUCKET)
      .createSignedUrl(storagePath, 60 * 60 * 24 * 30)

    if (signedUrlError) {
      throw signedUrlError
    }

    const logoUrl = signedUrlData.signedUrl

    const { error: configError } = await context.admin.from('workspace_config').upsert(
      {
        logo_storage_path: storagePath,
        logo_url: logoUrl,
        workspace_id: context.workspaceId,
      },
      {
        onConflict: 'workspace_id',
      }
    )

    if (configError) {
      throw configError
    }

    return NextResponse.json({
      logo_url: logoUrl,
      storage_path: storagePath,
      success: true,
    })
  } catch (error) {
    console.error('Workspace logo upload failed', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'No fue posible subir el logo del workspace.',
      },
      { status: 500 }
    )
  }
}
