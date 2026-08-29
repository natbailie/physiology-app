// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { HpaDiagram } from './HpaDiagram';
import { computeDerived, createInitialState, step } from '../engine/engine';
import { DEFAULT_HPA_INPUTS, HPA_PRESETS } from '../engine/presets';
import type { HpaInputs } from '../engine/types';

afterEach(cleanup);

/**
 * The axis has to look like an axis at rest, and each lesion has to show at its own level:
 * pituitary, gland, or the circulation itself.
 *
 * Selectors are `[class*="name"]`, not `.name`: CSS modules render as `_name_hash` under Vitest.
 */
function settled(preset: Partial<HpaInputs>, seconds = 4000) {
  const inputs = { ...DEFAULT_HPA_INPUTS, ...preset };
  let state = createInitialState();
  let derived = computeDerived(state, inputs);
  for (let t = 0; t < seconds; t += 1) {
    const next = step(state, inputs, 1);
    state = next.state;
    derived = next.derived;
  }
  return derived;
}

function draw(preset: Partial<HpaInputs>) {
  const derived = settled(preset);
  const { container } = render(<HpaDiagram derived={derived} />);
  return { container, derived };
}

const level = (container: HTMLElement, sel: string) =>
  Number((container.querySelector(sel) as SVGElement).style.getPropertyValue('--level'));

/** Cortical thickness is drawn as the stroke width of the cortex ring. */
const cortexThickness = (container: HTMLElement) =>
  Number((container.querySelector('[class*="adrenalCortex"]') as SVGElement).style.strokeWidth);

describe('HPA axis diagram', () => {
  /** The old drawing faded its arrows to nothing at rest, so a quiet axis looked like an absent
   * one. Every pathway must still be drawn when the axis is merely idle. */
  it('draws the whole pathway even when the axis is quiet', () => {
    const { container } = draw(HPA_PRESETS.normal);

    expect(container.querySelector('[class*="portal"]')).not.toBeNull();
    expect(container.querySelector('[class*="trophic"]')).not.toBeNull();
    expect(container.querySelector('[class*="anteriorLobe"]')).not.toBeNull();
    expect(container.querySelector('[class*="posteriorLobe"]')).not.toBeNull();
    expect(container.querySelector('[class*="feedback"]')).not.toBeNull();
  });

  it('shows no exogenous hormone entering the circulation unless some is given', () => {
    const normal = draw(HPA_PRESETS.normal);
    // The whole group is absent, not merely faded: nothing is entering from outside the axis.
    expect(normal.container.querySelector('[class*="exogenousLabel"]')).toBeNull();
    cleanup();

    const steroid = draw(HPA_PRESETS.steroidTherapy);
    const arrow = steroid.container.querySelector('[class*="exogenousLabel"]');
    expect(arrow).not.toBeNull();
    expect(Number((arrow!.closest('g') as SVGElement).style.getPropertyValue('--level'))).toBeGreaterThan(0.9);
  });

  /**
   * The clinical point of the module. A drug in the circulation suppresses the axis from outside
   * it, and the cortex — not the medulla — wastes as a result. Cortical thickness is the reserve.
   */
  it('thins the adrenal cortex under sustained steroid therapy', () => {
    const normal = draw(HPA_PRESETS.normal);
    const normalCortex = cortexThickness(normal.container);
    cleanup();

    const steroid = draw(HPA_PRESETS.steroidTherapy);

    expect(steroid.derived.adrenalReserve).toBeLessThan(normal.derived.adrenalReserve);
    expect(cortexThickness(steroid.container)).toBeLessThan(normalCortex);
  });

  /** Secondary insufficiency is a PITUITARY problem, so the anterior lobe is what fades. */
  it('fades the anterior lobe in secondary insufficiency, not the gland', () => {
    const { container } = draw(HPA_PRESETS.secondaryInsufficiency);

    expect(level(container, '[class*="anteriorLobe"]')).toBeLessThan(0.3);
  });

  /** Addison's is the mirror image: the gland fails and ACTH rises unchecked. */
  it('drives the trophic pathway hard in Addison’s while the gland stays dark', () => {
    const addisons = draw(HPA_PRESETS.addisons);
    const normal = draw(HPA_PRESETS.normal);

    expect(addisons.derived.acthLevel).toBeGreaterThan(normal.derived.acthLevel);
    expect(addisons.derived.cortisolLevel).toBeLessThan(normal.derived.cortisolLevel);
  });
});
