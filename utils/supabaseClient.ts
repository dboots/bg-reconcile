import { createClient } from '@supabase/supabase-js';

// the URL and anon/public key should be exposed as NEXT_PUBLIC_* so they
// are available in the browser.  keep the real url/keys in a local .env file
// and never check them in.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are not configured');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
