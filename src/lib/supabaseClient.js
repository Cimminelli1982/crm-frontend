import { createClient } from '@supabase/supabase-js';

// Hardcode values directly to bypass environment variable issues
const supabaseUrl = 'https://efazuvegwxouysfcgwja.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmYXp1dmVnd3hvdXlzZmNnd2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5Mjk1MjcsImV4cCI6MjA1MTUwNTUyN30.1G5n0CyQEHGeE1XaJld_PbpstUFd0Imaao6N8MUmfvE'; // Replace with your actual anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
