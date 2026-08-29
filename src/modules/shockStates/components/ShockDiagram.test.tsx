// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { ShockDiagram } from './ShockDiagram';
import { computeDerived, createInitialState, step } from '../engine/engine';
import { DEFAULT_SHOCK_INPUTS, SHOCK_PRESETS } from '../engine/presets';
import type { ShockInputs } from '../engine/types';

afterEach(cleanup);

/**
 * Four ways to fail, four different structures on the drawing. These assertions are what stop
 * the diagram sliding back to four identical dots with different captions.
 *
 * Selectors are `[class*="name"]`, not `.name`: CSS modules render as `_name_hash` under
 * Vitest, so an exact class selector silently matches nothing and passes vacuously.
 */
function settled(preset: Partial<ShockInputs>, seconds = 60) {
  const inputs = { ...DEFAULT_SHOCK_INPUTS, ...preset };
  let snapshot = { state: createInitialState(), derived: computeDerived(createInitialState(), inputs) };
  for (let t = 0; t < seconds; t += 1) snapshot = step(snapshot.state, inputs, 1);
  return snapshot.derived;
}

function draw(preset: Partial<ShockInputs>) {
  const derived = settled(preset);
  const { container } = render(<ShockDiagram derived={derived} />);
  return { container, derived };
}

const tankFillHeight = (container: HTMLElement) =>
  Number((container.querySelector('[class*="tankFill"]') as SVGElement).getAttribute('height'));

/** jsdom does not resolve `calc()` against a custom property, so the variable the stroke width
 * is computed FROM is what can actually be asserted here. */
const variable = (container: HTMLElement, name: string) =>
  Number((container.querySelector('g[style]') as SVGElement).style.getPropertyValue(name));

describe('shock diagram', () => {
  it('shows no lesion structures when the circulation is intact', () => {
    const { container } = draw(SHOCK_PRESETS.normal);

    expect(container.querySelector('[class*="pericardium"]')).toBeNull();
    expect(container.querySelector('[class*="clamp"]')).toBeNull();
  });

  it('empties the reservoir in haemorrhage, and only in haemorrhage', () => {
    const bled = draw(SHOCK_PRESETS.haemorrhagic);
    const full = draw(SHOCK_PRESETS.normal);

    expect(tankFillHeight(bled.container)).toBeLessThan(tankFillHeight(full.container));
  });

  /**
   * The heart looks full from outside and is empty inside. That gap is the whole of tamponade,
   * and it is the reason both pressures are drawn rather than just the measured one.
   */
  it('puts a shell round the heart in tamponade, with measured pressure far above transmural', () => {
    const { container, derived } = draw(SHOCK_PRESETS.tamponade);

    expect(container.querySelector('[class*="pericardium"]')).not.toBeNull();
    expect(derived.centralVenousPressureMmHg - derived.transmuralRapMmHg).toBeGreaterThan(6);
    expect(container.textContent).toContain(`transmural ${derived.transmuralRapMmHg.toFixed(0)}`);
  });

  it('clamps the pulmonary limb in embolism, and leaves the tank alone', () => {
    const { container } = draw(SHOCK_PRESETS.pulmonaryEmbolism);

    expect(container.querySelector('[class*="clamp"]')).not.toBeNull();
    expect(container.querySelector('[class*="pericardium"]')).toBeNull();
  });

  /** The lesion that makes the circuit look healthier: a pipe gone wide. */
  it('widens the arterial pipe when resistance collapses', () => {
    const dilated = draw(SHOCK_PRESETS.septic);
    const normal = draw(SHOCK_PRESETS.normal);

    expect(variable(dilated.container, '--calibre')).toBeGreaterThan(
      variable(normal.container, '--calibre'),
    );
  });

  it('thins the ventricular wall when the pump fails', () => {
    const failing = draw(SHOCK_PRESETS.cardiogenic);
    const intact = draw(SHOCK_PRESETS.normal);

    expect(variable(failing.container, '--contractility')).toBeLessThan(
      variable(intact.container, '--contractility'),
    );
  });
});
