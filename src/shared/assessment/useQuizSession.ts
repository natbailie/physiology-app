import { useCallback, useMemo, useRef, useState } from 'react';
import type { Direction, PredictQuestion } from './types';
import type { ProgressStore } from './progressStore';

export type QuizPhase = 'idle' | 'predicting' | 'revealed' | 'complete';

export interface QuizSession<TInputs, TPreset extends string, TSnapshot> {
  phase: QuizPhase;
  question: PredictQuestion<TInputs, TPreset, TSnapshot> | null;
  /** 1-based, for "Question 2 of 3". */
  index: number;
  total: number;
  /** What the learner committed to, once they have. */
  answer: Direction | null;
  correct: boolean | null;
  /** Correct answers this session. */
  score: number;
  start: () => void;
  commit: (answer: Direction) => void;
  next: () => void;
  exit: () => void;
}

interface QuizSessionOptions<TInputs, TPreset extends string, TSnapshot> {
  moduleId: string;
  questions: readonly PredictQuestion<TInputs, TPreset, TSnapshot>[];
  /** Applies a question's setup or intervention to the page's live inputs. */
  applyInputs: (patch: Partial<TInputs>, preset?: TPreset) => void;
  /** Freezes the trace at the moment of commitment, so the prediction is watched as a
   * divergence from where the model was rather than as an unanchored wiggle. */
  captureBaseline: () => void;
  clearBaseline: () => void;
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
  store,
}: QuizSessionOptions<TInputs, TPreset, TSnapshot>): QuizSession<TInputs, TPreset, TSnapshot> {
  const [phase, setPhase] = useState<QuizPhase>('idle');
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Direction | null>(null);
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
      applyRef.current(next.setup.inputs ?? {}, next.setup.preset);
      setIndex(at);
      setAnswer(null);
      setPhase('predicting');
    },
    [questions, clearBaseline],
  );

  const start = useCallback(() => {
    setScore(0);
    load(0);
  }, [load]);

  const commit = useCallback(
    (choice: Direction) => {
      const current = questions[index];
      if (!current) return;

      const isCorrect = choice === current.correctDirection;
      setAnswer(choice);
      setScore((s) => s + (isCorrect ? 1 : 0));
      store.record(moduleId, current.id, isCorrect);

      // Freeze first, THEN intervene, so the frozen trace is the pre-intervention state.
      captureBaseline();
      applyRef.current(current.intervention.inputs);
      setPhase('revealed');
    },
    [questions, index, store, moduleId, captureBaseline],
  );

  const next = useCallback(() => load(index + 1), [load, index]);

  const exit = useCallback(() => {
    clearBaseline();
    setPhase('idle');
    setAnswer(null);
  }, [clearBaseline]);

  const correct = useMemo(
    () => (answer === null || !question ? null : answer === question.correctDirection),
    [answer, question],
  );

  return {
    phase,
    question,
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
