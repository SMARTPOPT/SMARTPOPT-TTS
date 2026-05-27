import { createClient } from '@supabase/supabase-js';

// Mengambil variabel dari environment Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validasi ketat: Jika variabel tidak ada, lempar error agar aplikasi tidak berjalan dalam kondisi "rusak"
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Variabel VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY belum didefinisikan di environment!");
}

// Inisialisasi client
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
