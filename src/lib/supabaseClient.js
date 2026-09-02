/**
 * supabaseClient.js
 * Single Supabase client instance for the entire Swasthya Setu app.
 * All database access goes through this client.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pzaqzwmpynlqxsclbesj.supabase.co';
// Supabase renamed "anon" → "publishable" key in their dashboard (same key, new label)
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
                 || import.meta.env.VITE_SUPABASE_ANON_KEY
                 || 'sb_publishable_aQTTcFxLfGPTzEphAE6DWQ_BqHlnDVU';

const _missing = !supabaseUrl || supabaseUrl.includes('YOUR_PROJECT_ID')
              || !supabaseKey || supabaseKey.includes('YOUR_');

if (_missing) {
  console.warn(
    '[Swasthya Setu] Supabase credentials missing.\n' +
    'Open .env.local and fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.\n' +
    'The app will continue using localStorage as a fallback.'
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

/** True only when real Supabase credentials are present */
export const isSupabaseConfigured = () => !_missing;

