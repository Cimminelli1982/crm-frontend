import { createClient } from '@supabase/supabase-js';

// Default values or fallbacks in case env variables aren't loaded
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://efazuvegwxouysfcgwja.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-default-anon-key-here';

// Add validation to prevent URL construction errors
if (!supabaseUrl || !supabaseUrl.startsWith('https://')) {
  console.error('Invalid Supabase URL:', supabaseUrl);
}

if (!supabaseAnonKey) {
  console.error('Missing Supabase Anon Key');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
