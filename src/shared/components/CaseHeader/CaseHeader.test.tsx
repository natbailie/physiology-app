// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CaseHeader } from './CaseHeader';
import type { ModuleCase } from '@/shared/cases/types';

// vitest runs with globals: false, so Testing Library never registers its own cleanup.
afterEach(cleanup);

interface Snap {
  derived: { map: number; lactate: number };
}

const PATIENT: ModuleCase<'haemorrhagic' | 'septic', Snap> = {
  id: 'amina-marathon',
  name: 'Amina',
  age: 24,
  bed: 'A04',
  oneLiner: 'Collapsed at mile 20, cold and tachycardic',
  presentation: 'x'.repeat(130),
  preset: 'haemorrhagic',
  chart: [
    { label: 'MAP', value: (s) => s.derived.map, unit: 'mmHg', decimals: 0 },
    { label: 'Lactate', value: (s) => s.derived.lactate, unit: 'mmol/L', decimals: 1 },
  ],
  task: 'Name the shock before anyone reaches for fluid.',
  teaching: 'y'.repeat(130),
};

/**
 * The slim lab banner. The live observations live in `ClinicPanel` now, on the Patients tab —
 * the assertions about reading the chart off the engine moved there with them rather than
 * being left here to pass against markup that no longer exists.
 */
describe('CaseHeader', () => {
  it('names the patient and the presenting complaint', () => {
    render(<CaseHeader patient={PATIENT} activePreset="haemorrhagic" onReturn={() => {}} playing={false} baselineFrozen={false} />);
    expect(screen.getByText('Amina, 24')).toBeDefined();
    expect(screen.getByText(PATIENT.oneLiner)).toBeDefined();
  });

  it('treats "no scenario applied yet" as the patient, not as a divergence', () => {
    render(<CaseHeader patient={PATIENT} activePreset={null} onReturn={() => {}} playing={false} baselineFrozen={false} />);
    expect(screen.getByText(PATIENT.task)).toBeDefined();
    expect(screen.queryByRole('button', { name: /bedside/i })).toBeNull();
  });

  describe('when the learner loads a different scenario', () => {
    it('stops claiming the sliders are the patient’s', () => {
      render(<CaseHeader patient={PATIENT} activePreset="septic" onReturn={() => {}} playing={false} baselineFrozen={false} />);
      expect(screen.getByText(/not Amina's numbers/)).toBeDefined();
      // The task goes with it: what to work out at this bedside is not the question any more.
      expect(screen.queryByText(PATIENT.task)).toBeNull();
    });

    it('offers a way back to the bed', () => {
      const onReturn = vi.fn();
      render(<CaseHeader patient={PATIENT} activePreset="septic" onReturn={onReturn} playing={false} baselineFrozen={false} />);
      fireEvent.click(screen.getByRole('button', { name: /bedside/i }));
      expect(onReturn).toHaveBeenCalledOnce();
    });
  });
});

/**
 * The monitor register.
 *
 * Everything on it is real state the page already holds. There is deliberately no simulated
 * clock: the engine is reset before every practice question and `timeScale` differs by three
 * orders of magnitude between modules, so an elapsed time would be the one invented number on
 * an otherwise measured surface.
 */
describe('the register line', () => {
  it('names the bed, and says the engine is paused when it is', () => {
    render(<CaseHeader patient={PATIENT} activePreset={null} onReturn={() => {}} playing={false} baselineFrozen={false} />);
    expect(screen.getByText(/A04/)).toBeDefined();
    expect(screen.getByText(/Paused/)).toBeDefined();
  });

  /**
   * The word, not the dot, carries this. index.css stops all animation under
   * prefers-reduced-motion, so a blink alone would say nothing to those readers.
   */
  it('says Live in words while the engine runs', () => {
    render(<CaseHeader patient={PATIENT} activePreset={null} onReturn={() => {}} playing baselineFrozen={false} />);
    expect(screen.getByText(/Live/)).toBeDefined();
    expect(screen.queryByText(/Paused/)).toBeNull();
  });

  it('reports a frozen baseline, and stays quiet when there is none', () => {
    const { unmount } = render(
      <CaseHeader patient={PATIENT} activePreset={null} onReturn={() => {}} playing baselineFrozen />,
    );
    expect(screen.getByText(/Baseline frozen/)).toBeDefined();
    unmount();
    render(<CaseHeader patient={PATIENT} activePreset={null} onReturn={() => {}} playing baselineFrozen={false} />);
    expect(screen.queryByText(/Baseline frozen/)).toBeNull();
  });
});
