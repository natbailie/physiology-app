import { describe, expect, it } from 'vitest';
import { MODULE_IDS, contentModules, questionModules } from './manifest.generated';

/**
 * The manifest is generated (`tools/module-manifest/generate.mjs`), which replaces the old
 * `import.meta.glob` discovery in `home/moduleQuestionIds.ts` and `shared/chat/corpus.ts`. A
 * generated list is ordinary static ESM that Metro and Hermes can load, but it only stays honest
 * if something re-globs on our behalf — the whole point of the glob was that a module could not
 * silently stop being covered, and a stale generated list would be the quietest way for that to
 * come back.
 *
 * This is that re-glob. It reads the actual module directories again here and demands the
 * manifest agree in both directions:
 *   - every directory with a `questions.ts` and `content.ts` appears in MODULE_IDS and both maps
 *     (a module added without regenerating the manifest fails here); and
 *   - no entry in the manifest points at a directory that is not a real module (a hand edit that
 *     adds a phantom loader fails here).
 */

interface Manifest {
  id: string;
  question: boolean;
  content: boolean;
}

/** Module ids currently discoverable from the actual directories. */
const questionPaths = import.meta.glob('./*/questions.ts', { eager: true });
const contentPaths = import.meta.glob('./*/content.ts', { eager: true });

const moduleIdOf = (path: string): string => path.match(/^\.\/([^/]+)\//)![1]!;

const onDisk = new Map<string, Manifest>();
for (const path of Object.keys(questionPaths)) {
  const id = moduleIdOf(path);
  const entry = onDisk.get(id) ?? { id, question: false, content: false };
  entry.question = true;
  onDisk.set(id, entry);
}
for (const path of Object.keys(contentPaths)) {
  const id = moduleIdOf(path);
  const entry = onDisk.get(id) ?? { id, question: false, content: false };
  entry.content = true;
  onDisk.set(id, entry);
}

const hasBoth = [...onDisk.values()].filter((m) => m.question && m.content).map((m) => m.id);

const manifestQuestionIds = Object.keys(questionModules);
const manifestContentIds = Object.keys(contentModules);

describe('module manifest', () => {
  it('covers every module directory that has both questions and content', () => {
    const missing = hasBoth.filter((id) => !MODULE_IDS.includes(id));
    expect(missing, `modules missing from MODULE_IDS: ${missing.join(', ')}`).toEqual([]);

    const missingQuestions = hasBoth.filter((id) => !manifestQuestionIds.includes(id));
    expect(missingQuestions, `modules missing from questionModules: ${missingQuestions.join(', ')}`).toEqual([]);

    const missingContent = hasBoth.filter((id) => !manifestContentIds.includes(id));
    expect(missingContent, `modules missing from contentModules: ${missingContent.join(', ')}`).toEqual([]);
  });

  it('lists no module that is not a real module directory', () => {
    const ids = new Set(hasBoth);
    const strayIds = MODULE_IDS.filter((id) => !ids.has(id));
    expect(strayIds, `MODULE_IDS entries that are not module directories: ${strayIds.join(', ')}`).toEqual([]);

    const strayQuestions = manifestQuestionIds.filter((id) => !ids.has(id));
    expect(
      strayQuestions,
      `questionModules entries that are not module directories: ${strayQuestions.join(', ')}`,
    ).toEqual([]);

    const strayContent = manifestContentIds.filter((id) => !ids.has(id));
    expect(
      strayContent,
      `contentModules entries that are not module directories: ${strayContent.join(', ')}`,
    ).toEqual([]);
  });

  it('keeps the three manifest surfaces in mutual agreement', () => {
    const ids = [...MODULE_IDS].sort();
    expect([...manifestQuestionIds].sort()).toEqual(ids);
    expect([...manifestContentIds].sort()).toEqual(ids);
  });

  it('keeps a module id that has questions but no content out of contentModules', () => {
    const orphanContent = [...onDisk.values()]
      .filter((m) => m.content && !m.question)
      .map((m) => m.id);
    expect(orphanContent).toEqual([]);
  });
});
