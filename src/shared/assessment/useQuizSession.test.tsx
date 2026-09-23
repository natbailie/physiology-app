// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { useQuizSession } from './useQuizSession';
import { createMemoryProgressStore, emptyProgress } from './progressStore';
import type { PredictQuestion } from './types';

afterEach(cleanup);

interface Inputs {
  dial: number;
}
type Preset = 'normal';
type Snapshot = { value: number };

const QUESTIONS: PredictQuestion<Inputs, Preset, Snapshot>[] = [
  {
    id: 'q1',
    stem: 'stem one',
    setup: { preset: 'normal', inputs: { dial: 1 } },
    intervention: { label: 'Turn it up.', inputs: { dial: 9 } },
    prompt: 'What happens?',
    watch: 'the dial',
    correctDirection: 'rises',
    explanation: 'because it goes up',
    metric: (s) => s.value,
  },
  {
    id: 'q2',
    stem: 'stem two',
    setup: {},
    intervention: { label: 'Turn it down.', inputs: { dial: 0 } },
    prompt: 'And now?',
    watch: 'the dial',
    correctDirection: 'falls',
    explanation: 'because it goes down',
    metric: (s) => s.value,
  },
];

function setup(now: () => number = () => Date.now()) {
  const applyInputs = vi.fn();
  const captureBaseline = vi.fn();
  const clearBaseline = vi.fn();
  const resetEngine = vi.fn();
  const perturbEngine = vi.fn();
  const fastForwardEngine = vi.fn();
  const store = createMemoryProgressStore(emptyProgress(), now);

  const hook = renderHook(() =>
    useQuizSession({
      moduleId: 'test',
      questions: QUESTIONS,
      applyInputs,
      captureBaseline,
      clearBaseline,
      resetEngine,
      perturbEngine,
      fastForwardEngine,
      store,
    }),
  );

  return { ...hook, applyInputs, captureBaseline, clearBaseline, resetEngine, perturbEngine, fastForwardEngine, store };
}

describe('useQuizSession', () => {
  it('starts idle with no question showing', () => {
    const { result } = setup();
    expect(result.current.phase).toBe('idle');
    expect(result.current.question).toBeNull();
  });

  it('applies the setup — preset included — when a question loads', () => {
    const { result, applyInputs } = setup();
    act(() => result.current.start());

    expect(result.current.phase).toBe('predicting');
    expect(result.current.question?.id).toBe('q1');
    // The third argument matters: a question's setup is rebuilt from the module's defaults
    // rather than merged onto whatever the previous question left, which is what the
    // verification harness does and therefore what the learner must be shown.
    expect(applyInputs).toHaveBeenCalledWith({ dial: 1 }, 'normal', true);
  });

  it('resets the engine BEFORE applying the setup, so questions cannot contaminate each other', () => {
    const { result, resetEngine, applyInputs } = setup();
    act(() => result.current.start());

    // The verification harness settles each question from createInitialState. If the app did
    // not do the same, a verified-unambiguous question could present differently to a learner.
    expect(resetEngine).toHaveBeenCalledOnce();
    const [resetOrder] = resetEngine.mock.invocationCallOrder;
    const [applyOrder] = applyInputs.mock.invocationCallOrder;
    expect(resetOrder).toBeDefined();
    expect(applyOrder).toBeDefined();
    expect(resetOrder!).toBeLessThan(applyOrder!);
  });

  it('resets again when advancing to the next question', () => {
    const { result, resetEngine } = setup();
    act(() => result.current.start());
    act(() => result.current.commit('rises'));
    resetEngine.mockClear();

    act(() => result.current.next());
    expect(resetEngine).toHaveBeenCalledOnce();
  });

  it('does not reveal the answer before the learner commits', () => {
    const { result } = setup();
    act(() => result.current.start());

    expect(result.current.answer).toBeNull();
    expect(result.current.correct).toBeNull();
  });

  it('freezes the baseline BEFORE applying the intervention', () => {
    const { result, captureBaseline, applyInputs } = setup();
    act(() => result.current.start());
    applyInputs.mockClear();

    act(() => result.current.commit('rises'));

    // The frozen trace must be the pre-intervention state, or the comparison is meaningless.
    expect(captureBaseline).toHaveBeenCalledOnce();
    const [captureOrder] = captureBaseline.mock.invocationCallOrder;
    const [applyOrder] = applyInputs.mock.invocationCallOrder;
    expect(captureOrder).toBeDefined();
    expect(applyOrder).toBeDefined();
    expect(captureOrder!).toBeLessThan(applyOrder!);
    expect(applyInputs).toHaveBeenCalledWith({ dial: 9 });
  });

  it('fires a question\'s perturbation on commit, after the baseline is frozen', () => {
    const perturbed: string[] = [];
    const question: PredictQuestion<Inputs, Preset, Snapshot> = {
      ...QUESTIONS[0]!,
      id: 'perturbing',
      intervention: {
        label: 'An event happens.',
        perturb: (state) => {
          perturbed.push('called');
          return state;
        },
      },
    };
    const applyInputs = vi.fn();
    const captureBaseline = vi.fn();
    const perturbEngine = vi.fn((fn: (s: Snapshot['value'] extends never ? never : never) => never) => {
      void fn;
    });

    const { result } = renderHook(() =>
      useQuizSession({
        moduleId: 'test',
        questions: [question],
        applyInputs,
        captureBaseline,
        clearBaseline: vi.fn(),
        resetEngine: vi.fn(),
        fastForwardEngine: vi.fn(),
        perturbEngine: perturbEngine as never,
        store: createMemoryProgressStore(),
      }),
    );

    act(() => result.current.start());
    act(() => result.current.commit('rises'));

    expect(perturbEngine).toHaveBeenCalledOnce();
    // An event-based question changes no settings, so applyInputs must not be called for it.
    expect(applyInputs).toHaveBeenCalledTimes(1); // setup only
    expect(captureBaseline.mock.invocationCallOrder[0]!).toBeLessThan(
      perturbEngine.mock.invocationCallOrder[0]!,
    );
  });

  it('scores a correct commit and records it', () => {
    const { result, store } = setup();
    act(() => result.current.start());
    act(() => result.current.commit('rises'));

    expect(result.current.phase).toBe('revealed');
    expect(result.current.correct).toBe(true);
    expect(result.current.score).toBe(1);
    expect(store.summary('test')).toMatchObject({ attempted: 1, correct: 1 });
  });

  it('scores a wrong commit without incrementing the score', () => {
    const { result, store } = setup();
    act(() => result.current.start());
    act(() => result.current.commit('falls'));

    expect(result.current.correct).toBe(false);
    expect(result.current.score).toBe(0);
    expect(store.summary('test')).toMatchObject({ attempted: 1, correct: 0 });
  });

  it('advances to the next question and clears the previous answer', () => {
    const { result } = setup();
    act(() => result.current.start());
    act(() => result.current.commit('rises'));
    act(() => result.current.next());

    expect(result.current.phase).toBe('predicting');
    expect(result.current.question?.id).toBe('q2');
    expect(result.current.answer).toBeNull();
    expect(result.current.index).toBe(2);
  });

  it('completes after the last question, keeping the score', () => {
    const { result } = setup();
    act(() => result.current.start());
    act(() => result.current.commit('rises'));
    act(() => result.current.next());
    act(() => result.current.commit('falls'));
    act(() => result.current.next());

    expect(result.current.phase).toBe('complete');
    expect(result.current.score).toBe(2);
    expect(result.current.question).toBeNull();
  });

  it('restarts with a fresh score', () => {
    const { result } = setup();
    act(() => result.current.start());
    act(() => result.current.commit('falls'));
    act(() => result.current.start());

    expect(result.current.score).toBe(0);
    expect(result.current.question?.id).toBe('q1');
  });

  it('clears the frozen baseline on exit so the module is left clean', () => {
    const { result, clearBaseline } = setup();
    act(() => result.current.start());
    act(() => result.current.commit('rises'));
    clearBaseline.mockClear();

    act(() => result.current.exit());
    expect(result.current.phase).toBe('idle');
    expect(clearBaseline).toHaveBeenCalledOnce();
  });
});

describe('the review queue', () => {
  const AT = new Date(2026, 7, 17, 12).getTime();

  it('offers nothing to review before anything has been answered', () => {
    const { result } = setup(() => AT);
    expect(result.current.dueCount).toBe(0);
  });

  it('does not open an empty session when nothing is due', () => {
    // The button is hidden in this state, but the guard belongs in the hook: a review session
    // with no questions would land straight on the "complete" screen having asked nothing.
    const { result } = setup(() => AT);
    act(() => result.current.startReview());
    expect(result.current.phase).toBe('idle');
  });

  it('makes a missed question due and leaves a correct one alone', () => {
    const { result } = setup(() => AT);
    act(() => result.current.start());
    act(() => result.current.commit('falls')); // q1 keys "rises" — wrong
    act(() => result.current.next());
    act(() => result.current.commit('falls')); // q2 keys "falls" — right
    act(() => result.current.next());

    expect(result.current.phase).toBe('complete');
    expect(result.current.dueCount).toBe(1);
  });

  it('runs only the due questions, and says it is reviewing', () => {
    const { result } = setup(() => AT);
    act(() => result.current.start());
    act(() => result.current.commit('falls')); // wrong
    act(() => result.current.next());
    act(() => result.current.commit('falls')); // right
    act(() => result.current.next());

    act(() => result.current.startReview());
    expect(result.current.mode).toBe('review');
    expect(result.current.total).toBe(1);
    expect(result.current.question?.id).toBe('q1');
  });

  it('ends a review session even when every answer is wrong again', () => {
    // The hazard this guards: a wrong answer becomes due immediately, so recomputing the queue
    // per question would feed it straight back and the session could never finish. The queue is
    // fixed when the session opens.
    const { result } = setup(() => AT);
    act(() => result.current.start());
    act(() => result.current.commit('falls'));
    act(() => result.current.next());
    act(() => result.current.commit('rises'));
    act(() => result.current.next());

    act(() => result.current.startReview());
    const reviewLength = result.current.total;
    expect(reviewLength).toBe(2);

    for (let i = 0; i < reviewLength; i += 1) {
      act(() => result.current.commit('unchanged'));
      act(() => result.current.next());
    }
    expect(result.current.phase).toBe('complete');
  });

  it('stops offering a question once its interval has passed without it falling due', () => {
    let now = AT;
    const { result } = setup(() => now);
    act(() => result.current.start());
    act(() => result.current.commit('rises')); // q1 correct — one day away
    act(() => result.current.next());
    act(() => result.current.commit('falls')); // q2 correct
    act(() => result.current.next());

    expect(result.current.dueCount).toBe(0);

    now = AT + 2 * 86_400_000;
    act(() => result.current.exit());
    expect(result.current.dueCount).toBe(2);
  });

  /**
   * Why the ward round ends a session when the bed changes.
   *
   * The queue holds question IDS, not questions, so narrowing `questions` under a live session
   * leaves the cursor pointing at an id that no longer resolves. Nothing throws: `question`
   * simply goes null while `phase` still says a question is open, and QuizPanel renders
   * nothing at all. `useBedside`'s `onBedChange` exists to stop the Patients tab reaching this
   * state — a blank panel mid-question looks like a crash and reads like one.
   */
  it('loses its question, but not its phase, if the question list narrows under it', () => {
    const store = createMemoryProgressStore(emptyProgress(), () => Date.now());
    const options = {
      moduleId: 'test',
      applyInputs: vi.fn(),
      captureBaseline: vi.fn(),
      clearBaseline: vi.fn(),
      resetEngine: vi.fn(),
      perturbEngine: vi.fn(),
      fastForwardEngine: vi.fn(),
      store,
    };
    const { result, rerender } = renderHook(
      ({ questions }) => useQuizSession({ ...options, questions }),
      { initialProps: { questions: QUESTIONS } },
    );

    act(() => result.current.start());
    act(() => result.current.next());
    expect(result.current.question?.id).toBe('q2');

    // The learner picks a different patient: the list is rebuilt without q2.
    rerender({ questions: QUESTIONS.filter((q) => q.id === 'q1') });

    expect(result.current.question).toBeNull();
    expect(result.current.phase).toBe('predicting');
  });
});
