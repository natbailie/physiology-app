// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, useState } from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { useModuleCases } from './useModuleCases';
import type { ModuleCases } from './useModuleCases';
import { useModuleCase } from './useModuleCase';
import type { ModuleCase } from '@/shared/cases/types';
import type { ModuleQuestion, PatternQuestion, PredictQuestion } from '@/shared/assessment/types';
import type { ProgressStore } from '@/shared/assessment/progressStore';

afterEach(cleanup);

type Inputs = { dial: number };
type Preset = 'normal' | 'alpha';
interface Snap {
  value: number;
}

const BED_Q: PatternQuestion<Preset, Snap> = {
  id: 'bed-q',
  stem: 'A panel pointing at alpha.',
  answer: 'alpha',
  options: ['normal', 'alpha'],
  panel: [{ label: 'Marker', value: (s) => s.value }],
  explanation: 'The characteristic combination is what identifies it, as described at length here.',
};

const BED_Q2: PatternQuestion<Preset, Snap> = {
  id: 'bed-q2',
  stem: 'A panel pointing at normal.',
  answer: 'normal',
  options: ['normal', 'alpha'],
  panel: [{ label: 'Marker', value: (s) => s.value }],
  explanation: 'The characteristic combination is what identifies it, as described at length here.',
};

const FREE_Q: PredictQuestion<Inputs, Preset, Snap> = {
  id: 'free-q',
  stem: 'Something instructive is going on.',
  setup: {},
  intervention: { label: 'You do the thing.', inputs: { dial: 9 } },
  prompt: 'What happens to the marker?',
  watch: 'the marker',
  correctDirection: 'rises',
  explanation: 'It rises because of the mechanism, as described at length here.',
  metric: (s) => s.value,
};

const QUESTIONS: readonly ModuleQuestion<Inputs, Preset, Snap>[] = [BED_Q, BED_Q2, FREE_Q];

function bed(
  id: string,
  name: string,
  preset: Preset,
  questionIds: readonly string[],
): ModuleCase<Preset, Snap> {
  return {
    id,
    name,
    age: 40,
    bed: 'A01',
    oneLiner: 'A presenting complaint, not a diagnosis, under eighty characters.',
    presentation: 'What a colleague would tell you on the way to the bed.',
    preset,
    chart: [{ label: 'Marker', value: (s) => s.value }],
    task: 'Work out what is going on, in one sentence, never the answer.',
    teaching: 'The payoff, in the voice of a question explanation, at sufficient length here.',
    questionIds,
  };
}

const CASES: readonly ModuleCase<Preset, Snap>[] = [
  bed('bed-a', 'Ann', 'alpha', ['bed-q']),
  bed('bed-b', 'Bob', 'normal', ['bed-q2']),
];

const PRESETS: Record<Preset, Partial<Inputs>> = { normal: { dial: 0 }, alpha: { dial: 5 } };
const LABELS: Record<Preset, string> = { normal: 'Normal', alpha: 'Alpha disease' };
const SNAPSHOT: Snap = { value: 7 };

const STORE: ProgressStore = {
  record: vi.fn(),
  summary: () => ({ attempted: 0, correct: 0, lastOutcome: {}, schedule: {} }),
  allSummaries: () => ({}),
  due: (_moduleId, ids) => [...ids],
  streak: () => 0,
  reset: () => {},
};

const noop = () => {};

function Harness({ api }: { api: { current: ModuleCases<Inputs, Preset, Snap> | null } }) {
  // Exactly what a bedded page does: its own case subscription for the input seed, then the
  // hook for everything downstream of the engine.
  const patient = useModuleCase(CASES);
  const [inputs, setInputsState] = useState<Inputs>({ dial: 0 });
  const setInputs: typeof setInputsState = (action) => {
    applied.push(action);
    return setInputsState(action);
  };
  const result = useModuleCases<Inputs, Preset, Snap>({
    moduleId: 'test-module',
    patient,
    cases: CASES,
    questions: QUESTIONS,
    presets: PRESETS,
    defaultInputs: { dial: 0 },
    inputs,
    setInputs,
    captureBaseline: noop,
    clearBaseline: noop,
    resetEngine: noop,
    perturbEngine: noop,
    fastForwardEngine: noop,
    shareLink: () => '#test-module',
    snapshot: SNAPSHOT,
    transport: { playing: true },
    baselineFrozen: false,
    presetLabels: LABELS,
    store: STORE,
  });
  api.current = result;
  return (
    <>
      {result.page.caseHeader}
      {result.page.clinic}
      {result.page.questions}
    </>
  );
}

// Every setInputs call the hook's wiring makes, so the drop-ins can be shown to call through.
let applied: unknown[];

function show() {
  const api: { current: ModuleCases<Inputs, Preset, Snap> | null } = { current: null };
  applied = [];
  const view = render(<Harness api={api} />);
  return { api: () => api.current!, rerender: () => view.rerender(<Harness api={api} />) };
}

/** Flushes the microtask useModuleTab defers the session end onto. */
const settle = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

function go(hash: string) {
  act(() => {
    window.location.hash = hash;
    window.dispatchEvent(new Event('hashchange'));
  });
}

function panels() {
  return screen.queryAllByLabelText('Practice question');
}

beforeEach(() => {
  window.location.hash = '#test-module';
});

describe('useModuleCases', () => {
  it('opens on the bed with its picker, banner, panel rows and a single mounted panel', () => {
    go('#test-module?case=bed-a');
    const h = show();
    act(() => h.api().session.start());

    expect(h.api().page.activeTab).toBe('clinic');
    expect(screen.getByRole('link', { name: /Ann, 40/ })).toBeDefined();
    expect(screen.getByRole('link', { name: /Bob, 40/ })).toBeDefined();
    expect(screen.getByLabelText('Bedside: Ann')).toBeDefined();
    // The bedside chart reads the live snapshot — here to the default one decimal.
    expect(within(screen.getByLabelText('Patients')).getByText('7.0')).toBeDefined();
    expect(h.api().session.question).toBe(BED_Q);
    // Exactly one QuizPanel mounted: the clinic's. The questions one's gate holds it back.
    expect(panels()).toHaveLength(1);
  });

  it('runs the unclaimed set on the Questions tab', () => {
    const h = show();
    act(() => h.api().page.onTabChange('questions'));
    act(() => h.api().session.start());

    // Both beds claimed their questions, so one is left — the mechanism drill.
    expect(screen.getByText(/the one question in this module/i)).toBeDefined();
    expect(h.api().session.question).toBe(FREE_Q);
    expect(panels()).toHaveLength(1);
  });

  it('ends the session arriving at the Questions tab carrying a bedside set', async () => {
    go('#test-module?case=bed-a');
    const h = show();
    act(() => h.api().session.start());
    expect(h.api().session.phase).toBe('predicting');

    act(() => h.api().page.onTabChange('questions'));
    await settle();
    expect(h.api().session.phase).toBe('idle');
    expect(h.api().session.question).toBeNull();
  });

  it('keeps the session across a lab glance, with the question still resolving', async () => {
    go('#test-module?case=bed-a');
    const h = show();
    act(() => h.api().session.start());

    // No panel is mounted on the lab, but the session underneath survives the detour.
    act(() => h.api().page.onTabChange('lab'));
    await settle();
    expect(h.api().session.phase).toBe('predicting');
    expect(h.api().session.question).toBe(BED_Q);
    expect(h.api().session.blinded).toBe(true);
    expect(panels()).toHaveLength(0);

    // And the return picks up the same question — same element, not a rebuilt facsimile.
    act(() => h.api().page.onTabChange('clinic'));
    await settle();
    expect(h.api().session.question).toBe(BED_Q);
    expect(panels()).toHaveLength(1);
  });

  it('keeps the unclaimed set stable across rerenders mid-session', () => {
    const h = show();
    act(() => h.api().page.onTabChange('questions'));
    act(() => h.api().session.start());
    h.rerender();
    h.rerender();
    expect(h.api().session.phase).toBe('predicting');
    expect(h.api().session.question).toBe(FREE_Q);
  });

  it('ends the session when the bed changes under it', async () => {
    go('#test-module?case=bed-a');
    const h = show();
    act(() => h.api().session.start());
    expect(h.api().session.phase).toBe('predicting');

    go('#test-module?case=bed-b');
    await settle();
    expect(h.api().session.phase).toBe('idle');
    expect(screen.getByLabelText('Bedside: Bob')).toBeDefined();
  });

  it('applies presets through the bedside and shares links that keep the case', () => {
    go('#test-module?case=bed-a');
    const h = show();

    act(() => h.api().applyPreset('alpha'));
    expect(applied.at(-1)).toEqual({ dial: 5 });
    expect(h.api().shareLink()).toBe('#test-module?case=bed-a');
  });

  it('shows no banner without a bed, and the clinic asks for one', () => {
    show();
    expect(screen.queryByLabelText(/Bedside:/)).toBeNull();
    expect(screen.getByText(/Choose a patient/)).toBeDefined();
  });
});
