import { useCallback, useMemo, useRef, useState } from 'react';
import { correctAnswerOf, isPatternQuestion, type ModuleQuestion, type StateOf } from './types';
import type { ProgressStore } from './progressStore';

export type QuizPhase = 'idle' | 'predicting' | 'revealed' | 'complete';

/**
 * Practice walks the whole module in authoring order; review walks only what has fallen due,
 * most overdue first. The distinction matters to the learner, so the panel says which one they
 * are in rather than presenting two identical-looking sessions.
 */
export type QuizMode = 'practice' | 'review';

export interface QuizSession<TInputs, TPreset extends string, TSnapshot> {
  phase: QuizPhase;
  mode: QuizMode;
  question: ModuleQuestion<TInputs, TPreset, TSnapshot> | null;
  /** 1-based, for "Question 2 of 3". */
  index: number;
  total: number;
  /** What the learner committed to, once they have — a direction, or a scenario id. */
  answer: string | null;
  /** True while a pattern question is unanswered: the controls must stay hidden, or the
   * scenario is legible from the slider positions and there is nothing left to work out. */
  blinded: boolean;
  correct: boolean | null;
  /** Correct answers this session. */
  score: number;
  /** How many questions are due for review right now. Zero hides the review affordance
   * entirely rather than offering a button that opens an empty session. */
  dueCount: number;
  start: () => void;
  /** Runs only the due questions. A no-op when nothing is due. */
  startReview: () => void;
  commit: (answer: string) => void;
  next: () => void;
  exit: () => void;
}

interface QuizSessionOptions<TInputs, TPreset extends string, TSnapshot> {
  moduleId: string;
  questions: readonly ModuleQuestion<TInputs, TPreset, TSnapshot>[];
  /**
   * Applies a question's setup or intervention to the page's live inputs.
   *
   * `fromDefaults` rebuilds from the module's baseline rather than merging onto what is on
   * screen. Question SETUPS use it, because the verification harness settles from defaults and
   * anything else means the learner is shown a scenario nobody checked; INTERVENTIONS do not,
   * because they are applied on top of the setup they follow.
   */
  applyInputs: (patch: Partial<TInputs>, preset?: TPreset, fromDefaults?: boolean) => void;
  /** Freezes the trace at the moment of commitment, so the prediction is watched as a
   * divergence from where the model was rather than as an unanchored wiggle. */
  captureBaseline: () => void;
  clearBaseline: () => void;
  /** Returns the engine to its initial state. Called before every question so what the learner
   * sees matches what the verification harness ran: both start from `createInitialState`. Without
   * it a question inherits the previous one's state, and a panel verified as unambiguous can
   * appear contaminated. */
  resetEngine: () => void;
  /** Applies a question's one-off event to the engine state. */
  perturbEngine: (fn: (state: StateOf<TSnapshot>) => StateOf<TSnapshot>) => void;
  /** Integrates simulated time immediately, so a settled scenario can be shown at once. */
  fastForwardEngine: (seconds: number) => void;
  store: ProgressStore;
}

/**
 * Drives the predict-then-run loop: establish a scenario, ask for a commitment, then apply
 * the intervention and let the learner watch their prediction be right or wrong.
 *
 * Committing BEFORE seeing the outcome is the whole point — it is what separates this from
 * watching an animation, and it is the part a video course cannot copy.
 */
export function useQuizSession<TInputs, TPreset extends string, TSnapshot>({
  moduleId,
  questions,
  applyInputs,
  captureBaseline,
  clearBaseline,
  resetEngine,
  perturbEngine,
  fastForwardEngine,
  store,
}: QuizSessionOptions<TInputs, TPreset, TSnapshot>): QuizSession<TInputs, TPreset, TSnapshot> {
  const [phase, setPhase] = useState<QuizPhase>('idle');
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [mode, setMode] = useState<QuizMode>('practice');
  /**
   * The question ids this run will walk, in order.
   *
   * A session is a QUEUE rather than a walk of the whole array, because review runs a subset in
   * due-date order. Holding the ids rather than the questions keeps it stable if the module's
   * question list is rebuilt between renders.
   */
  const [queue, setQueue] = useState<readonly string[]>([]);

  // Read through a ref so a changing callback identity never restarts a session.
  const applyRef = useRef(applyInputs);
  applyRef.current = applyInputs;

  const questionIds = useMemo(() => questions.map((q) => q.id), [questions]);
  const dueCount = store.due(moduleId, questionIds).length;

  const byId = useCallback(
    (id: string | undefined) => (id === undefined ? undefined : questions.find((q) => q.id === id)),
    [questions],
  );

  const question = phase === 'idle' || phase === 'complete' ? null : (byId(queue[index]) ?? null);

  const load = useCallback(
    (at: number, from: readonly string[]) => {
      const next = byId(from[at]);
      if (!next) {
        setPhase('complete');
        return;
      }
      clearBaseline();
      resetEngine();
      if (isPatternQuestion(next)) {
        applyRef.current({}, next.answer, true);
        // Same setup event the verification harness runs, so what the learner sees is what the
        // fairness check checked.
        if (next.setup?.perturb) perturbEngine(next.setup.perturb);
        // ...and the same settling. The fairness check reads a settled engine; without this the
        // learner is shown an unsettled transient and asked to name a disorder that has not
        // developed yet, which at some modules' time scales would take minutes of waiting.
        if (next.settleSeconds) fastForwardEngine(next.settleSeconds);
      } else {
        applyRef.current(next.setup.inputs ?? {}, next.setup.preset, true);
        if (next.setup.perturb) perturbEngine(next.setup.perturb);
      }
      setIndex(at);
      setAnswer(null);
      setPhase('predicting');
    },
    [byId, clearBaseline, resetEngine, perturbEngine, fastForwardEngine],
  );

  const begin = useCallback(
    (nextQueue: readonly string[], nextMode: QuizMode) => {
      if (nextQueue.length === 0) return;
      setScore(0);
      setMode(nextMode);
      setQueue(nextQueue);
      load(0, nextQueue);
    },
    [load],
  );

  const start = useCallback(() => begin(questionIds, 'practice'), [begin, questionIds]);

  /**
   * Review runs what is due, most overdue first.
   *
   * The queue is fixed when the session opens rather than recomputed per question. Without
   * that, answering a question wrong — which makes it due immediately — would put it straight
   * back into the same queue and the session could never end.
   */
  const startReview = useCallback(
    () => begin(store.due(moduleId, questionIds), 'review'),
    [begin, store, moduleId, questionIds],
  );

  const commit = useCallback(
    (choice: string) => {
      const current = byId(queue[index]);
      if (!current) return;

      const isCorrect = choice === correctAnswerOf(current);
      setAnswer(choice);
      setScore((s) => s + (isCorrect ? 1 : 0));
      store.record(moduleId, current.id, isCorrect);

      // A pattern question has nothing to apply — the scenario is already running, and the
      // reveal is simply un-hiding the controls that produced it.
      if (!isPatternQuestion(current)) {
        // Freeze first, THEN intervene, so the frozen trace is the pre-intervention state.
        captureBaseline();
        if (current.intervention.inputs) applyRef.current(current.intervention.inputs);
        if (current.intervention.perturb) perturbEngine(current.intervention.perturb);
      }
      setPhase('revealed');
    },
    [byId, queue, index, store, moduleId, captureBaseline, perturbEngine],
  );

  const next = useCallback(() => load(index + 1, queue), [load, index, queue]);

  const exit = useCallback(() => {
    clearBaseline();
    setPhase('idle');
    setAnswer(null);
  }, [clearBaseline]);

  const correct = useMemo(
    () => (answer === null || !question ? null : answer === correctAnswerOf(question)),
    [answer, question],
  );

  return {
    phase,
    question,
    blinded: phase === 'predicting' && question !== null && isPatternQuestion(question),
    index: index + 1,
    total: queue.length,
    answer,
    correct,
    score,
    mode,
    dueCount,
    start,
    startReview,
    commit,
    next,
    exit,
  };
}
