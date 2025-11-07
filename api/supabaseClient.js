import { createClient } from '@supabase/supabase-js';

// It's safe to use the ANON_KEY here because of Supabase's Row Level Security.
// The backend will enforce all security rules.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be provided in environment variables.');
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};
