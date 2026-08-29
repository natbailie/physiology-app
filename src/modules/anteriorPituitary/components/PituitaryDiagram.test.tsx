// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { PituitaryDiagram } from './PituitaryDiagram';
import { computeDerived, createInitialState, step } from '../engine/engine';
import { DEFAULT_PITUITARY_INPUTS, PITUITARY_PRESETS } from '../engine/presets';
import type { PituitaryDerived, PituitaryInputs } from '../engine/types';

afterEach(cleanup);

/** Selectors are `[class*="name"]`, not `.name`: CSS modules render as `_name_hash` under Vitest. */
function settle(patch: Partial<PituitaryInputs>, seconds = 400000): PituitaryDerived {
  const inputs = { ...DEFAULT_PITUITARY_INPUTS, ...patch };
  let state = createInitialState();
  let derived = computeDerived(state, inputs);
  for (let t = 0; t < seconds; t += 1) {
    const next = step(state, inputs, 1);
    state = next.state;
    derived = next.derived;
  }
  return derived;
}

function draw(patch: Partial<PituitaryInputs>) {
  const derived = settle(patch);
  const { container } = render(<PituitaryDiagram derived={derived} />);
  return { container, derived };
}

const massColour = (container: HTMLElement) =>
  (container.querySelector('[class*="mass"]') as SVGElement | null)?.style.getPropertyValue('--mass-color') ?? null;

const flow = (container: HTMLElement, sel: string) =>
  Number((container.querySelector(sel) as SVGElement).style.getPropertyValue('--flow'));

describe('anterior pituitary diagram', () => {
  it('draws all five cell lines and no mass in a normal gland', () => {
    const { container } = draw(PITUITARY_PRESETS.normal);

    expect(container.querySelectorAll('[class*="legendSwatch"]').length).toBe(5);
    expect(container.querySelector('[class*="mass"]')).toBeNull();
    expect(container.querySelector('[class*="fieldWedge"]')).toBeNull();
    expect(container.querySelector('[class*="receptorBlock"]')).toBeNull();
  });

  /**
   * The mass carries the colour of the line it grew from. Two adenomas of similar volume that
   * came from different cell lines have to look different, or the drawing is just a size meter.
   */
  it('colours the adenoma by the cell line it grew from', () => {
    const acro = draw(PITUITARY_PRESETS.acromegaly);
    expect(massColour(acro.container)).toBe('var(--pituitary)');

    cleanup();
    const prolactinoma = draw(PITUITARY_PRESETS.macroprolactinoma);
    expect(massColour(prolactinoma.container)).toBe('var(--estrogen)');

    cleanup();
    const nonFunctioning = draw(PITUITARY_PRESETS.nonFunctioningMass);
    expect(massColour(nonFunctioning.container)).toBe('var(--text-faint)');
  });

  /** A macroadenoma reaches the chiasm; a microadenoma does not. Size is the whole difference. */
  it('presses on the chiasm only once the mass is a macroadenoma', () => {
    const macro = draw(PITUITARY_PRESETS.macroprolactinoma);
    expect(macro.derived.visualFieldDefectPct).toBeGreaterThan(0);
    expect(macro.container.querySelectorAll('[class*="fieldWedge"]').length).toBe(2);

    cleanup();
    const micro = draw(PITUITARY_PRESETS.microprolactinoma);
    expect(micro.derived.visualFieldDefectPct).toBe(0);
    expect(micro.container.querySelector('[class*="fieldWedge"]')).toBeNull();
  });

  /**
   * The stalk effect: a mass that secretes nothing still raises prolactin, because it throttles
   * the dopamine reaching the lactotroph. The drawing has to show the squeeze on the stalk and
   * the thinning of the dopamine path, not just a higher number.
   */
  it('squeezes the stalk and thins the dopamine path under a non-functioning mass', () => {
    const mass = draw(PITUITARY_PRESETS.nonFunctioningMass);
    const massFlow = flow(mass.container, '[class*="dopamine"]');
    cleanup();
    const normal = draw(PITUITARY_PRESETS.normal);

    expect(mass.derived.prolactinNgMl).toBeGreaterThan(normal.derived.prolactinNgMl);
    expect(mass.derived.stalkCompressionFraction).toBeGreaterThan(0.1);
    expect(massFlow).toBeLessThan(flow(normal.container, '[class*="dopamine"]'));
  });

  /** A drug interrupting the brake is drawn on the path it interrupts, with no mass anywhere. */
  it('draws the D2 block on the dopamine path and leaves the sella empty', () => {
    const { container, derived } = draw(PITUITARY_PRESETS.antipsychoticHyperprl);

    expect(container.querySelectorAll('[class*="receptorBlock"]').length).toBeGreaterThan(0);
    expect(container.querySelector('[class*="mass"]')).toBeNull();
    expect(derived.prolactinNgMl).toBeGreaterThan(40);
  });

  /**
   * Primary hypothyroidism raises prolactin through the TRH spillover onto the lactotroph — the
   * branch is drawn precisely so this preset is a different picture from the D2 block, rather
   * than the same raised prolactin twice.
   */
  it('thickens the TRH route, not the dopamine route, in hypothyroid hyperprolactinaemia', () => {
    const hypo = draw(PITUITARY_PRESETS.hypothyroidHyperprl);
    const hypoTrh = flow(hypo.container, '[class*="trh"]');
    const hypoDopamine = flow(hypo.container, '[class*="dopamine"]');
    cleanup();
    const normal = draw(PITUITARY_PRESETS.normal);

    expect(hypoTrh).toBeGreaterThan(flow(normal.container, '[class*="trh"]'));
    expect(hypoDopamine).toBeCloseTo(flow(normal.container, '[class*="dopamine"]'), 5);
    expect(hypo.container.querySelector('[class*="receptorBlock"]')).toBeNull();
  });
});
