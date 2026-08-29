import { describe, expect, it } from 'vitest';
import { MODULES } from '@/home/moduleRegistry';
import {
  paragraphsOf,
  type ExplainerContent,
} from '@/shared/components/ExplainerPanel/ExplainerPanel';

/**
 * Discovered, not listed. The hand-maintained array this replaced had drifted to 41 of the 45
 * `content.ts` files, so coronaryCirculation, digestionAbsorption, inflammation and micturition
 * were silently unverified — and its `toHaveLength(41)` meant adding them failed the test until
 * the literal was bumped. `src/shared/verification/controls.test.tsx` globs for exactly this
 * reason: a hand-maintained list of module ids is the one that under-reports.
 */
const contentModules = import.meta.glob<Record<string, unknown>>('./*/content.ts', { eager: true });

const moduleIdOf = (path: string): string => path.match(/^\.\/([^/]+)\//)![1]!;

function findContent(exports: Record<string, unknown>): ExplainerContent | null {
  for (const value of Object.values(exports)) {
    if (value && typeof value === 'object' && 'title' in value) return value as ExplainerContent;
  }
  return null;
}

const ALL: [string, ExplainerContent][] = Object.entries(contentModules)
  .map(([path, exports]) => [moduleIdOf(path), findContent(exports)] as const)
  .filter((entry): entry is [string, ExplainerContent] => entry[1] !== null)
  .sort(([a], [b]) => a.localeCompare(b));

const words = (text: string) => text.trim().split(/\s+/).length;

/** Modules authored as titled sections. The rest are still flat prose and migrate over time. */
const SECTIONED: [string, NonNullable<ExplainerContent['sections']>][] = ALL.flatMap(
  ([id, content]) => (content.sections ? [[id, content.sections] as [string, NonNullable<ExplainerContent['sections']>]] : []),
);

/**
 * The explainer is the default first encounter with a module now that it opens by design, so
 * these guard a floor rather than an aspiration: every module gets a real title and enough
 * substantive prose that a learner meets a mechanism rather than a caption.
 */
describe('module explainer content', () => {
  it('covers every simulator module', () => {
    const simulators = MODULES.filter((m) => m.status === 'available' && m.kind !== 'reference').map(
      (m) => m.id,
    );
    const covered = new Set(ALL.map(([id]) => id));
    const missing = simulators.filter((id) => !covered.has(id));
    expect(missing, `simulators with no content.ts: ${missing.join(', ')}`).toEqual([]);
    expect(new Set(ALL.map(([id]) => id)).size).toBe(ALL.length);
  });

  it('gives every module a title that says something', () => {
    for (const [id, content] of ALL) {
      expect(content.title.length, `${id} title`).toBeGreaterThan(15);
      // A title is a claim about the mechanism, not a restatement of the module name.
      expect(words(content.title), `${id} title`).toBeGreaterThan(3);
    }
  });

  it('carries at least five substantive paragraphs', () => {
    for (const [id, content] of ALL) {
      expect(paragraphsOf(content).length, `${id} paragraph count`).toBeGreaterThanOrEqual(5);
    }
  });

  it('has no thin paragraphs', () => {
    const thin = ALL.flatMap(([id, content]) =>
      paragraphsOf(content)
        .map((paragraph, index) => ({ id, index, count: words(paragraph) }))
        .filter(({ count }) => count < 40)
        .map(({ index, count }) => `  ${id}[${index}]: ${count} words`),
    );
    expect(thin.join('\n'), `paragraphs too thin to teach anything:\n${thin.join('\n')}`).toBe('');
  });

  it('reaches a usable total length per module', () => {
    for (const [id, content] of ALL) {
      const total = paragraphsOf(content).reduce((sum, p) => sum + words(p), 0);
      expect(total, `${id} total words`).toBeGreaterThan(300);
    }
  });

  it('never repeats a paragraph within a module', () => {
    for (const [id, content] of ALL) {
      const paragraphs = paragraphsOf(content);
      expect(new Set(paragraphs).size, `${id} duplicate paragraph`).toBe(paragraphs.length);
    }
  });
});

/**
 * Sections exist to give a reader landmarks in 600 words. A heading that restates the module
 * name is not a landmark, and four is the fewest that reads as a structure rather than as one
 * arbitrary fold.
 */
describe('sectioned explainer content', () => {
  it('splits into enough sections to be worth splitting', () => {
    for (const [id, sections] of SECTIONED) {
      expect(sections.length, `${id} section count`).toBeGreaterThanOrEqual(4);
    }
  });

  it('gives every section a heading that makes a claim', () => {
    for (const [id, sections] of SECTIONED) {
      sections.forEach((section, index) => {
        expect(section.heading.length, `${id}[${index}] heading`).toBeGreaterThan(15);
        expect(words(section.heading), `${id}[${index}] heading`).toBeGreaterThan(3);
      });
    }
  });

  it('never leaves a section without prose, or repeats a heading', () => {
    for (const [id, sections] of SECTIONED) {
      sections.forEach((section, index) => {
        expect(section.paragraphs.length, `${id}[${index}] paragraphs`).toBeGreaterThan(0);
      });
      const headings = sections.map((s) => s.heading);
      expect(new Set(headings).size, `${id} duplicate heading`).toBe(headings.length);
    }
  });
});
