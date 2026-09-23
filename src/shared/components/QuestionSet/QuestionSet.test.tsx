// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { QuestionSet } from './QuestionSet';
import type { ModuleCase } from '@/shared/cases/types';
import type { ModuleQuestion } from '@/shared/assessment/types';
import type { ReviewState } from '@/shared/assessment/scheduling';

afterEach(cleanup);

type Preset = 'normal' | 'alpha';
interface Snap {
  derived: { map: number; lactate: number };
}

const BED: ModuleCase<Preset, Snap> = {
  id: 'amina-trauma',
  name: 'Amina',
  age: 24,
  bed: 'A04',
  oneLiner: 'Motorcycle collision, cool peripheries',
  presentation: 'Brought in forty minutes after coming off a motorbike at speed.',
  preset: 'normal',
  chart: [{ label: 'MAP', value: (s) => s.derived.map, unit: 'mmHg', decimals: 0 }],
  task: 'Name the shock before anyone reaches for fluid.',
  teaching: 'Both filling pressures are empty and the resistance is up.',
  questionIds: ['bed-q'],
};

const SNAPSHOT: Snap = { derived: { map: 62, lactate: 4.23 } };

const PATTERN: ModuleQuestion<Record<string, never>, Preset, Snap> = {
  id: 'unclaimed-pattern',
  stem: 'A collapse with numbers that point one way.',
  answer: 'normal',
  options: ['normal', 'alpha'],
  panel: [
    { label: 'MAP', value: (s) => s.derived.map, unit: 'mmHg', decimals: 0 },
    { label: 'Lactate', value: (s) => s.derived.lactate, unit: 'mmol/L', decimals: 1 },
  ],
  explanation: 'The characteristic combination is what identifies it, as described at length here.',
};

const PREDICT: ModuleQuestion<{ dial: number }, Preset, Snap> = {
  id: 'unclaimed-predict',
  stem: 'Something instructive is going on.',
  setup: {},
  intervention: { label: 'You do the thing.', inputs: { dial: 9 } },
  prompt: 'What happens to MAP?',
  watch: 'MAP',
  correctDirection: 'rises',
  explanation: 'It rises because of the mechanism, as described at length here.',
  metric: (s) => s.derived.map,
};

function renderSet<TInputs>(
  question: ModuleQuestion<TInputs, Preset, Snap> | null,
  snapshot: Snap | null = SNAPSHOT,
) {
  return render(
    <QuestionSet
      count={2}
      beds={[BED]}
      schedule={{} as Record<string, ReviewState>}
      snapshot={snapshot}
      question={question}
    >
      <div data-testid="quiz" />
    </QuestionSet>,
  );
}

beforeEach(() => {
  window.location.hash = '#shockStates';
});

describe('QuestionSet instrument', () => {
  /** The Phase 0 gap: a pattern question used to show options with no numbers above them. */
  it('shows a pattern question’s own panel before commitment', () => {
    renderSet(PATTERN);
    expect(screen.getByText('MAP')).toBeDefined();
    expect(screen.getByText('Lactate')).toBeDefined();
    expect(screen.getByText('62')).toBeDefined();
    expect(screen.getByText('4.2')).toBeDefined();
  });

  it('renders the instrument above the questions, where “the numbers above” says it is', () => {
    renderSet(PATTERN);
    const instrument = screen.getByRole('group', { name: 'Observations for this question' });
    const quiz = screen.getByTestId('quiz');
    expect(instrument.compareDocumentPosition(quiz) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows a predict question’s live metric under its watch label', () => {
    renderSet(PREDICT);
    expect(screen.getByRole('group', { name: 'Live value of MAP' })).toBeDefined();
    expect(screen.getByText('62')).toBeDefined();
  });

  it('shows no instrument while no session is running, and the panel below still renders', () => {
    renderSet(null);
    expect(screen.queryByRole('group', { name: 'Observations for this question' })).toBeNull();
    expect(screen.getByTestId('quiz')).toBeDefined();
  });

  it('shows no instrument before the engine has produced a snapshot', () => {
    renderSet(PATTERN, null);
    expect(screen.queryByText('Lactate')).toBeNull();
    expect(screen.getByTestId('quiz')).toBeDefined();
  });
});
