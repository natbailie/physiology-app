import { useCallback, useMemo, useRef, useState } from 'react';
import { correctAnswerOf, isPatternQuestion, type ModuleQuestion, type StateOf } from './types';
import type { ProgressStore } from './progressStore';

export type QuizPhase = 'idle' | 'predicting' | 'revealed' | 'complete';

export interface QuizSession<TInputs, TPreset extends string, TSnapshot> {
  phase: QuizPhase;
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
  start: () => void;
  commit: (answer: string) => void;
  next: () => void;
  exit: () => void;
}

interface QuizSessionOptions<TInputs, TPreset extends string, TSnapshot> {
  moduleId: string;
  questions: readonly ModuleQuestion<TInputs, TPreset, TSnapshot>[];
  /** Applies a question's setup or intervention to the page's live inputs. */
  applyInputs: (patch: Partial<TInputs>, preset?: TPreset) => void;
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
  store,
}: QuizSessionOptions<TInputs, TPreset, TSnapshot>): QuizSession<TInputs, TPreset, TSnapshot> {
  const [phase, setPhase] = useState<QuizPhase>('idle');
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  // Read through a ref so a changing callback identity never restarts a session.
  const applyRef = useRef(applyInputs);
  applyRef.current = applyInputs;

  const question = phase === 'idle' || phase === 'complete' ? null : (questions[index] ?? null);

  const load = useCallback(
    (at: number) => {
      const next = questions[at];
      if (!next) {
        setPhase('complete');
        return;
      }
      clearBaseline();
      resetEngine();
      if (isPatternQuestion(next)) {
        applyRef.current({}, next.answer);
      } else {
        applyRef.current(next.setup.inputs ?? {}, next.setup.preset);
        if (next.setup.perturb) perturbEngine(next.setup.perturb);
      }
      setIndex(at);
      setAnswer(null);
      setPhase('predicting');
    },
    [questions, clearBaseline, resetEngine, perturbEngine],
  );

  const start = useCallback(() => {
    setScore(0);
    load(0);
  }, [load]);

  const commit = useCallback(
    (choice: string) => {
      const current = questions[index];
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
    [questions, index, store, moduleId, captureBaseline, perturbEngine],
  );

  const next = useCallback(() => load(index + 1), [load, index]);

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
    total: questions.length,
    answer,
    correct,
    score,
    start,
    commit,
    next,
    exit,
  };
}
