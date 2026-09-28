import { useSyncExternalStore } from 'react';
import type { ExamId } from './exams';

/**
 * Which exam the catalogue is currently filtered to, if any.
 *
 * Separate from the learner's SAVED exam on purpose. The saved one is who they are and belongs in
 * `profiles`; this is what they are looking at right now, and a learner browsing outside their own
 * syllabus — an FY1 revising a topic for teaching, a student checking what the FRCA covers —
 * should not have their profile quietly rewritten by it.
 *
 * Every visit starts on "All exams". The saved exam is NOT applied on arrival, and nothing is
 * restored from storage on reload: a catalogue that opens already filtered looks like an app
 * that is missing modules, and the learner never asked for it on this visit.
 *
 * It lives in a module-level store rather than in a route or in React state. A route parameter
 * would have to be threaded through every catalogue link and would turn a filter into something
 * shareable; React state high in the tree would reset on every navigation. The filter has to
 * survive home → subject → theme → module → back, and that is the entire journey it exists for —
 * a module-level value does exactly that, and a reload clears it.
 */

let active: ExamId | null = null;

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function snapshot(): ExamId | null {
  return active;
}

/** Server snapshot for `useSyncExternalStore`: nothing is filtered before the client renders. */
const serverSnapshot = (): ExamId | null => null;

/** Set the filter, or clear it with null. */
export function setExamFilter(next: ExamId | null): void {
  if (active === next) return;
  active = next;
  emit();
}

export function useExamFilter(): ExamId | null {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

/** Reset between tests, where a module-level store would otherwise leak across cases. */
export function clearExamFilterForTests(): void {
  active = null;
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
