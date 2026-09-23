import { useSyncExternalStore } from 'react';
import { isExamId, type ExamId } from './exams';

/**
 * Which exam the catalogue is currently filtered to, if any.
 *
 * Separate from the learner's SAVED exam on purpose. The saved one is who they are and belongs in
 * `profiles`; this is what they are looking at right now, and a learner browsing outside their own
 * syllabus — an FY1 revising a topic for teaching, a student checking what the FRCA covers —
 * should not have their profile quietly rewritten by it.
 *
 * It lives in `sessionStorage` rather than in a route or in React state. A route parameter would
 * have to be threaded through every catalogue link and would turn a filter into something
 * shareable, which invites a bookmarked link that silently hides half the app. React state high
 * in the tree would reset on every navigation, which is worse: the filter has to survive
 * home → subject → theme → module → back, and that is the entire journey it exists for.
 * Per-tab, not per-browser, so two tabs can compare two syllabuses.
 *
 * The phone has no `sessionStorage` at all. Every access here is already wrapped — a browser set
 * to block site data throws on the property itself — so the same file degrades there to a filter
 * that lives for the length of the app session, which is the closest thing a phone has to a tab
 * anyway. That is why this is synced rather than written twice.
 */

const KEY = 'physiologylab.examFilter';

let active: ExamId | null = null;
let hydrated = false;

const listeners = new Set<() => void>();

/**
 * Read the stored filter once, lazily.
 *
 * Wrapped because `sessionStorage` throws outright in a browser set to block site data, and a
 * catalogue that will not render because a filter could not be remembered is a bad trade.
 */
function hydrate(): void {
  if (hydrated) return;
  hydrated = true;
  try {
    const stored = sessionStorage.getItem(KEY);
    if (isExamId(stored)) active = stored;
  } catch {
    // No stored filter is a perfectly good answer: the catalogue shows everything.
  }
}

function emit(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Pure, and correct on the very first render.
 *
 * `getSnapshot` must not have side effects, which is why hydration happens once at module load
 * rather than here. Doing it on `subscribe` would be too late — React reads a snapshot BEFORE it
 * subscribes, so a learner reloading a filtered page would get one unfiltered render first, which
 * is the same flash this store exists to avoid.
 */
function snapshot(): ExamId | null {
  return active;
}

/** Server snapshot for `useSyncExternalStore`: nothing is filtered before hydration. */
const serverSnapshot = (): ExamId | null => null;

// Read once, at import, so `active` is already right the first time anything renders.
hydrate();

/** Set the filter, or clear it with null. */
export function setExamFilter(next: ExamId | null): void {
  hydrate();
  if (active === next) return;
  active = next;
  try {
    if (next === null) sessionStorage.removeItem(KEY);
    else sessionStorage.setItem(KEY, next);
  } catch {
    // Filtering still works for this page view; it just will not survive a reload.
  }
  emit();
}

/**
 * Adopt the learner's saved exam as the starting filter, once.
 *
 * Only ever applied when nothing is stored for this tab, so it seeds a first visit and never
 * overrules a learner who has since chosen to look at something else.
 */
export function seedExamFilter(saved: ExamId | null): void {
  hydrate();
  if (saved === null || active !== null) return;
  setExamFilter(saved);
}

export function useExamFilter(): ExamId | null {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

/** Reset between tests, where a module-level store would otherwise leak across cases. */
export function clearExamFilterForTests(): void {
  active = null;
  hydrated = false;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing stored, nothing to clear.
  }
  emit();
}

/**
 * Whether a module should be shown under the current filter.
 *
 * An UNTAGGED module passes every filter. That is the deliberate reading of "not yet mapped" from
 * `ModuleDescriptor.exams`: hiding a module because nobody has got round to tagging it would let
 * a learner who trusts the filter skip material that is genuinely on their syllabus, and a module
 * shown in error costs them a moment while a module hidden in error costs them a question.
 */
export function matchesExam(exams: readonly ExamId[] | undefined, filter: ExamId | null): boolean {
  if (filter === null || exams === undefined) return true;
  return exams.includes(filter);
}
