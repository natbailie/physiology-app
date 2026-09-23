import { useMemo } from 'react';
import { useEntitlement } from '@/billing/useEntitlement';
import { MODULES } from '@/home/moduleRegistry';
import { useRound, type RoundBed } from '@/home/useRound';

/** Module id -> display name. Module scope, so `useRound`'s memo sees a stable function. */
const MODULE_NAMES = new Map(MODULES.map((module) => [module.id, module.name]));
const moduleNameOf = (moduleId: string): string => MODULE_NAMES.get(moduleId) ?? moduleId;

export interface RoundWalk {
  previous: RoundBed | null;
  next: RoundBed | null;
  /** Where this patient sits in the walk, 1-based, for "3 of 8". Null when off the round. */
  position: number | null;
  total: number;
}

const NOWHERE: RoundWalk = { previous: null, next: null, position: null, total: 0 };

/**
 * Previous and next patient, so a round can be walked instead of returned to.
 *
 * "Start round" opens the top of the board; without this the only way to the second patient is
 * back to the home page, which makes a ward round a list of links rather than a round.
 *
 * **The walk follows `round.today`**, the board as drawn — so it matches what the learner saw,
 * and it inherits the specialty filter for free, because `useRound` applies that before the
 * daily slice. Falling back to `round.beds` covers a patient reached through "Show all" or a
 * shared link, who is genuinely on the round but not in today's ten.
 *
 * It crosses modules, which is the point: a ward round is not one organ system. A step within
 * the same module does not remount the page — `useModuleCase` owns a `hashchange` listener for
 * exactly that — and a step to another module is an ordinary route change.
 *
 * Web-only: `src/shared/hooks` is outside the sync dirs, and native routes through expo-router
 * rather than a hash. The phone builds the same thing on its own module screen.
 */
export function useRoundWalk(caseId: string | null): RoundWalk {
  const entitlement = useEntitlement();
  const round = useRound(moduleNameOf, entitlement);

  return useMemo(() => {
    if (caseId === null || !round.ready) return NOWHERE;

    // Today's board first; the whole ward only for a patient who is not on it.
    const list = round.today.some((bed) => bed.id === caseId) ? round.today : round.beds;
    const index = list.findIndex((bed) => bed.id === caseId);
    if (index === -1) return NOWHERE;

    return {
      previous: index > 0 ? list[index - 1]! : null,
      next: index < list.length - 1 ? list[index + 1]! : null,
      position: index + 1,
      total: list.length,
    };
  }, [caseId, round]);
}

/** The hash a bed lives at. One definition, so the board and the walk cannot disagree. */
export function bedHref(bed: RoundBed): string {
  return `#${bed.moduleId}?case=${bed.id}`;
}
