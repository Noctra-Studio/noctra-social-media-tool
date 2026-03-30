import { IdeasBacklogView, type IdeaListItem } from '@/components/ideas/IdeasBacklogView'
import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'

type IdeasPageProps = {
  searchParams?: Promise<{ filter?: string }>
}

const filters = ['all', 'raw', 'drafted', 'published'] as const

export default async function IdeasPage({ searchParams }: IdeasPageProps) {
  const params = (await searchParams) || {}
  const initialFilter = filters.find((item) => item === params.filter) ?? 'all'
  const user = await getUser()
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_ideas')
    .select('id, raw_idea, platform, created_at, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      <IdeasBacklogView initialFilter={initialFilter} ideas={(data || []) as IdeaListItem[]} />
    </div>
  )
}
