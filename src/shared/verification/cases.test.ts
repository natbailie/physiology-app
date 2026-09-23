import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { MODULES } from '@/home/moduleRegistry';
import { VALID_ROUTES } from '@/shared/hooks/useHashRoute';
import { caseModules, MODULE_IDS } from '@/modules/manifest.generated';

/**
 * Repo-wide promises about patient cases, the way `references.test.ts` makes them about bands.
 *
 * A per-module `cases.test.ts` checks one module's beds against one module's engine. Nothing in
 * that arrangement notices a NINTH case file added with no test beside it, a case id that
 * collides with one in another module (they share a URL namespace), or the quiet one — a
 * `cases.ts` that grows a value import and drags a physiology engine into the home page.
 *
 * All three fail silently in the running app. That is what this file is for.
 */

const modulesDir = fileURLToPath(new URL('../../modules/', import.meta.url));

const caseSources = Object.keys(caseModules).map((id) => ({
  id,
  source: readFileSync(`${modulesDir}${id}/cases.ts`, 'utf8'),
  files: readdirSync(`${modulesDir}${id}`),
}));

const caseFileModules = import.meta.glob<Record<string, unknown>>('../../modules/*/cases.ts', { eager: true });
const moduleIdOf = (path: string): string => path.match(/modules\/([^/]+)\//)![1]!;

interface AnyCase {
  id: string;
  name: string;
  age: number;
  preset: string;
}

function casesIn(exports: Record<string, unknown>): AnyCase[] {
  const found = Object.values(exports).find(
    (value): value is AnyCase[] =>
      Array.isArray(value) &&
      value.length > 0 &&
      value.every((entry) => typeof (entry as AnyCase)?.id === 'string'),
  );
  return found ?? [];
}

describe('patient cases, repo-wide', () => {
  it('found the case files at all', () => {
    // Guards the guard: if discovery silently returned nothing, every assertion below would
    // pass vacuously — which is worse than failing.
    expect(caseSources.length).toBeGreaterThan(0);
    expect(Object.keys(caseFileModules).length).toBe(caseSources.length);
  });

  it('gives every module with cases a cases.test.ts beside them', () => {
    const untested = caseSources.filter((m) => !m.files.includes('cases.test.ts')).map((m) => m.id);
    expect(untested, `cases.ts with no cases.test.ts: ${untested.join(', ')}`).toEqual([]);
  });

  it('keeps case ids unique across the whole app, because they share a URL namespace', () => {
    const seen = new Map<string, string>();
    const collisions: string[] = [];
    for (const [path, exports] of Object.entries(caseFileModules)) {
      const moduleId = moduleIdOf(path);
      for (const entry of casesIn(exports)) {
        const owner = seen.get(entry.id);
        if (owner) collisions.push(`"${entry.id}" in both ${owner} and ${moduleId}`);
        else seen.set(entry.id, moduleId);
      }
    }
    expect(collisions.join('; '), `duplicate case ids: ${collisions.join('; ')}`).toBe('');
  });

  /**
   * Two beds on the round reading "James, 32" and "James, 74" are two people the learner has no
   * way to tell apart — the name is how a patient is referred to everywhere except the URL.
   *
   * The exemption is the one device the ward genuinely uses: `james-acute-neuritis` and
   * `james-compensated` are the SAME man six weeks apart, which is the arc the vestibular module
   * was built to teach. A shared age is what separates that from a collision, and it is the part
   * an author cannot get right by accident.
   */
  it('keeps patient names unique, unless a bed is the same patient seen again', () => {
    const seen = new Map<string, { module: string; age: number }>();
    const collisions: string[] = [];
    for (const [path, exports] of Object.entries(caseFileModules)) {
      const moduleId = moduleIdOf(path);
      for (const entry of casesIn(exports)) {
        const owner = seen.get(entry.name);
        if (!owner) seen.set(entry.name, { module: moduleId, age: entry.age });
        else if (owner.age !== entry.age)
          collisions.push(
            `"${entry.name}" is ${owner.age} in ${owner.module} and ${entry.age} in ${moduleId}`,
          );
      }
    }
    expect(collisions.join('; '), `two patients sharing a name: ${collisions.join('; ')}`).toBe('');
  });

  it('only puts beds in modules the app can actually route to', () => {
    const known = new Set(MODULES.map((m) => m.id));
    const routes = new Set<string>(VALID_ROUTES);
    for (const { id } of caseSources) {
      expect(known.has(id), `${id} has cases but is not in MODULES`).toBe(true);
      expect(routes.has(id), `${id} has cases but is not a route`).toBe(true);
    }
  });

  /**
   * The silent one.
   *
   * `moduleCases.ts` loads every case file on the HOME page, which is only cheap while a case
   * file pulls nothing but types. TypeScript erases a `import type`, so the cost of getting this
   * wrong is invisible: the round still works, having added a physiology engine — and for
   * `shockStates`, `questions.ts`'s `perturbFluidBolus` would bring the whole thing — to the
   * first chunk a learner downloads. `./panel` is the one permitted value import, and it is
   * permitted precisely because it is a leaf with type-only imports of its own.
   */
  it('keeps case files free of value imports, so the home page stays free of engines', () => {
    const offenders: string[] = [];
    for (const { id, source } of caseSources) {
      const imports = source.match(/^import\s+(?!type\b)[^;]+?from\s+'([^']+)';/gm) ?? [];
      for (const statement of imports) {
        const from = statement.match(/from\s+'([^']+)'/)![1]!;
        // `import { X, type Y } from './panel'` is fine; anything else relative is not.
        if (from.startsWith('.') && from !== './panel') {
          offenders.push(`${id}: ${from}`);
        }
      }
    }
    expect(
      offenders.join('; '),
      `case files importing values outside ./panel: ${offenders.join('; ')}`,
    ).toBe('');
  });
});

const pageSources = readdirSync(modulesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((entry) =>
    readdirSync(`${modulesDir}${entry.name}`)
      .filter((file) => file.endsWith('Page.tsx'))
      .map((file) => ({
        id: entry.name,
        source: readFileSync(`${modulesDir}${entry.name}/${file}`, 'utf8'),
      })),
  );

/**
 * Repo-wide promises about the tab contract, beside the case promises above.
 *
 * Source text rather than rendered pages: the props are static JSX on the page, and rendering
 * all 51 pages would settle 51 engines to learn what a grep already knows. The patterns anchor
 * on `prop={` so `const questions = …` and `session.question` cannot match.
 */
describe('module pages, repo-wide', () => {
  it('found every module page', () => {
    // Guards the guard, as above: one page per module id in the manifest — MODULES carries two
    // entries with no simulator page of their own, so it is the wrong denominator here.
    expect(pageSources.length).toBe(MODULE_IDS.length);
  });

  it('gives every module something to put on the Questions tab', () => {
    // Bedded pages satisfy this through the hook rather than a literal prop: `useModuleCases`
    // builds the `questions` node they spread into the page.
    const missing = pageSources
      .filter((p) => !/\bquestions=\{|useModuleCases\(/.test(p.source))
      .map((p) => p.id);
    expect(missing, `*Page.tsx with no questions=: ${missing.join(', ')}`).toEqual([]);
  });

  /**
   * The shell carries blindness to the preset bar only where the page feeds it. Nineteen pages
   * never did, so a blinded learner crossing to the lab could silently replace the scenario
   * being asked about — five of them while pattern questions were actually open. A no-op where
   * a module asks nothing pattern-shaped, and required everywhere anyway so the next pattern
   * question cannot reopen it.
   */
  it('feeds blindness to the shell on every module, so the preset bar locks mid-question', () => {
    const missing = pageSources.filter((p) => !/\bblindControls=\{/.test(p.source)).map((p) => p.id);
    expect(missing, `*Page.tsx with no blindControls=: ${missing.join(', ')}`).toEqual([]);
  });

  /**
   * Same shape of rule, for the same reason. A `Sparkline` with no capacity stretches whatever
   * points it has across the whole frame, so a module opening on a trace that is still filling
   * draws a two-point line corner to corner and compresses it on every tick. The capacity reaches
   * every chart on the page through the shell — including the ones `TrendsView` builds from a
   * schema, which no page names — so the page is the one place it can be required.
   *
   * Required on all 51 rather than only on the modules that open unsettled: a settle removed
   * during calibration would otherwise take the chart's x-axis with it, silently.
   */
  it('sizes every module\'s charts, so a trace that is still filling grows in from the left', () => {
    const missing = pageSources.filter((p) => !/\bhistoryCapacity=\{/.test(p.source)).map((p) => p.id);
    expect(missing, `*Page.tsx with no historyCapacity=: ${missing.join(', ')}`).toEqual([]);
  });
});
