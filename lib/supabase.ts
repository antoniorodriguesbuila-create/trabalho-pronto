import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wgtenuxlebzqlkkphsbv.supabase.co';
const supabaseKey = 'sb_publishable_1rPTbanwTX7wVJ5lDp9nyw_nEdTasLC';

export const supabase = createClient(supabaseUrl, supabaseKey);
