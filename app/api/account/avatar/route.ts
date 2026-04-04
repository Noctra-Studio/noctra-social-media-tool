import { NextResponse } from 'next/server'
import { requireRouteUser } from '@/lib/auth/require-route-user'
import { createClient } from '@/lib/supabase/server'

const AVATAR_BUCKET = 'avatars'
const MAX_AVATAR_SIZE = 2 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'image/avif',
  'image/jpeg',
  'image/png',
  'image/webp',
])

function getFileExtension(file: File) {
  const extensionFromName = file.name.split('.').pop()?.toLowerCase()

  if (extensionFromName) {
    return extensionFromName
  }

  switch (file.type) {
    case 'image/png':
      return 'png'
    case 'image/jpeg':
      return 'jpg'
    case 'image/webp':
      return 'webp'
    case 'image/avif':
      return 'avif'
    default:
      return 'bin'
  }
}

export async function POST(request: Request) {
  try {
    const { response, user } = await requireRouteUser()

    if (response) {
      return response
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No se recibió ninguna imagen.' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Formato de imagen no soportado.' }, { status: 400 })
    }

    if (file.size > MAX_AVATAR_SIZE) {
      return NextResponse.json({ error: 'La imagen debe pesar menos de 2 MB.' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const filePath = `${user.id}/avatar-${Date.now()}.${getFileExtension(file)}`

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, arrayBuffer, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      throw uploadError
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath)

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'No fue posible subir el avatar.',
      },
      { status: 500 }
    )
  }
}
