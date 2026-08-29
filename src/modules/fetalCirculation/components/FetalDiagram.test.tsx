// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { FetalDiagram } from './FetalDiagram';
import { computeDerived, createInitialState, step } from '../engine/engine';
import { DEFAULT_FETAL_INPUTS, FETAL_PRESETS } from '../engine/presets';
import type { FetalInputs } from '../engine/types';

afterEach(cleanup);

/**
 * The drawing has to track the engine, not merely sit beside it.
 *
 * Selectors are `[class*="name"]`, not `.name`: CSS modules render as `_name_hash` under
 * Vitest, so an exact class selector silently matches nothing and every assertion passes
 * vacuously.
 */
/** Settled the way the engine tests settle: duct closure runs on an hours-long time constant,
 * so a short run leaves the shunts still open and every assertion measures the wrong moment. */
function settled(preset: Partial<FetalInputs>, seconds = 5000) {
  const inputs = { ...DEFAULT_FETAL_INPUTS, ...preset };
  let state = createInitialState();
  let derived = computeDerived(state, inputs);
  for (let t = 0; t < seconds; t += 0.2) {
    const next = step(state, inputs, 0.2);
    state = next.state;
    derived = next.derived;
  }
  return derived;
}

function draw(preset: Partial<FetalInputs>) {
  const derived = settled(preset);
  const { container } = render(<FetalDiagram derived={derived} />);
  return { container, derived };
}

/** The colour a vessel is painted, which encodes the saturation of the blood in it. */
function strokeOf(container: HTMLElement, index: number): string {
  return ([...container.querySelectorAll('[class*="aorta"]')][index] as SVGElement).style.stroke;
}

describe('fetal circulation diagram', () => {
  it('shunts right-to-left across the duct in utero', () => {
    const { container, derived } = draw(FETAL_PRESETS.fetal);

    expect(derived.ductalShuntFraction).toBeGreaterThan(0);
    expect(container.querySelector('[class*="shuntRightToLeft"]')).not.toBeNull();
  });

  /**
   * The point of drawing the duct distal to the head vessels: the aorta above the insertion
   * and the aorta below it are carrying different blood, so they must be painted differently.
   */
  it('paints a colour step across the duct while a saturation gap exists', () => {
    const { container, derived } = draw(FETAL_PRESETS.fetal);

    expect(derived.saturationGradientPercent).toBeGreaterThan(5);
    // Index 2 and 3 are the ascending and descending casings' painted strokes.
    expect(strokeOf(container, 2)).not.toBe(strokeOf(container, 3));
  });

  it('closes the duct once the circulation has transitioned', () => {
    const { container, derived } = draw(FETAL_PRESETS.transitioned);

    expect(derived.ductusArteriosusPatency).toBeLessThan(0.15);
    expect(container.querySelector('[class*="closed"]')).not.toBeNull();
  });

  it('loses the colour step once pre- and post-ductal blood are the same', () => {
    const { container, derived } = draw(FETAL_PRESETS.transitioned);

    expect(derived.saturationGradientPercent).toBeLessThan(2);
    expect(strokeOf(container, 2)).toBe(strokeOf(container, 3));
  });

  /** The bypass around the liver is drawn, and fades as it closes after the cord is cut. */
  it('fades the ductus venosus as it closes', () => {
    const patencyOf = (preset: Partial<FetalInputs>) => {
      cleanup();
      const { container } = render(<FetalDiagram derived={settled(preset)} />);
      const group = container.querySelector('g[style]') as SVGElement;
      return Number(group.style.getPropertyValue('--dv-open'));
    };

    expect(patencyOf(FETAL_PRESETS.transitioned)).toBeLessThan(patencyOf(FETAL_PRESETS.fetal));
  });

  it('withholds nothing when the placenta is attached, and fades it when clamped', () => {
    const placentalOf = (preset: Partial<FetalInputs>) => {
      cleanup();
      const { container } = render(<FetalDiagram derived={settled(preset)} />);
      const group = container.querySelector('g[style]') as SVGElement;
      return Number(group.style.getPropertyValue('--placental'));
    };

    expect(placentalOf(FETAL_PRESETS.fetal)).toBeGreaterThan(0.9);
    expect(placentalOf(FETAL_PRESETS.firstBreath)).toBeLessThan(0.2);
  });
});
