/**
 * Every module's question ids, discovered rather than listed.
 *
 * The home screen needs to know how many questions each module HAS, not just how many the
 * learner has attempted — mastery counts the unseen ones against you, so the denominator has to
 * be the whole module.
 *
 * Globbed instead of hand-maintained on purpose. Module ids already appear in four places (see
 * CLAUDE.md) and a fifth that silently under-reports a module's size would be the least visible
 * of them: nothing would break, the numbers would just quietly be wrong. `moduleQuestionIds.test.ts`
 * asserts the glob still finds every module in the registry, so if this stops matching it fails
 * loudly rather than reporting zero.
 *
 * Costs no bundle weight: `App.tsx` already imports all 26 module pages, and each of those
 * already imports its own questions.
 */
const questionModules = import.meta.glob<Record<string, unknown>>('../modules/*/questions.ts', {
  eager: true,
});

function hasStringId(value: unknown): value is { id: string } {
  return typeof value === 'object' && value !== null && typeof (value as { id?: unknown }).id === 'string';
}

function buildIndex(): Record<string, string[]> {
  const index: Record<string, string[]> = {};

  for (const [path, exports] of Object.entries(questionModules)) {
    const moduleId = path.match(/modules\/([^/]+)\/questions\.ts$/)?.[1];
    if (!moduleId) continue;

    // Each module names its array differently (RESPIRATORY_QUESTIONS, ECG_QUESTIONS, ...), so
    // it is found by shape: the exported array whose entries carry a string id.
    const questions = Object.values(exports).find(
      (value): value is readonly { id: string }[] =>
        Array.isArray(value) && value.length > 0 && value.every(hasStringId),
    );
    index[moduleId] = questions ? questions.map((q) => q.id) : [];
  }

  return index;
}

export const MODULE_QUESTION_IDS: Record<string, string[]> = buildIndex();

export function questionIdsFor(moduleId: string): string[] {
  return MODULE_QUESTION_IDS[moduleId] ?? [];
}
