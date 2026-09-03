import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseAnonKey, supabaseUrl } from './env';
import { supabaseOptions } from './supabaseOptions';

/** False until .env.local carries real credentials — the app then behaves as local-only. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Null when unconfigured. Everything that touches it must tolerate that: the quiz works
 * without a network, and a learner who never signs in never notices this file exists.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, supabaseOptions)
  : null;
