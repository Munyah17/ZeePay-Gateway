import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

// Admin client with service role key (for server-side operations)
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Client with anon key (for client-side operations)
export const supabaseClient = createClient(
  config.supabase.url,
  config.supabase.anonKey
);
