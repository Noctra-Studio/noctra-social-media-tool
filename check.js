const fs = require('fs')

const envStr = fs.readFileSync('.env.local', 'utf8')
const getEnv = (key) => {
  const match = envStr.match(new RegExp(`${key}="(.*?)"`))
  return match ? match[1] : ''
}

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')

async function doFetch(path, params = '') {
  const res = await fetch(`${supabaseUrl}/rest/v1/${path}?${params}`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Accept': 'application/json'
    }
  })
  return res.json()
}

async function check() {
  const users = await doFetch('profiles', 'email=eq.hello@noctra.studio&select=*')
  console.log('Profiles:', users)
  
  if (users.length > 0) {
    const id = users[0].id
    const members = await doFetch('workspace_members', `user_id=eq.${id}&select=*,workspaces(*)`)
    console.log('Memberships:', JSON.stringify(members, null, 2))
    
    // Si hay uno llamado "Workspace Demo Switch", lo borramos?
  }
}

check()
