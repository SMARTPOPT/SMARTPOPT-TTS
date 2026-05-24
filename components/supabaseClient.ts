import { createClient } from '@supabase/supabase-js';

// Mengambil URL dan Key, dengan fallback untuk Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Pengecekan agar kita tahu jika kuncinya kosong saat di server
if (!supabaseUrl) {
  console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL tidak ditemukan!");
}
if (!supabaseAnonKey) {
  console.error("ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY tidak ditemukan!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
