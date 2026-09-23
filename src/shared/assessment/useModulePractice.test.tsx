// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useModulePractice } from './useModulePractice';
import type { QuizSession } from './useQuizSession';
import type { ModuleQuestion, PatternQuestion } from './types';
import type { ProgressStore } from './progressStore';

afterEach(() => {
  act(() => unmount?.());
  unmount = null;
});

let unmount: (() => void) | null = null;

type Inputs = { dial: number };
type Preset = 'normal' | 'alpha';
type Snapshot = { value: number };

const PATTERN: PatternQuestion<Preset, Snapshot> = {
  id: 'p1',
  stem: 'A panel pointing at alpha.',
  answer: 'alpha',
  options: ['normal', 'alpha'],
  panel: [{ label: 'Marker', value: (s) => s.value }],
  explanation: 'The characteristic combination is what identifies it, as described at length here.',
};

const OTHER: PatternQuestion<Preset, Snapshot> = {
  id: 'p2',
  stem: 'A panel pointing at normal.',
  answer: 'normal',
  options: ['normal', 'alpha'],
  panel: [{ label: 'Marker', value: (s) => s.value }],
  explanation: 'The characteristic combination is what identifies it, as described at length here.',
};

const PRESETS: Record<Preset, Partial<Inputs>> = { normal: { dial: 0 }, alpha: { dial: 5 } };

const STORE: ProgressStore = {
  record: vi.fn(),
  summary: () => ({ attempted: 0, correct: 0, lastOutcome: {}, schedule: {} }),
  allSummaries: () => ({}),
  due: (_moduleId, ids) => [...ids],
  streak: () => 0,
  reset: () => {},
};

function Harness({
  questions,
  api,
}: {
  questions: readonly ModuleQuestion<Inputs, Preset, Snapshot>[];
  api: { current: QuizSession<Inputs, Preset, Snapshot> | null };
}) {
  const [inputs, setInputs] = useState<Inputs>({ dial: 0 });
  const { session } = useModulePractice({
    moduleId: 'test-module',
    questions,
    presets: PRESETS,
    inputs,
    defaultInputs: { dial: 0 },
    setInputs,
    captureBaseline: () => {},
    clearBaseline: () => {},
    resetEngine: () => {},
    perturbEngine: () => {},
    fastForwardEngine: () => {},
    store: STORE,
  });
  api.current = session;
  return null;
}

function mount(initial: readonly ModuleQuestion<Inputs, Preset, Snapshot>[]) {
  const host = document.createElement('div');
  const root = createRoot(host);
  const api: { current: QuizSession<Inputs, Preset, Snapshot> | null } = { current: null };
  act(() => root.render(<Harness questions={initial} api={api} />));
  unmount = () => root.unmount();
  return {
    session: () => api.current!,
    show: (next: readonly ModuleQuestion<Inputs, Preset, Snapshot>[]) =>
      act(() => root.render(<Harness questions={next} api={api} />)),
  };
}

describe('useModulePractice question stability', () => {
  /**
   * A bedded page derives its array from the tab. Without the hold, a glance at the lab
   * mid-pattern-question rebuilds the list under the live session: the cursor dangles, and —
   * worse — `blinded` lapses, re-enabling the preset bar and the controls while the scenario
   * being asked about can still be silently replaced.
   */
  it('keeps the live session’s question resolving after the array is swapped out', () => {
    const h = mount([PATTERN]);
    act(() => h.session().start());
    expect(h.session().question?.id).toBe('p1');

    h.show([]);
    expect(h.session().phase).toBe('predicting');
    expect(h.session().question?.id).toBe('p1');
    expect(h.session().blinded).toBe(true);
  });

  it('adopts the new set once the session is over', () => {
    const h = mount([PATTERN]);
    act(() => h.session().start());
    h.show([]);
    act(() => h.session().exit());
    h.show([OTHER]);

    act(() => h.session().start());
    expect(h.session().question?.id).toBe('p2');
  });
});
