import { useMemo, useRef, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import type { QuizSession } from '@/shared/assessment/useQuizSession';
import type { ModuleSummary, ProgressStore } from '@/shared/assessment/progressStore';
import { type ModuleQuestion, type StateOf } from '@/shared/assessment/types';
import { unclaimedQuestions } from '@/shared/cases/unclaimed';
import type { ModuleCase } from '@/shared/cases/types';
import { useModuleTab } from '@/shared/hooks/useModuleTab';
import {
  useBedside,
  useCaseShareLink,
  useReturnToBedsideOnComplete,
} from '@/shared/hooks/useModuleCase';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { CaseHeader } from '@/shared/components/CaseHeader/CaseHeader';
import { ClinicPanel } from '@/shared/components/ClinicPanel/ClinicPanel';
import { QuestionSet } from '@/shared/components/QuestionSet/QuestionSet';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import type { ModuleTab } from '@/shared/components/ModulePage/ModulePage';
import { useRoundWalk } from './useRoundWalk';
import { RoundWalkBar } from '@/shared/components/RoundWalkBar/RoundWalkBar';

/**
 * Everything a bedded module page needs that is not its own physiology: the tab, the question
 * sets, the session, the bedside, and the three nodes that render them.
 *
 * The engine stays in the page — the loop, the shareable inputs, the reset, the presentation —
 * because those are per-module physiology with per-module types the hook must not know. What
 * moves here is the wiring every bedded page otherwise repeats (~40 lines): the tab before the
 * session, the exit ref that makes that ordering legal, the unclaimed set, the single mounted
 * panel, and the return to the bedside. A newly-bedded page's diff is one call plus a spread.
 */

export interface ModuleCasesOptions<TInputs, TPreset extends string, TSnapshot> {
  moduleId: string;
  /**
   * The page's own `useModuleCase` subscription, kept for the input seed and the reset
   * defaults, which stay in the page with the engine. Passed back in because the hook cannot
   * subscribe itself: `useShareableInputs` needs the patient before this hook runs, and this
   * hook needs that hook's `inputs` — subscribing twice would only duplicate the listener for
   * the same value.
   */
  patient: ModuleCase<TPreset, TSnapshot> | null;
  /** The module's beds. Module scope, never an inline literal — see `getUnclaimed` below. */
  cases: readonly ModuleCase<TPreset, TSnapshot>[];
  /** The module's whole question set. Module scope, never an inline literal. */
  questions: readonly ModuleQuestion<TInputs, TPreset, TSnapshot>[];
  presets: Record<TPreset, Partial<TInputs>>;
  defaultInputs: TInputs;
  inputs: TInputs;
  setInputs: Dispatch<SetStateAction<TInputs>>;
  captureBaseline: () => void;
  clearBaseline: () => void;
  resetEngine: () => void;
  perturbEngine: (fn: (state: StateOf<TSnapshot>) => StateOf<TSnapshot>) => void;
  fastForwardEngine: (seconds: number, inputsOverride?: TInputs) => void;
  /** The page's raw share link, before the case is appended. */
  shareLink: () => string;
  /** The live simulation the bedside chart and the Questions instrument read. */
  snapshot: TSnapshot | null;
  /** Structural, not `SimTransport`: the hook reads `playing` and nothing else. */
  transport: { playing: boolean };
  /** Whether a comparison trace is frozen — `baseline.history !== null` on the page. */
  baselineFrozen: boolean;
  /** Display names for scenario options. Required for pattern-discrimination questions. */
  presetLabels?: Record<TPreset, string>;
  /** One line under a scenario option, naming what the state IS. Pattern questions only. */
  presetGloss?: Partial<Record<TPreset, string>>;
  /** Injectable for tests; overrides the learner's default store. */
  store?: ProgressStore;
}

export interface ModuleCasesPage {
  activeTab: ModuleTab;
  onTabChange: (tab: ModuleTab) => void;
  caseHeader: ReactNode;
  roundWalk: ReactNode;
  clinic: ReactNode;
  questions: ReactNode;
}

export interface ModuleCases<TInputs, TPreset extends string, TSnapshot> {
  session: QuizSession<TInputs, TPreset, TSnapshot>;
  summary: ModuleSummary;
  /** Drop-in for `PresetBar`'s `onApply`: the bedside applier, which tracks the banner. */
  applyPreset: (name: TPreset) => void;
  /** Drop-in for `PresetBar`'s `onShare`: the page's link with the case appended. */
  shareLink: () => string;
  /** Spread into `ModulePage`: the tab control and the three bedded nodes. */
  page: ModuleCasesPage;
}

/**
 * The questions no bed claims, cached per module rather than recomputed per mount.
 *
 * Module-level `WeakMap` keyed on `(questions, cases)` — the same stable identity
 * `useQuizSession` wants, with no way for a page to compute it in the wrong place. Both keys
 * must be module-scope constants: an inline literal would miss the cache every render and hand
 * the session a new array identity each time, which is exactly the rebuild this exists to
 * prevent. Entries vanish with their module's chunk, so nothing here outlives its page.
 */
const unclaimedCache = new WeakMap<
  readonly { id: string }[],
  WeakMap<readonly { questionIds?: readonly string[] }[], readonly { id: string }[]>
>();

function getUnclaimed<TQuestion extends { id: string }>(
  questions: readonly TQuestion[],
  cases: readonly { questionIds?: readonly string[] }[],
): readonly TQuestion[] {
  let byCases = unclaimedCache.get(questions);
  if (!byCases) {
    byCases = new WeakMap();
    unclaimedCache.set(questions, byCases);
  }
  const hit = byCases.get(cases) as readonly TQuestion[] | undefined;
  if (hit) return hit;
  const computed = unclaimedQuestions(questions, cases);
  byCases.set(cases, computed);
  return computed;
}

export function useModuleCases<TInputs, TPreset extends string, TSnapshot>(
  options: ModuleCasesOptions<TInputs, TPreset, TSnapshot>,
): ModuleCases<TInputs, TPreset, TSnapshot> {
  const {
    moduleId,
    patient,
    cases,
    questions: allQuestions,
    presets,
    defaultInputs,
    inputs,
    setInputs,
    captureBaseline,
    clearBaseline,
    resetEngine,
    perturbEngine,
    fastForwardEngine,
    shareLink,
    snapshot,
    transport,
    baselineFrozen,
    presetLabels,
    presetGloss,
    store,
  } = options;

  // Declared before the session exists because `useModuleTab` needs to be able to end one, and
  // it has to run BEFORE `useModulePractice` — which consumes `questions`, which depends on the
  // tab. The ref is what makes that ordering legal; it is filled in below.
  const exitRef = useRef<() => void>(() => {});
  const [tab, setTab] = useModuleTab(patient, () => exitRef.current());

  const unclaimed = getUnclaimed(allQuestions, cases);

  // What the active tab runs. The lab and the bedside deliberately produce the SAME array, so
  // glancing at the diagram mid-question never rebuilds the queue; crossing to Questions swaps
  // the set, and `useModuleTab` ends the session when the arrival carries a different one.
  // While a session is live `useModulePractice` holds the array it started on regardless.
  //
  // The empty fallback is required rather than tidy: with the old "All questions" entry gone, a
  // Patients tab with no bed chosen must not silently become the whole module.
  const tabQuestions = useMemo(
    () =>
      tab === 'questions'
        ? unclaimed
        : patient?.questionIds
          ? allQuestions.filter((question) => patient.questionIds!.includes(question.id))
          : [],
    [tab, patient, unclaimed, allQuestions],
  );

  const { session, summary } = useModulePractice({
    moduleId,
    questions: tabQuestions,
    presets,
    inputs,
    defaultInputs,
    setInputs,
    captureBaseline,
    clearBaseline,
    resetEngine,
    perturbEngine,
    fastForwardEngine,
    store,
  });

  const applyScenario = useScenarioPreset({
    setInputs,
    defaults: defaultInputs,
    presets,
    resetEngine,
  });

  // Ending the session on a bed change is not tidiness: the queue holds question IDS, so
  // rebuilding the list under a live session leaves the cursor pointing at nothing and the
  // panel renders blank while the phase still says a question is open. The tab strip is the
  // other door onto the same hazard — see `useModuleTab`.
  exitRef.current = session.exit;
  const bedside = useBedside(patient, applyScenario, () => exitRef.current());
  const caseShareLink = useCaseShareLink(shareLink, patient?.id ?? null);

  // Depends on the callback, not on `bedside`, which is a fresh object literal every render —
  // an effect keyed on the object would re-fire at frame rate.
  // Gated on the tab: a `?case=` left in the URL keeps `patient` non-null on the Questions tab,
  // so without this, finishing a set that has nothing to do with the bedside would jump the
  // engine to that patient's physiology.
  useReturnToBedsideOnComplete(tab === 'clinic' ? session.phase : 'idle', bedside.returnToBedside);

  const sessionActive = session.phase === 'predicting' || session.phase === 'revealed';

  // Who is either side of this patient on the round, so the bedside can be walked rather than
  // returned to. Keyed on the patient's id, so it re-resolves when the bed changes under a
  // route that did not.
  const walk = useRoundWalk(patient?.id ?? null);

  return {
    session,
    summary,
    applyPreset: bedside.apply,
    shareLink: caseShareLink,
    page: {
      activeTab: tab,
      onTabChange: setTab,
      // On every tab, unlike `caseHeader`: "Start round" lands on the Patients tab, so a walk
      // that only rendered on Lab was missing from the one tab the round actually opens.
      roundWalk: patient ? <RoundWalkBar walk={walk} /> : null,
      caseHeader: patient ? (
        <CaseHeader
          patient={patient}
          activePreset={bedside.activePreset}
          onReturn={bedside.returnToBedside}
          playing={transport.playing}
          baselineFrozen={baselineFrozen}
        />
      ) : null,
      clinic: (
        <ClinicPanel
          cases={cases}
          patient={patient}
          snapshot={snapshot}
          schedule={summary.schedule}
          sessionActive={sessionActive}
          sessionComplete={session.phase === 'complete'}
        >
          {/* Gated on the tab, and this is the fix for a real fault rather than a tidy-up.
              QuizPanel installs a WINDOW keydown listener while a question is open, and the
              sections are hidden rather than unmounted — so a second panel on the Questions tab
              would answer the same keypress, and one `session` would `commit` twice, writing
              twice into the persisted review ladder. Exactly one may be mounted. */}
          {tab === 'clinic' && tabQuestions.length > 0 ? (
            <QuizPanel
              session={session}
              summary={summary}
              presetLabels={presetLabels}
              presetGloss={presetGloss}
            />
          ) : null}
        </ClinicPanel>
      ),
      questions: (
        <QuestionSet
          count={unclaimed.length}
          beds={cases}
          schedule={summary.schedule}
          snapshot={snapshot}
          question={session.question}
        >
          {tab === 'questions' ? (
            <QuizPanel
              session={session}
              summary={summary}
              presetLabels={presetLabels}
              presetGloss={presetGloss}
            />
          ) : null}
        </QuestionSet>
      ),
    },
  };
}
