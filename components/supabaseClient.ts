import { createClient } from '@supabase/supabase-js';

// Mengambil variabel dari environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Validasi jika variabel kosong
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERROR: Supabase URL atau Anon Key tidak ditemukan di environment!");
}

// Inisialisasi client
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
