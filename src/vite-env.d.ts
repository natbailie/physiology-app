/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /**
   * RevenueCat's Web Billing key. Publishable, like the Supabase anon key — it identifies the
   * project and grants nothing on its own. The SECRET key (`sk_…`) and the webhook secret are
   * server-only and `src/shared/chat/secrets.test.ts` fails the build if either reaches `src/`.
   */
  readonly VITE_REVENUECAT_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
