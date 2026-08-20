// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { useQuizSession } from './useQuizSession';
import { createMemoryProgressStore } from './progressStore';
import { orderedOptions, type ModuleQuestion } from './types';

afterEach(cleanup);

interface Inputs {
  dial: number;
}
type Preset = 'normal' | 'alpha' | 'beta';
type Snapshot = { value: number };

const PATTERN: ModuleQuestion<Inputs, Preset, Snapshot> = {
  id: 'p1',
  stem: 'A patient with a panel that points somewhere specific.',
  answer: 'alpha',
  options: ['normal', 'alpha', 'beta'],
  panel: [
    { label: 'Marker', value: (s: Snapshot) => s.value },
    { label: 'Other', value: (s: Snapshot) => s.value * 2 },
    { label: 'Third', value: (s: Snapshot) => s.value * 3 },
  ],
  explanation: 'It is alpha because the marker behaves in the characteristic way described here.',
};

function setup(questions: ModuleQuestion<Inputs, Preset, Snapshot>[] = [PATTERN]) {
  const applyInputs = vi.fn();
  const captureBaseline = vi.fn();
  const clearBaseline = vi.fn();
  const resetEngine = vi.fn();
  const store = createMemoryProgressStore();

  const hook = renderHook(() =>
    useQuizSession({
      moduleId: 'test',
      questions,
      applyInputs,
      captureBaseline,
      clearBaseline,
      resetEngine,
      store,
    }),
  );
  return { ...hook, applyInputs, captureBaseline, clearBaseline, resetEngine, store };
}

describe('pattern-discrimination sessions', () => {
  it('loads the answer scenario so the learner sees its consequences', () => {
    const { result, applyInputs } = setup();
    act(() => result.current.start());

    expect(applyInputs).toHaveBeenCalledWith({}, 'alpha');
  });

  it('resets the engine before loading the scenario, so the panel is uncontaminated', () => {
    const { result, resetEngine, applyInputs } = setup();
    act(() => result.current.start());

    expect(resetEngine).toHaveBeenCalledOnce();
    const [resetOrder] = resetEngine.mock.invocationCallOrder;
    const [applyOrder] = applyInputs.mock.invocationCallOrder;
    expect(resetOrder!).toBeLessThan(applyOrder!);
  });

  it('blinds the controls while the question is open', () => {
    const { result } = setup();
    act(() => result.current.start());

    // Without this the slider positions give the scenario away and there is nothing to work out.
    expect(result.current.blinded).toBe(true);
  });

  it('un-blinds once answered, so the learner can inspect what produced the panel', () => {
    const { result } = setup();
    act(() => result.current.start());
    act(() => result.current.commit('alpha'));

    expect(result.current.blinded).toBe(false);
  });

  it('is never blinded when idle', () => {
    const { result } = setup();
    expect(result.current.blinded).toBe(false);
  });

  it('scores a correct scenario choice', () => {
    const { result, store } = setup();
    act(() => result.current.start());
    act(() => result.current.commit('alpha'));

    expect(result.current.correct).toBe(true);
    expect(store.summary('test')).toMatchObject({ attempted: 1, correct: 1 });
  });

  it('scores a wrong scenario choice', () => {
    const { result } = setup();
    act(() => result.current.start());
    act(() => result.current.commit('beta'));

    expect(result.current.correct).toBe(false);
    expect(result.current.score).toBe(0);
  });

  it('does not freeze a baseline or intervene — the scenario is already running', () => {
    const { result, captureBaseline, applyInputs } = setup();
    act(() => result.current.start());
    applyInputs.mockClear();

    act(() => result.current.commit('alpha'));

    expect(captureBaseline).not.toHaveBeenCalled();
    expect(applyInputs).not.toHaveBeenCalled();
  });
});

describe('option ordering', () => {
  it('is deterministic, so a question looks the same on every visit', () => {
    const a = orderedOptions('p1', ['normal', 'alpha', 'beta']);
    const b = orderedOptions('p1', ['normal', 'alpha', 'beta']);
    expect(a).toEqual(b);
  });

  it('keeps every option exactly once', () => {
    const ordered = orderedOptions('p1', ['normal', 'alpha', 'beta']);
    expect([...ordered].sort()).toEqual(['alpha', 'beta', 'normal']);
  });

  it('does not put the answer in the same slot for every question', () => {
    // Authoring order would otherwise leak the answer across a run of questions.
    const positions = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'].map((id) =>
      orderedOptions(id, ['normal', 'alpha', 'beta']).indexOf('alpha'),
    );
    expect(new Set(positions).size).toBeGreaterThan(1);
  });
});
