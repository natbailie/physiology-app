import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../../..');
const read = (file: string): string => readFileSync(path.join(ROOT, file), 'utf8');

/**
 * `vercel.json` allows the theme script in index.html by hash, so editing that script without
 * updating the header would make a browser refuse it and flash the wrong theme. This fails first.
 * The header is report-only for now: a violation shows in the console instead of breaking a page.
 */
describe('deploy config', () => {
  it('allows the inline theme script by its current hash', () => {
    const script = /<script>([\s\S]*?)<\/script>/.exec(read('index.html'))?.[1];
    expect(script).toBeDefined();
    const hash = createHash('sha256').update(script ?? '').digest('base64');
    expect(read('vercel.json')).toContain(`'sha256-${hash}'`);
  });

  it('sets the baseline security headers', () => {
    const config = JSON.parse(read('vercel.json')) as {
      headers: { headers: { key: string }[] }[];
    };
    const keys = config.headers.flatMap((rule) => rule.headers.map((header) => header.key));
    for (const key of [
      'Strict-Transport-Security',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Referrer-Policy',
      'Permissions-Policy',
      'Content-Security-Policy-Report-Only',
    ]) {
      expect(keys).toContain(key);
    }
  });

  it('does not ship source maps', () => {
    expect(read('vite.config.ts')).toContain('sourcemap: false');
  });
});
