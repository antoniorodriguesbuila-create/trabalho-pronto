import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rhuebedcogmayolsnduq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_TG0uS_FQEM4WeMtmh-CNuA_J2-fQgqg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
