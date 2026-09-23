/**
 * Every module's patient cases, discovered the way its questions are.
 *
 * Follows `moduleQuestionIds.ts` deliberately, down to the subscription shape: same background
 * build, same version counter, same escape hatch. The one difference is that this index covers a
 * SUBSET of modules — `caseModules` is the manifest's fourth surface, and most modules have no
 * bed.
 *
 * The loaders are lazy for the reason that file documents, and the case files are cheap to load
 * for a reason that is enforced rather than hoped for: a `cases.ts` has no value imports, only
 * type-only ones plus its module's `panel.ts`. `shared/verification/cases.test.ts` fails if that
 * stops being true, because the failure mode is silent — the ward round would still work, having
 * quietly pulled eight physiology engines into the home page.
 */
import { caseModules } from '@/modules/manifest.generated';
import type { RoundCase } from '@/shared/cases/types';

let index: RoundCase[] | null = null;
let version = 0;
let loadStarted = false;
const listeners = new Set<() => void>();

function isCase(value: unknown): value is Omit<RoundCase, 'moduleId'> {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Record<string, unknown>;
  return typeof entry.id === 'string' && typeof entry.name === 'string' && typeof entry.preset === 'string';
}

function casesIn(moduleId: string, exports: Record<string, unknown>): RoundCase[] {
  // Found by shape rather than by name, exactly as the question index does it: each module
  // calls its array something different (SHOCK_CASES, RESPIRATORY_CASES, ...).
  const cases = Object.values(exports).find(
    (value): value is readonly Omit<RoundCase, 'moduleId'>[] =>
      Array.isArray(value) && value.length > 0 && value.every(isCase),
  );
  if (!cases) return [];
  // The owning module comes from the MANIFEST KEY, never from the case file. A case that
  // repeated its own module id would be a second place for that id to be wrong.
  return cases.map((entry) => ({
    moduleId,
    id: entry.id,
    name: entry.name,
    age: entry.age,
    oneLiner: entry.oneLiner,
    questionIds: entry.questionIds ?? [],
  }));
}

function startLoad(): void {
  if (loadStarted) return;
  loadStarted = true;

  void Promise.all(
    Object.entries(caseModules).map(async ([moduleId, loader]) => casesIn(moduleId, await loader())),
  ).then((groups) => {
    index = groups.flat();
    version += 1;
    for (const listener of listeners) listener();
  });
}

/** Kicks off the background build (idempotent) and subscribes to its completion. */
export function subscribeCaseIndex(listener: () => void): () => void {
  startLoad();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Snapshot for useSyncExternalStore — changes exactly once, when the index lands. */
export function caseIndexVersion(): number {
  return version;
}

/** Every bed in the hospital, or an empty list until the index lands. */
export function allCases(): readonly RoundCase[] {
  return index ?? [];
}

export function caseIndexReady(): boolean {
  return index !== null;
}

/** Test/SSR escape hatch: resolves once every case file has been loaded. */
export async function loadCaseIndex(): Promise<readonly RoundCase[]> {
  startLoad();
  await new Promise<void>((resolve) => {
    if (index !== null) return resolve();
    const unsubscribe = subscribeCaseIndex(() => {
      if (index !== null) {
        unsubscribe();
        resolve();
      }
    });
  });
  return index as RoundCase[];
}
