import { createClient } from '@supabase/supabase-js';

let rawUrl =
  import.meta.env?.VITE_SUPABASE_URL ||
  import.meta.env?.NEXT_PUBLIC_SUPABASE_URL ||
  '';

const supabaseAnonKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

// Auto-sanitize URL to remove trailing /rest/v1 or trailing slashes
const supabaseUrl = rawUrl
  ? rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
  : '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
