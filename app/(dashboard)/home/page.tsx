import { HomeFeedClient } from '@/components/home/home-feed-client'
import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const user = await getUser()
  const supabase = await createClient()
  const [{ data: profile }, { data: posts, error: postsError }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('posts')
      .select(
        'id, angle, content, created_at, export_metadata, format, image_url, platform, published_at, scheduled_at, status'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  if (postsError) {
    throw postsError
  }

  const preferredName =
    profile?.full_name?.trim() ||
    (user.user_metadata as { full_name?: string } | undefined)?.full_name?.trim() ||
    user.email?.split('@')[0] ||
    'Usuario'
  const firstName = preferredName.split(' ')[0] || preferredName

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      <HomeFeedClient firstName={firstName} posts={(posts as any[]) ?? []} />
    </div>
  )
}
