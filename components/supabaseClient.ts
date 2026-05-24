import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// TAMBAHKAN INI untuk melihat ke dalam sistem
console.log("DEBUG - VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("DEBUG - VITE_SUPABASE_ANON_KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY);

if (!supabaseUrl) {
  console.error("ERROR: URL Supabase kosong di environment!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
