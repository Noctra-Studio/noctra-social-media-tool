import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/get-user'
import { supabase } from '@/lib/supabase'

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

async function ensureAvatarBucket() {
  const { data: buckets, error } = await supabase.storage.listBuckets()

  if (error) {
    throw error
  }

  const exists = buckets?.some((bucket) => bucket.name === AVATAR_BUCKET)

  if (exists) {
    return
  }

  const { error: createError } = await supabase.storage.createBucket(AVATAR_BUCKET, {
    allowedMimeTypes: [...ALLOWED_TYPES],
    fileSizeLimit: `${MAX_AVATAR_SIZE}`,
    public: true,
  })

  if (createError && !createError.message.toLowerCase().includes('already exists')) {
    throw createError
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser()
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

    await ensureAvatarBucket()

    const arrayBuffer = await file.arrayBuffer()
    const filePath = `${user.id}/avatar-${Date.now()}.${getFileExtension(file)}`

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, arrayBuffer, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: true,
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
