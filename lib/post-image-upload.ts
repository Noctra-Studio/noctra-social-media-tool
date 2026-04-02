import { createClient } from '@/lib/supabase/client'

export const POST_IMAGES_BUCKET = 'post-images'

function sanitizeFilename(filename: string) {
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

export async function uploadPostImage(params: {
  file: File
  postId: string
  userId: string
}) {
  const { file, postId, userId } = params

  if (!file.type.startsWith('image/')) {
    throw new Error('Selecciona un archivo de imagen válido.')
  }

  const safeName = sanitizeFilename(file.name || 'image')
  const filePath = `${userId}/${postId}/${Date.now()}-${safeName}`
  const supabase = createClient()
  const { error: uploadError } = await supabase.storage
    .from(POST_IMAGES_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    throw uploadError
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(POST_IMAGES_BUCKET).getPublicUrl(filePath)

  return {
    path: filePath,
    url: publicUrl,
  }
}
