import { createClient } from '@supabase/supabase-js';

// Mengambil variabel dengan awalan VITE_ (standar Vite)
// Kita tetap sertakan fallback process.env jika suatu saat nanti Anda pindah ke framework lain
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Pengecekan error di console browser
if (!supabaseUrl || supabaseUrl === "") {
  console.error("ERROR: URL Supabase tidak ditemukan di environment variables!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
