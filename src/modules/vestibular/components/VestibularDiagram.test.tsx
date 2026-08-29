// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { VestibularDiagram } from './VestibularDiagram';
import { computeDerived, createInitialState, step } from '../engine/engine';
import { DEFAULT_VESTIBULAR_INPUTS, VESTIBULAR_PRESETS } from '../engine/presets';
import type { VestibularInputs } from '../engine/types';

afterEach(cleanup);

/**
 * Vertigo is a DIFFERENCE between two firing rates, not a low rate. The beam is what makes that
 * drawable, and these assertions are what keep it honest.
 *
 * Selectors are `[class*="name"]`, not `.name`: CSS modules render as `_name_hash` under Vitest.
 */
function settled(preset: Partial<VestibularInputs>, seconds = 30) {
  const inputs = { ...DEFAULT_VESTIBULAR_INPUTS, ...preset };
  let snapshot = { state: createInitialState(), derived: computeDerived(createInitialState(), inputs) };
  for (let t = 0; t < seconds; t += 1) snapshot = step(snapshot.state, inputs, 1);
  return snapshot.derived;
}

function draw(preset: Partial<VestibularInputs>) {
  const derived = settled(preset);
  const { container } = render(<VestibularDiagram derived={derived} />);
  return { container, derived };
}

/** Rotation of the push-pull beam, in degrees. Zero is balanced. */
function beamTilt(container: HTMLElement): number {
  const g = [...container.querySelectorAll('g')].find((e) => (e.getAttribute('transform') || '').startsWith('rotate('));
  return Number((g?.getAttribute('transform') || 'rotate(0').match(/rotate\(([-\d.]+)/)?.[1] ?? 0);
}

const ampullaDrive = (container: HTMLElement) =>
  [...container.querySelectorAll('[class*="ampulla"]')].map((e) =>
    Number((e as SVGElement).style.getPropertyValue('--drive')),
  );

describe('vestibular diagram', () => {
  it('sits level with both sides firing at rest', () => {
    const { container } = draw(VESTIBULAR_PRESETS.normal);
    const [right, left] = ampullaDrive(container);

    expect(Math.abs(beamTilt(container))).toBeLessThan(1);
    expect(right).toBeCloseTo(left!, 1);
  });

  it('tilts the beam and empties one ampulla in acute neuritis', () => {
    const { container, derived } = draw(VESTIBULAR_PRESETS.acuteNeuritis);
    const [right, left] = ampullaDrive(container);

    expect(Math.abs(derived.firingImbalanceSpikesPerSec)).toBeGreaterThan(30);
    expect(Math.abs(beamTilt(container))).toBeGreaterThan(4);
    expect(right).toBeLessThan(left! / 2);
  });

  /**
   * The module's sharpest point, and the reason the beam shows the PERIPHERAL difference.
   * Compensation does not restore the dead side and does not level the peripheral mismatch —
   * it stops the brain acting on it. So the beam stays tilted, the ampulla stays empty, the VOR
   * stays broken, and the nystagmus goes away. A drawing that only showed a firing rate, or one
   * that levelled the beam, would teach the opposite.
   */
  it('keeps the beam tilted after compensation while the nystagmus goes', () => {
    const acute = draw(VESTIBULAR_PRESETS.acuteNeuritis);
    const acuteNystagmus = Math.abs(acute.derived.slowPhaseVelocityDegPerSec);
    const acuteRight = ampullaDrive(acute.container)[0]!;
    cleanup();

    const compensated = draw(VESTIBULAR_PRESETS.compensatedNeuritis);

    // The periphery is unchanged: same dead ampulla, same tilt.
    expect(ampullaDrive(compensated.container)[0]!).toBeCloseTo(acuteRight, 1);
    expect(Math.abs(beamTilt(compensated.container))).toBeGreaterThan(4);
    // What changed is what the brain does with it.
    expect(Math.abs(compensated.derived.slowPhaseVelocityDegPerSec)).toBeLessThan(acuteNystagmus);
    expect(compensated.derived.vorGain).toBeLessThan(0.8);
  });

  /** Both sides gone is not vertigo: nothing to compare, so the beam stays level. */
  it('keeps the beam level in bilateral loss despite both sides being dead', () => {
    const { container, derived } = draw(VESTIBULAR_PRESETS.bilateralLoss);
    const [right, left] = ampullaDrive(container);

    expect(Math.abs(beamTilt(container))).toBeLessThan(2);
    expect(right).toBeLessThan(0.3);
    expect(left).toBeLessThan(0.3);
    expect(derived.vertigoIntensityPct).toBeLessThan(20);
  });

  /** BPPV is debris in one canal, and it is the posterior one. */
  it('puts canaliths in the posterior canal only for BPPV', () => {
    expect(draw(VESTIBULAR_PRESETS.normal).container.querySelector('[class*="canalith"]')).toBeNull();
    cleanup();
    expect(draw(VESTIBULAR_PRESETS.bppvPosterior).container.querySelector('[class*="canalith"]')).not.toBeNull();
  });
});
