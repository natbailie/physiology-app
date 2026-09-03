/**
 * Every module's question ids, discovered rather than listed.
 *
 * The home screen needs to know how many questions each module HAS, not just how many the
 * learner has attempted — mastery counts the unseen ones against you, so the denominator has to
 * be the whole module.
 *
 * Generated rather than hand-maintained on purpose. Module ids already appear in four places (see
 * CLAUDE.md) and a fifth that silently under-reports a module's size would be the least visible
 * of them: nothing would break, the numbers would just quietly be wrong. This used to be an
 * `import.meta.glob`; it is now `modules/manifest.generated.ts`, which nobody edits by hand and
 * which `manifest.generated.test.ts` re-globs to prove still covers every module. That swap is
 * what lets the React Native app share this file — Metro has no glob and Hermes rejects
 * `import.meta` outright. `moduleQuestionIds.test.ts` still asserts the index finds every module
 * in the registry, so if discovery breaks it fails loudly rather than reporting zero.
 *
 * The loaders are deliberately NOT eager. Eagerly importing them welds every module's questions
 * into the chunk that imports this file — fine while App.tsx statically imported all pages, fatal
 * to first-load size now that each page is its own lazy route. The index builds once in the
 * background; consumers subscribe and re-render when it lands.
 */
import { questionModules } from '@/modules/manifest.generated';

function hasStringId(value: unknown): value is { id: string } {
  return typeof value === 'object' && value !== null && typeof (value as { id?: unknown }).id === 'string';
}

let index: Record<string, string[]> | null = null;
let version = 0;
let loadStarted = false;
const listeners = new Set<() => void>();

function questionIdsIn(exports: Record<string, unknown>): string[] {
  // Each module names its array differently (RESPIRATORY_QUESTIONS, ECG_QUESTIONS, ...), so
  // it is found by shape: the exported array whose entries carry a string id.
  const questions = Object.values(exports).find(
    (value): value is readonly { id: string }[] =>
      Array.isArray(value) && value.length > 0 && value.every(hasStringId),
  );
  return questions ? questions.map((q) => q.id) : [];
}

function startLoad(): void {
  if (loadStarted) return;
  loadStarted = true;

  void Promise.all(
    Object.entries(questionModules).map(
      async ([moduleId, loader]): Promise<[string, string[]]> => [moduleId, questionIdsIn(await loader())],
    ),
  ).then((entries) => {
    index = {};
    for (const [moduleId, ids] of entries) {
      index[moduleId] = ids;
    }
    version += 1;
    for (const listener of listeners) listener();
  });
}

/** Kicks off the background build (idempotent) and subscribes to its completion. */
export function subscribeQuestionIndex(listener: () => void): () => void {
  startLoad();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Snapshot for useSyncExternalStore — changes exactly once, when the index lands. */
export function questionIndexVersion(): number {
  return version;
}

export function questionIdsFor(moduleId: string): string[] {
  return index?.[moduleId] ?? [];
}

/** Test/SSR escape hatch: resolves with the full index once every module has been loaded. */
export async function loadQuestionIndex(): Promise<Record<string, string[]>> {
  startLoad();
  await new Promise<void>((resolve) => {
    if (index !== null) return resolve();
    const unsubscribe = subscribeQuestionIndex(() => {
      if (index !== null) {
        unsubscribe();
        resolve();
      }
    });
  });
  return index as Record<string, string[]>;
}
