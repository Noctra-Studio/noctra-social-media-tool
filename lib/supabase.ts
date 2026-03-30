import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

// We use the service role key for the server-side operations if available
// If this were a real full-stack app with auth, we'd use the App Router SSR client.
// Here we are building internal tools with server-side API generation.
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
