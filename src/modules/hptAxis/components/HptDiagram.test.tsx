// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { HptDiagram } from './HptDiagram';
import { computeDerived, createInitialState, step } from '../engine/engine';
import { DEFAULT_HPT_INPUTS, HPT_PRESETS } from '../engine/presets';
import type { HptInputs } from '../engine/types';

afterEach(cleanup);

/** Selectors are `[class*="name"]`, not `.name`: CSS modules render as `_name_hash` under Vitest. */
function settled(preset: Partial<HptInputs>, seconds = 4000) {
  const inputs = { ...DEFAULT_HPT_INPUTS, ...preset };
  let state = createInitialState();
  let derived = computeDerived(state, inputs);
  for (let t = 0; t < seconds; t += 1) {
    const next = step(state, inputs, 1);
    state = next.state;
    derived = next.derived;
  }
  return derived;
}

function draw(preset: Partial<HptInputs>) {
  const derived = settled(preset);
  const { container } = render(<HptDiagram derived={derived} />);
  return { container, derived };
}

const level = (container: HTMLElement, sel: string) =>
  Number((container.querySelector(sel) as SVGElement).style.getPropertyValue('--level'));

describe('HPT axis diagram', () => {
  it('draws the gland with its follicles and both pituitary lobes', () => {
    const { container } = draw(HPT_PRESETS.normal);

    expect(container.querySelectorAll('[class*="follicle"]').length).toBeGreaterThan(0);
    expect(container.querySelector('[class*="anteriorLobe"]')).not.toBeNull();
    expect(container.querySelector('[class*="posteriorLobe"]')).not.toBeNull();
  });

  /** Primary disease is at the gland; the pituitary is fine and drives harder. */
  it('empties the gland and drives TSH up in primary hypothyroidism', () => {
    const primary = draw(HPT_PRESETS.primaryHypothyroidism);
    const normal = draw(HPT_PRESETS.normal);

    expect(primary.derived.tshLevel).toBeGreaterThan(normal.derived.tshLevel);
    expect(primary.derived.t4Level).toBeLessThan(normal.derived.t4Level);
  });

  /** Secondary disease is at the pituitary, and that is the structure that fades. */
  it('fades the anterior lobe in secondary hypothyroidism', () => {
    const { container } = draw(HPT_PRESETS.secondaryHypothyroidism);

    expect(level(container, '[class*="anteriorLobe"]')).toBeLessThan(0.3);
  });

  /**
   * Sick euthyroid is a conversion problem, not a glandular one: T4 is made and simply is not
   * turned into T3. The conversion step is on the drawing precisely so this preset has somewhere
   * to show itself.
   */
  it('thins the peripheral conversion step in sick euthyroid', () => {
    const conversionOf = (preset: Partial<HptInputs>) => {
      cleanup();
      const { container } = render(<HptDiagram derived={settled(preset)} />);
      return Number((container.querySelector('[class*="conversion"]') as SVGElement).style.getPropertyValue('--conversion'));
    };

    expect(conversionOf(HPT_PRESETS.sickEuthyroid)).toBeLessThan(conversionOf(HPT_PRESETS.normal));
  });

  it('suppresses TSH in Graves’ while the gland keeps working', () => {
    const graves = draw(HPT_PRESETS.graves);
    const normal = draw(HPT_PRESETS.normal);

    expect(graves.derived.tshLevel).toBeLessThan(normal.derived.tshLevel);
    expect(graves.derived.t4Level).toBeGreaterThan(normal.derived.t4Level);
  });
});
