/**
 * The only place in `src/` that reads `import.meta.env`.
 *
 * Every other module gets its pieces of the environment from here, which is what lets the web
 * bundle and the React Native bundle share a body of code that must not know which bundler it
 * runs under. Vite and Metro agree on the two facts this file relies on — that environment
 * variables are inlined at build time into a plain module, and that `import.meta.env` is a
 * compile-time error under Hermes — but they read those variables through different globals:
 * Vite exposes `import.meta.env.VITE_*`, Metro exposes `process.env.EXPO_PUBLIC_*`.
 *
 * The native app therefore swaps this one module for `env.native.ts` (which reads the
 * `EXPO_PUBLIC_*` globals) and imports everything else unchanged. `src/shared/chat/secrets.test.ts`
 * enforces that no other file reaches for `import.meta.env`, so a boundary-crossing read is a
 * build failure rather than a silent runtime undefined.
 *
 * `supabaseUrl` and `supabaseAnonKey` are read once at module load, like every other static
 * configuration value. `isDev` is deliberately a FUNCTION read every call, not a constant: the
 * production gate in `ChatLauncher` and the dev-vs-edge-function route in `useChat` are both
 * tested by stubbing the environment per call, so a value captured at import time would freeze
 * the test runner into whichever branch it happened to boot in.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const revenueCatPublicKey = import.meta.env.VITE_REVENUECAT_PUBLIC_KEY;

export function isDev(): boolean {
  return import.meta.env.DEV;
}

export { supabaseUrl, supabaseAnonKey, revenueCatPublicKey };