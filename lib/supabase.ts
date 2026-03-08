import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wgtenuxlebzqlkkphsbv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_1rPTbanwTX7wVJ5lDp9nyw_nEdTasLC';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
