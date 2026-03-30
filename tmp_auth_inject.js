const fs = require('fs');
const path = require('path');

const paths = [
  'app/api/content/angles/route.ts',
  'app/api/content/adapt/route.ts',
  'app/api/visual/search/route.ts',
  'app/api/visual/score/route.ts',
  'app/api/visual/generate/route.ts',
  'app/api/visual/overlay/route.ts',
  'app/api/calendar/month/route.ts',
  'app/api/calendar/schedule/route.ts',
  'app/api/calendar/unschedule/route.ts',
  'app/api/calendar/balance/route.ts',
  'app/api/calendar/check-repeat/route.ts'
];

for (const p of paths) {
  if (!fs.existsSync(p)) continue;
  let content = fs.readFileSync(p, 'utf-8');
  if (content.includes('getUser()')) continue;
  
  if (!content.includes("from '@/lib/auth/get-user'")) {
    content = "import { getUser } from '@/lib/auth/get-user';\n" + content;
  }
  
  const authSnippet = `
    let user;
    try {
      user = await getUser();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }`;

  // Use a targeted replacement
  content = content.replace(/(export async function \w+\([^)]+\) {\n\s*try {)/, "$1" + authSnippet);
  
  // Quick Supabase constraint injection - only if it has supabase calls
  content = content.replace(/\.from\('posts'\)/g, ".from('posts')");
  // Specifically inject eq user_id right after .select(...) or .update(...) or similar
  content = content.replace(/\.from\('posts'\)\.select\(([^)]*)\)/g, ".from('posts').select($1).eq('user_id', user.id)");
  content = content.replace(/\.from\('posts'\)\.update\(([^)]*)\)/g, ".from('posts').update($1).eq('user_id', user.id)");
  
  fs.writeFileSync(p, content);
}
console.log('Automated injection completed.');
