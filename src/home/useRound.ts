import { useMemo, useSyncExternalStore } from 'react';
import type { Entitlement } from '@/billing/useEntitlement';
import { useProgressStore } from '@/shared/assessment/useProgressStore';
import { ACUITY_ORDER, acuityOf, type Acuity } from '@/shared/cases/acuity';
import { studyDayOf } from '@/shared/assessment/scheduling';
import type { RoundCase } from '@/shared/cases/types';
import { MODULES, THEMES, type ThemeId } from './moduleRegistry';
import { useSpecialtyFilter } from './specialtyFilter';
import { allCases, caseIndexVersion, subscribeCaseIndex } from './moduleCases';
import { questionIndexReady, questionIndexVersion, subscribeQuestionIndex } from './moduleQuestionIds';

export interface RoundBed extends RoundCase {
  acuity: Acuity;
  /** How many of this patient's questions have come round again. */
  dueCount: number;
  moduleName: string;
  /** The specialty this patient is on, which is the module's own theme — there is deliberately
   * no second taxonomy. Absent only for a module that belongs to no theme, which no bedded
   * module does today; the filter simply never matches one if that changes. */
  themeId?: ThemeId;
  themeName?: string;
  /** False when the module is behind the paywall. A referral, not a bed. */
  unlocked: boolean;
}

export interface Round {
  /** Beds the learner can actually open, most urgent first. */
  beds: RoundBed[];
  /** Today's slice of the above: everything needing review, filled to board size. */
  today: RoundBed[];
  /** The rest, in rank order, behind the board's expander. */
  rest: RoundBed[];
  /** Patients behind the paywall. Rendered as referrals, deliberately WITHOUT an acuity —
   * a locked module can hold no review state, so every one of them would read "new admission"
   * and a wall of identical chips is worse than the catalogue it replaced. */
  referrals: RoundBed[];
  /** Every specialty with a patient on it, computed BEFORE the filter is applied and in
   * catalogue order. The chip row is built from this rather than from the beds on screen —
   * otherwise choosing a specialty would leave a row holding only that specialty, with no way
   * back to the others. Locked wards count: their patients are still on the round as referrals. */
  everySpecialty: ThemeId[];
  /** False until both indices land. The board renders nothing until then rather than showing
   * a ward of new admissions it is about to rewrite. */
  ready: boolean;
}

/**
 * How many beds the board shows before offering the rest behind an expander. A wall of
 * identical new-admission chips is the exact failure the referrals split was designed to
 * avoid; this bounds the board while the guarantee below keeps review work visible.
 */
export const ROUND_BOARD_SIZE = 10;

/** Module id -> its theme, and theme id -> its name. Module scope: the catalogue is static. */
const THEME_OF_MODULE = new Map(MODULES.map((module) => [module.id, module.theme]));
const THEME_NAME = new Map(THEMES.map((theme) => [theme.id, theme.name]));

/** Stable string hash, so the fill order is deterministic per day (same shape as the
 * option shuffler in assessment types, deliberately duplicated: this file owns the round). */
function hashDayBed(day: string, id: string): number {
  let h = 2166136261;
  const value = `${day}|${id}`;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Today's round: everything needing review, filled to board size with the rest.
 *
 * Crash and due beds are ALWAYS shown — bounding the board must never hide review work,
 * which is the whole point of ranking it first. The fill is new and check beds in an order
 * drawn deterministically from the calendar day: stable every render within the day (no
 * shifting under the learner), a different ward tomorrow (no bed rots unseen). In the
 * pathological case of more priority beds than board slots, the guarantee wins and today
 * overshoots rather than hiding a crash.
 */
export function todaysRound(
  beds: readonly RoundBed[],
  now: number,
  size: number = ROUND_BOARD_SIZE,
): { today: RoundBed[]; rest: RoundBed[] } {
  const priority = beds.filter((bed) => bed.acuity === 'crash' || bed.acuity === 'due');
  const day = studyDayOf(now);
  const fill = beds
    .filter((bed) => bed.acuity !== 'crash' && bed.acuity !== 'due')
    .map((bed) => ({ bed, rank: hashDayBed(day, bed.id) }))
    .sort((a, b) => a.rank - b.rank)
    .map((entry) => entry.bed);
  const today = [...priority, ...fill.slice(0, Math.max(0, size - priority.length))];
  const shown = new Set(today.map((bed) => bed.id));
  return { today, rest: beds.filter((bed) => !shown.has(bed.id)) };
}

/**
 * The ward round: every authored case, ranked by what this learner has forgotten.
 *
 * Reads entirely from state that already exists — the case index and the progress store — so
 * the round adds no persistence of its own and cannot disagree with the study strip beside it.
 *
 * Entitlement arrives as a parameter rather than a hook call: native signs in through its own
 * `useNativeEntitlement`, which is a different implementation of the same `Entitlement`
 * interface. The body is identical on both platforms, which is what keeps this file syncable.
 */
export function useRound(nameOf: (moduleId: string) => string, entitlement: Entitlement): Round {
  const store = useProgressStore();
  // Read here rather than taken as a parameter: `specialtyFilter` is a synced module store that
  // works identically on both platforms, unlike `entitlement`, whose two implementations are
  // exactly why THAT one is injected.
  const specialty = useSpecialtyFilter();
  const caseVersion = useSyncExternalStore(subscribeCaseIndex, caseIndexVersion);
  const questionVersion = useSyncExternalStore(subscribeQuestionIndex, questionIndexVersion);
  const { isUnlocked, status } = entitlement;

  return useMemo(() => {
    const cases = allCases();
    // Entitlement resolves asynchronously too, and guessing while it loads would flash a ward
    // of referrals at somebody who has paid.
    const ready = cases.length > 0 && questionIndexReady() && status !== 'loading';
    if (!ready) return { beds: [], today: [], rest: [], referrals: [], everySpecialty: [], ready: false };

    const summaries = store.allSummaries();
    const now = Date.now();

    const all: RoundBed[] = cases.map((entry) => {
      const schedule = summaries[entry.moduleId]?.schedule ?? {};
      const themeId = THEME_OF_MODULE.get(entry.moduleId);
      return {
        ...entry,
        moduleName: nameOf(entry.moduleId),
        themeId,
        themeName: themeId ? THEME_NAME.get(themeId) : undefined,
        acuity: acuityOf(schedule, entry.questionIds, now),
        dueCount: store.due(entry.moduleId, entry.questionIds).length,
        unlocked: isUnlocked(entry.moduleId),
      };
    });

    const rank = (bed: RoundBed) => ACUITY_ORDER.indexOf(bed.acuity);
    // Filtered BEFORE `todaysRound`, deliberately: the daily slice and the crash-first guarantee
    // then apply within the chosen specialty. Filtering afterwards would let a board of ten
    // beds thin to two because the other eight happened to be cardiology, and would let a crash
    // bed on the selected specialty fall outside today's slice entirely.
    const beds = all
      .filter((bed) => bed.unlocked && (specialty === null || bed.themeId === specialty))
      .sort((a, b) => rank(a) - rank(b) || b.dueCount - a.dueCount || a.name.localeCompare(b.name));
    const { today, rest } = todaysRound(beds, now);

    // From `all`, not from `beds`: the chip row must keep offering the specialty a learner is
    // currently filtered to, and every other one they could switch to.
    const present = new Set(all.map((bed) => bed.themeId).filter((id): id is ThemeId => id !== undefined));
    const everySpecialty = THEMES.filter((theme) => present.has(theme.id)).map((theme) => theme.id);

    return {
      beds,
      today,
      rest,
      everySpecialty,
      // Referrals follow the filter too, or a cardiology round would advertise locked
      // neurology patients it is not otherwise showing.
      referrals: all.filter((bed) => !bed.unlocked && (specialty === null || bed.themeId === specialty)),
      ready: true,
    };
    // `isUnlocked` is a fresh closure each render; `status` is the value that actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, caseVersion, questionVersion, status, nameOf, specialty]);
}
