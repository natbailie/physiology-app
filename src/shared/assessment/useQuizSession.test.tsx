// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { useQuizSession } from './useQuizSession';
import { createMemoryProgressStore } from './progressStore';
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

function setup() {
  const applyInputs = vi.fn();
  const captureBaseline = vi.fn();
  const clearBaseline = vi.fn();
  const store = createMemoryProgressStore();

  const hook = renderHook(() =>
    useQuizSession({
      moduleId: 'test',
      questions: QUESTIONS,
      applyInputs,
      captureBaseline,
      clearBaseline,
      store,
    }),
  );

  return { ...hook, applyInputs, captureBaseline, clearBaseline, store };
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
    expect(applyInputs).toHaveBeenCalledWith({ dial: 1 }, 'normal');
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
