/**
 * The client options that differ per platform, kept apart so `supabase.ts` itself can be shared.
 *
 * The browser has somewhere to persist a session already, and it is the only place a session can
 * arrive in a URL fragment — so on the web this is empty and supabase-js keeps its defaults.
 * React Native has neither: it has no `localStorage` for the session and no URL to detect one in,
 * so the native app replaces this module with one that supplies AsyncStorage and turns URL
 * detection off. Same seam as `env.ts`, for the same reason.
 */
import type { SupabaseClientOptions } from '@supabase/supabase-js';

export const supabaseOptions: SupabaseClientOptions<'public'> = {};
