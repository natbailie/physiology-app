import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The one rule that cannot be enforced by review alone.
 *
 * Vite compiles every `VITE_`-prefixed variable into the bundle a learner downloads. A model API
 * key that reaches `import.meta.env` is therefore published to everyone who loads the page, and
 * the mistake is invisible until somebody reads the built JavaScript. Billing has the same hazard
 * twice over: a `TEST_ACCESS_CODE` used to sit in `src/billing/config.ts` and was readable by
 * anyone who opened devtools, and RevenueCat ships a public key and a secret one that differ by a
 * prefix.
 *
 * The tutor's key is deliberately named without the prefix so Vite refuses to expose it — it is
 * read by the dev server in `vite.config.ts` and by the edge function from `Deno.env`, both of
 * which are outside `src/`. This asserts nothing under `src/` ever reaches for it, which turns
 * that convention into a guarantee.
 */

const SOURCE = import.meta.glob<string>('../../**/*.{ts,tsx}', { eager: true, query: '?raw', import: 'default' });

/** Secret names that must never appear in client source, however they are referenced. */
const SERVER_ONLY = [
  'GEMINI_API_KEY',
  'ANTHROPIC_API_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  // RevenueCat's secret API key and the webhook's shared secret. The WEB BILLING key is a
  // different thing and is legitimately public — see VITE_REVENUECAT_PUBLIC_KEY in vite-env.d.ts.
  'REVENUECAT_SECRET_API_KEY',
  'REVENUECAT_WEBHOOK_SECRET',
  // Stripe invoicing. Both are edge-function secrets read by supabase/functions/stripe-webhook/;
  // neither has any business in the browser, because nothing client-side talks to Stripe at all.
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
];

describe('client source', () => {
  it.each(SERVER_ONLY)('never reaches for %s', (secret) => {
    const offenders = Object.entries(SOURCE)
      .filter(([file]) => !file.endsWith('secrets.test.ts'))
      .filter(([, contents]) => contents.includes(secret))
      .map(([file]) => file);

    expect(offenders, `${secret} is server-only and must not appear in src/`).toEqual([]);
  });

  it('reaches for import.meta.env only in src/lib/env.ts', () => {
    // The env seam (see src/lib/env.ts) is the one place `src/` is allowed to talk to the
    // bundler's environment, so the React Native app can swap in env.native.ts reading the
    // EXPO_PUBLIC_* globals instead. A read anywhere else is a boundary-crossing that would
    // bundle a VITE_-only value into the native build as an undefined constant — compiled in,
    // never errored on. Allowing it here and nowhere else is the guarantee that the web file
    // stays the single decision point, and it is what makes the seam harder to cross than not.
    const asideFromSeam = Object.entries(SOURCE)
      .filter(([file]) => file !== '../../lib/env.ts' && !file.endsWith('secrets.test.ts'))
      .filter(([, contents]) => contents.includes('import.meta.env'))
      .map(([file]) => file);

    expect(asideFromSeam, `import.meta.env outside the env seam:\n${asideFromSeam.join('\n')}`).toEqual([]);

    const seam = SOURCE['../../lib/env.ts'];
    expect(seam, 'src/lib/env.ts must exist for the env seam').toBeDefined();
    expect(seam!.includes('import.meta.env')).toBe(true);
  });

  it('reads only VITE_-prefixed variables from import.meta.env', () => {
    // Anything else read this way is either undefined at runtime or, worse, a secret someone has
    // just prefixed to make it work.
    const env = SOURCE['../../lib/env.ts'];
    expect(env, 'src/lib/env.ts must exist for the env seam').toBeDefined();
    const reads = [...env!.matchAll(/import\.meta\.env\.([A-Z][A-Z0-9_]*)/g)].map((match) => match[1]!);

    // `DEV`, `PROD`, `MODE`, `SSR`, `BASE_URL` are Vite's own and are not secrets.
    const builtIn = new Set(['DEV', 'PROD', 'MODE', 'SSR', 'BASE_URL']);
    const suspect = reads.filter((name) => !name.startsWith('VITE_') && !builtIn.has(name));

    expect(suspect).toEqual([]);
  });
});

describe('RevenueCat keys', () => {
  it('never carries a secret key literal, whatever it is called', () => {
    // The two kinds are told apart by prefix: `sk_` is the secret API key, and a Web Billing
    // public key is not. Naming the variable something innocuous would walk past the list above,
    // so the value's own shape is checked too.
    const offenders = Object.entries(SOURCE)
      .filter(([file]) => !file.endsWith('secrets.test.ts'))
      .filter(([, contents]) => /['"`]sk_[A-Za-z0-9]/.test(contents))
      .map(([file]) => file);

    expect(offenders, 'a RevenueCat secret key must never reach the bundle').toEqual([]);
  });
});

describe('the dev tutor route', () => {
  it('reads its key outside the bundle, and never through import.meta.env', () => {
    // vite.config.ts runs in Node. If this ever became an `import.meta.env` read, the key would
    // be inlined into the client build instead of staying in the dev-server process.
    const config = readFileSync(path.resolve(import.meta.dirname, '../../../vite.config.ts'), 'utf8');

    expect(config).toContain('loadEnv');
    expect(config).not.toContain('import.meta.env.GEMINI_API_KEY');
    expect(config).not.toContain('VITE_GEMINI');
  });
});
