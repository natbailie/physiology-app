import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** False until .env.local carries real credentials — the app then behaves as local-only. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Null when unconfigured. Everything that touches it must tolerate that: the quiz works
 * without a network, and a learner who never signs in never notices this file exists.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null;
