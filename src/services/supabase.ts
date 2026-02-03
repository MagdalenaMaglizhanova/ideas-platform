import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wtfnbgqmtxwelvbjghab.supabase.co';
const supabaseAnonKey = 'sb_secret_Wfl95ljJFX0xRZHnsYxiiQ_WreNWkHy';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);