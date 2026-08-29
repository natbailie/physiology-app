// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { SomaticDiagram } from './SomaticDiagram';
import { computeDerived, createInitialState, step } from '../engine/engine';
import { DEFAULT_SOMATIC_INPUTS, SOMATIC_PRESETS } from '../engine/presets';
import type { SomaticInputs } from '../engine/types';

afterEach(cleanup);

/**
 * The lesions this module simulates are defined by WHERE in the cord they sit, so the drawing
 * has to place them. These assertions are what stop the tracts drifting back to four boxes.
 *
 * Selectors are `[class*="name"]`, not `.name`: CSS modules render as `_name_hash` under
 * Vitest, so an exact class selector silently matches nothing and passes vacuously.
 */
function settled(preset: Partial<SomaticInputs>, seconds = 30) {
  const inputs = { ...DEFAULT_SOMATIC_INPUTS, ...preset };
  let snapshot = { state: createInitialState(), derived: computeDerived(createInitialState(), inputs) };
  for (let t = 0; t < seconds; t += 1) snapshot = step(snapshot.state, inputs, 1);
  return snapshot.derived;
}

function draw(preset: Partial<SomaticInputs>) {
  const derived = settled(preset);
  const { container } = render(<SomaticDiagram derived={derived} />);
  return { container, derived };
}

/** Tract integrity, in the order drawn: right dorsal column, left dorsal column,
 * right spinothalamic, left spinothalamic. */
function integrity(container: HTMLElement) {
  const read = (sel: string) =>
    [...container.querySelectorAll(sel)].map((e) => Number((e as SVGElement).style.getPropertyValue('--integrity')));
  const [dcRight, dcLeft] = read('[class*="columnDC"]');
  const [stRight, stLeft] = read('[class*="columnST"]');
  return { dcRight: dcRight!, dcLeft: dcLeft!, stRight: stRight!, stLeft: stLeft! };
}

describe('spinal cord diagram', () => {
  it('draws all four tracts intact when nothing is lesioned', () => {
    const { container } = draw(SOMATIC_PRESETS.normal);
    const t = integrity(container);

    expect(t.dcLeft).toBeGreaterThan(0.9);
    expect(t.dcRight).toBeGreaterThan(0.9);
    expect(t.stLeft).toBeGreaterThan(0.9);
    expect(t.stRight).toBeGreaterThan(0.9);
  });

  /**
   * The whole reason the decussation is drawn. A left hemisection takes the LEFT dorsal column
   * — vibration lost on the same side — and the LEFT spinothalamic, which was already carrying
   * the RIGHT side's pain. Ipsilateral touch, contralateral pain, from one lesion.
   */
  it('crosses the deficit in Brown-Séquard: same-side touch, other-side pain', () => {
    const { container, derived } = draw(SOMATIC_PRESETS.brownSequardLeft);
    const t = integrity(container);

    // Left cord damaged, right cord spared.
    expect(t.dcLeft).toBeLessThan(0.4);
    expect(t.dcRight).toBeGreaterThan(0.9);
    expect(t.stLeft).toBeLessThan(0.4);
    expect(t.stRight).toBeGreaterThan(0.9);

    // Which the body reads out as the dissociation itself.
    expect(derived.touchLeftPct).toBeLessThan(40);
    expect(derived.touchRightPct).toBeGreaterThan(90);
    expect(derived.painTempRightPct).toBeLessThan(40);
    expect(derived.painTempLeftPct).toBeGreaterThan(90);
  });

  it('takes both spinothalamic tracts and spares the dorsal columns in anterior cord syndrome', () => {
    const { container } = draw(SOMATIC_PRESETS.anteriorCord);
    const t = integrity(container);

    expect(t.stLeft).toBeLessThan(0.5);
    expect(t.stRight).toBeLessThan(0.5);
    expect(t.dcLeft).toBeGreaterThan(0.8);
    expect(t.dcRight).toBeGreaterThan(0.8);
  });

  /** A syrinx has to have a central canal to expand from, which is why the grey matter is drawn. */
  it('opens a cavity from the central canal in syringomyelia, and not otherwise', () => {
    expect(draw(SOMATIC_PRESETS.normal).container.querySelector('[class*="syrinxCavity"]')).toBeNull();

    cleanup();
    const { container, derived } = draw(SOMATIC_PRESETS.syringomyelia);
    expect(derived.segmentalPainTempPct).toBeLessThan(90);
    expect(container.querySelector('[class*="syrinxCavity"]')).not.toBeNull();
  });

  it('loses everything below a complete transection', () => {
    const { container } = draw(SOMATIC_PRESETS.completeTransection);
    const t = integrity(container);

    for (const value of Object.values(t)) expect(value).toBeLessThan(0.4);
  });

  /** The gate is drawn in the dorsal horn, where it acts, rather than as a bar to one side. */
  it('opens the dorsal horn with the gate', () => {
    const gateOf = (preset: Partial<SomaticInputs>) => {
      cleanup();
      const { container } = render(<SomaticDiagram derived={settled(preset)} />);
      return Number((container.querySelector('[class*="dorsalHorn"]') as SVGElement).style.getPropertyValue('--gate'));
    };

    expect(gateOf(SOMATIC_PRESETS.acuteBurn)).toBeGreaterThan(gateOf(SOMATIC_PRESETS.normal));
  });
});
