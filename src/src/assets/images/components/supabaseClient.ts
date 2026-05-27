import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERROR: Supabase URL atau Anon Key tidak ditemukan!");
}

// Mengekspor dengan nama 'supabase' agar seragam dengan pola OptInformation
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
