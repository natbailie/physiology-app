import { useCallback, useRef, useState } from 'react';
import type { ModuleTab } from '@/shared/components/ModulePage/ModulePage';

/**
 * Which view a module page is showing, and the one thing a tab press must do besides move.
 *
 * The initial tab is a LAZY INITIALISER, not derived state: arriving at a bed should open on the
 * bed, and after that the tab belongs to the learner — recomputing it from the hash would yank
 * the view out from under somebody who had deliberately switched to the lab.
 *
 * The Questions tab runs a DIFFERENT set of questions, and `useQuizSession` holds its queue as
 * question IDS: rebuilding the list under a live session leaves the cursor pointing at an id
 * that no longer resolves, after which `question` goes null and QuizPanel renders nothing while
 * the phase still says a question is open. That is the same hazard `useBedside`'s `onBedChange`
 * exists for, arriving through a different door.
 *
 * Ended in the HANDLER rather than an effect. A bed change arrives from outside React — a
 * `hashchange` — so it needs a previous-value ref to tell a real change from a mount. A tab press
 * is a user event we own, so there is no mount fire to suppress and no ref to keep.
 *
 * Keyed on the question-SET, not the tab name. Lab and Lessons show no set of their own — they
 * are transparent — so a glance at the diagram or the prose mid-question never ends anything,
 * and the session keeps reading a stabilised array (see `useModulePractice`) with the lab's
 * controls held hidden until it is over. Only ARRIVING at a question-bearing tab whose set
 * differs from the one the learner came from ends the session: bedside to Questions, Questions
 * to a bedside, or either after a detour through the lab.
 */
export function useModuleTab(
  patient: { id: string } | null,
  endSession: () => void,
): [ModuleTab, (next: ModuleTab) => void] {
  const [tab, setTab] = useState<ModuleTab>(() => (patient ? 'clinic' : 'lab'));

  const end = useRef(endSession);
  end.current = endSession;
  // Latest patient for the handler below, which runs between renders. Same pattern as `end`.
  const patientRef = useRef(patient);
  patientRef.current = patient;

  // The question-bearing set showing as of the last commit. Written during render, never in the
  // handler: the handler compares the ARRIVAL against it, and a render on a transparent tab
  // deliberately leaves it alone so the set the learner came from survives the detour.
  const setRef = useRef<string | null>(null);
  const showing =
    tab === 'questions' ? 'questions' : tab === 'clinic' ? (patient ? `bed:${patient.id}` : 'none') : null;
  if (showing !== null) setRef.current = showing;

  const change = useCallback(
    (next: ModuleTab) => {
      const keyOf = (t: ModuleTab): string | null => {
        if (t === 'lab' || t === 'lessons') return null;
        if (t === 'questions') return 'questions';
        const p = patientRef.current;
        return p ? `bed:${p.id}` : 'none';
      };
      setTab((current) => {
        // Read inside the updater so the decision is made against the committed tab rather than
        // whatever this closure captured, then act on it outside — calling another component's
        // setState from within an updater is the "cannot update while rendering" warning.
        if (current === next) return next;
        const to = keyOf(next);
        if (to !== null && setRef.current !== null && to !== setRef.current) {
          queueMicrotask(() => end.current());
        }
        return next;
      });
    },
    [],
  );

  return [tab, change];
}
