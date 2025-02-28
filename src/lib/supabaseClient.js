import { createClient } from '@supabase/supabase-js';

// Default values or fallbacks in case env variables aren't loaded
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://efazuvegwxouysfcgwja.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmYXp1dmVnd3hvdXlzZmNnd2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5Mjk1MjcsImV4cCI6MjA1MTUwNTUyN30.1G5n0CyQEHGeE1XaJld_PbpstUFd0Imaao6N8MUmfvE';

// Add validation to prevent URL construction errors
if (!supabaseUrl || !supabaseUrl.startsWith('https://')) {
  console.error('Invalid Supabase URL:', supabaseUrl);
}

if (!supabaseAnonKey) {
  console.error('Missing Supabase Anon Key');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
