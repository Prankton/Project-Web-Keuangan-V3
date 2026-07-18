// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Tambahkan tanda seru (!) di akhir process.env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);