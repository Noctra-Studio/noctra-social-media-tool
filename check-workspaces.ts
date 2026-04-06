import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'

const envStr = fs.readFileSync('.env.local', 'utf8')
const getEnv = (key: string): string => {
  const match = envStr.match(new RegExp(`${key}="(.*?)"`))
  return match ? match[1] : ''
}

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data: user } = await supabase.from('profiles').select('id, email, current_workspace_id').eq('email', 'hello@noctra.studio').single()
  console.log('User profile:', user)
  if (!user) {
    console.log('User not found in profiles')
    return
  }

  const { data: members } = await supabase.from('workspace_members').select('workspace_id, workspaces(name, id)').eq('user_id', user.id)
  console.log('Workspaces:', JSON.stringify(members, null, 2))
}

check().catch(console.error)
