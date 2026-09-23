// @vitest-environment node
/**
 * The two repos each hold their own copy of every module's `presentation.ts`, and the copies are
 * supposed to be the same drawing. They were verified identical across all 54 shared modules at
 * the time this was written — **every** difference was a module specifier being rewritten for the
 * native tree, including the inline `import('...')` type positions in cardiacElectro.
 *
 * That is a property worth holding onto rather than re-establishing by hand each time a diagram
 * is touched. A diagram edit now lands in two files, and nothing but discipline stopped the phone
 * and the web from drifting apart again — which is how they drifted the first time.
 *
 * What this catches: a redraw applied to one repo and not the other, in either direction.
 * What it does NOT catch: a genuine divergence expressed purely as a different import PATH, since
 * paths are exactly what gets normalised away. Symbol names survive normalisation, so importing a
 * different thing is still caught.
 *
 *   npx vitest run tools/presentation-sync
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const NATIVE = '/Users/natbailie/Developer/physiology-native/src/engine';
const WEB = new URL('../../src/modules', import.meta.url).pathname;

/** Every module specifier collapses to one placeholder, so `'@/shared/lib/math'` and `'../math'`
 *  compare equal while `clamp` versus `clampTo` still does not. Covers both `from '…'` and the
 *  inline `import('…')` type form. */
const normalise = (src: string) =>
  src
    .replace(/from\s+'[^']*'/g, "from '~'")
    .replace(/import\('[^']*'\)/g, "import('~')")
    .trimEnd();

const shared = readdirSync(WEB, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(`${WEB}/${d.name}/presentation.ts`))
  .map((d) => d.name)
  .filter((id) => existsSync(`${NATIVE}/${id}/presentation.ts`));

describe.skipIf(!existsSync(NATIVE))('presentation.ts stays in sync across the two repos', () => {
  it('finds modules to compare', () => {
    // A path typo silently comparing nothing would make every assertion below vacuously pass.
    expect(shared.length).toBeGreaterThan(40);
  });

  it.each(shared)('%s', (id) => {
    const web = normalise(readFileSync(`${WEB}/${id}/presentation.ts`, 'utf8'));
    const native = normalise(readFileSync(`${NATIVE}/${id}/presentation.ts`, 'utf8'));
    expect(native).toBe(web);
  });
});
