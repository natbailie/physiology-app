// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ClinicPanel } from './ClinicPanel';
import type { ModuleCase } from '@/shared/cases/types';
import type { ReviewState } from '@/shared/assessment/scheduling';

afterEach(cleanup);

interface Snap {
  derived: { map: number; lactate: number };
}

const AMINA: ModuleCase<'haemorrhagic' | 'septic', Snap> = {
  id: 'amina-trauma',
  name: 'Amina',
  age: 24,
  bed: 'A04',
  oneLiner: 'Motorcycle collision, cool peripheries',
  presentation: 'Brought in forty minutes after coming off a motorbike at speed.'.repeat(3),
  preset: 'haemorrhagic',
  chart: [
    { label: 'MAP', value: (s) => s.derived.map, unit: 'mmHg', decimals: 0 },
    { label: 'Lactate', value: (s) => s.derived.lactate, unit: 'mmol/L', decimals: 1 },
  ],
  task: 'Name the shock before anyone reaches for fluid.',
  teaching: 'Both filling pressures are empty and the resistance is up.'.repeat(3),
};

const RUTH: ModuleCase<'haemorrhagic' | 'septic', Snap> = {
  ...AMINA,
  id: 'ruth-warm-shock',
  name: 'Ruth',
  age: 71,
  preset: 'septic',
  questionIds: ['high-svo2-with-lactate'],
};

const CASES = [AMINA, RUTH];
const SNAPSHOT: Snap = { derived: { map: 62, lactate: 4.23 } };

const props = {
  cases: CASES,
  snapshot: SNAPSHOT,
  schedule: {} as Record<string, ReviewState>,
  sessionActive: false,
  sessionComplete: false,
  children: <div data-testid="quiz" />,
};

beforeEach(() => {
  window.location.hash = '#shockStates?case=amina-trauma';
});

describe('ClinicPanel', () => {
  it('lists every bed', () => {
    render(<ClinicPanel {...props} patient={AMINA} />);
    expect(screen.getByRole('link', { name: /Amina, 24/ })).toBeDefined();
    expect(screen.getByRole('link', { name: /Ruth, 71/ })).toBeDefined();
  });

  /** Whole-module practice moved to its own Questions tab, which runs only what no bed claims. */
  it('no longer offers whole-module practice from the picker', () => {
    render(<ClinicPanel {...props} patient={AMINA} />);
    expect(screen.queryByRole('link', { name: /All questions/ })).toBeNull();
  });

  it('builds bed links that keep a shared scenario in the URL', () => {
    window.location.hash = '#shockStates?s=abc123&case=amina-trauma';
    render(<ClinicPanel {...props} patient={AMINA} />);
    const ruth = screen.getByRole('link', { name: /Ruth, 71/ });
    expect(ruth.getAttribute('href')).toBe('#shockStates?s=abc123&case=ruth-warm-shock');
  });

  it('shows the history, which had nowhere to render before this tab existed', () => {
    render(<ClinicPanel {...props} patient={AMINA} />);
    expect(screen.getByText(AMINA.presentation)).toBeDefined();
    expect(screen.getByText(AMINA.task)).toBeDefined();
  });

  /** The whole point of `chart` being accessors: these numbers cannot be typed by an author. */
  it('reads the chart off the live snapshot, to the stated precision', () => {
    render(<ClinicPanel {...props} patient={AMINA} />);
    expect(screen.getByText('62')).toBeDefined();
    expect(screen.getByText('4.2')).toBeDefined();
  });

  it('shows no chart before the engine has produced a snapshot', () => {
    render(<ClinicPanel {...props} patient={AMINA} snapshot={null} />);
    expect(screen.getByRole('heading', { name: /Amina, 24/ })).toBeDefined();
    expect(screen.queryByText('MAP')).toBeNull();
  });

  it('renders the quiz it is given', () => {
    render(<ClinicPanel {...props} patient={AMINA} />);
    expect(screen.getByTestId('quiz')).toBeDefined();
  });

  describe('while a question owns the engine', () => {
    /**
     * The honesty rule. A question loads its own scenario, which need not be this patient's, and
     * nothing else on the page can tell — `useBedside.activePreset` only moves when the preset
     * bar is pressed. Captioning those numbers with her name would put a false claim directly
     * above the options.
     */
    it('stops captioning the observations with the patient’s name', () => {
      render(<ClinicPanel {...props} patient={AMINA} sessionActive />);
      expect(screen.getByText(/not necessarily this patient/i)).toBeDefined();
      expect(screen.queryByText(/Amina's observations/)).toBeNull();
    });

    it('withdraws the bedside task, which is not the question being asked', () => {
      render(<ClinicPanel {...props} patient={AMINA} sessionActive />);
      expect(screen.queryByText(AMINA.task)).toBeNull();
    });
  });

  describe('the teaching payoff', () => {
    /** It is the answer. "Never print the answer during practice." */
    it('is absent before the questions are done', () => {
      render(<ClinicPanel {...props} patient={AMINA} />);
      expect(screen.queryByText(AMINA.teaching, { exact: false })).toBeNull();
    });

    it('is still absent while a question is open', () => {
      render(<ClinicPanel {...props} patient={AMINA} sessionActive />);
      expect(screen.queryByText(AMINA.teaching, { exact: false })).toBeNull();
    });

    it('arrives once the session is complete', () => {
      render(<ClinicPanel {...props} patient={AMINA} sessionComplete />);
      expect(screen.getByText(AMINA.teaching, { exact: false })).toBeDefined();
    });
  });

  describe('before a bed is chosen', () => {
    it('names no patient and shows no chart', () => {
      render(<ClinicPanel {...props} patient={null} />);
      expect(screen.queryByText(AMINA.presentation)).toBeNull();
      expect(screen.queryByText('MAP')).toBeNull();
    });

    /**
     * The quiz is the PAGE's single session, and with no bed chosen there is nothing for it to
     * run. Mounting it anyway would put a "Start practice" button on screen that does nothing —
     * `useQuizSession.begin` no-ops on an empty queue.
     */
    it('asks for a bed instead of showing an empty quiz', () => {
      render(<ClinicPanel {...props} patient={null} />);
      expect(screen.queryByTestId('quiz')).toBeNull();
      expect(screen.getByText(/Choose a patient/)).toBeDefined();
    });
  });
});
