import { createClient } from '@supabase/supabase-js';

// Mengambil kunci dari file .env (agar aman)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Membuat koneksi ke Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
