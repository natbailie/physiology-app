// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { CoronaryDiagram } from './CoronaryDiagram';
import { computeDerived, createInitialState, perturbVasospasm, step } from '../engine/engine';
import { CORONARY_PRESETS, DEFAULT_CORONARY_INPUTS } from '../engine/presets';
import type { CoronaryInputs } from '../engine/types';

afterEach(cleanup);

/** Settle the engine on a preset, the way the page does before anything is read off it. */
function settled(preset: Partial<CoronaryInputs>, seconds = 30) {
  const inputs = { ...DEFAULT_CORONARY_INPUTS, ...preset };
  let snapshot = { state: createInitialState(), derived: computeDerived(createInitialState(), inputs) };
  for (let t = 0; t < seconds; t += 1) snapshot = step(snapshot.state, inputs, 1);
  return snapshot.derived;
}

function draw(preset: Partial<CoronaryInputs>) {
  const derived = settled(preset);
  const { container } = render(<CoronaryDiagram derived={derived} />);
  return { container, derived };
}

/**
 * The drawing has to track the engine, not merely sit beside it.
 *
 * Selectors are `[class*="name"]`, not `.name`: CSS modules render as `_name_hash` under
 * Vitest, so an exact class selector silently matches nothing and every assertion passes
 * vacuously.
 *
 * The engine has always distinguished subendocardial ischaemia from transmural injury; until
 * the redraw there was nothing on screen that could show the difference, because the wall was
 * not drawn in layers at all. These assertions are what stop that gap reopening.
 */
describe('coronary diagram', () => {
  it('leaves both layers unshaded when supply meets demand', () => {
    const { container, derived } = draw({});

    expect(derived.anginaActive).toBe(false);
    expect(container.querySelector('[class*="endoIschaemic"]')).toBeNull();
    expect(container.querySelector('[class*="epiInjured"]')).toBeNull();
  });

  it('starves the inner layer first, and only the inner layer', () => {
    const { container, derived } = draw(CORONARY_PRESETS.tachycardicDanger);

    expect(derived.classification).toBe('subendocardial ischaemia');
    expect(container.querySelector('[class*="endoIschaemic"]')).not.toBeNull();
    // The subepicardium is still being perfused — that IS the distinction.
    expect(container.querySelector('[class*="epiInjured"]')).toBeNull();
  });

  it('takes the full wall thickness once the vessel occludes', () => {
    const inputs = { ...DEFAULT_CORONARY_INPUTS, ...CORONARY_PRESETS.vasospastic };
    let snapshot = { state: perturbVasospasm(createInitialState()), derived: computeDerived(createInitialState(), inputs) };
    for (let t = 0; t < 20; t += 1) snapshot = step(snapshot.state, inputs, 1);
    const { container } = render(<CoronaryDiagram derived={snapshot.derived} />);

    expect(snapshot.derived.transmuralInjuryActive).toBe(true);
    expect(container.querySelector('[class*="epiInjured"]')).not.toBeNull();
  });

  /** Tachycardia steals the window the wall is perfused in. The bar has to show that. */
  it('shrinks the diastolic block when the heart speeds up', () => {
    const widthOf = (preset: Partial<CoronaryInputs>) => {
      cleanup();
      const { container } = render(<CoronaryDiagram derived={settled(preset)} />);
      return Number(container.querySelector('[class*="diastoleBlock"]')?.getAttribute('width'));
    };

    const rested = widthOf({});
    const fast = widthOf(CORONARY_PRESETS.tachycardicDanger);

    expect(fast).toBeLessThan(rested);
  });

  /** The lesion is drawn to scale, so a tighter stenosis must draw a thinner lumen. */
  it('narrows the drawn lumen as the stenosis tightens', () => {
    const lumenOf = (preset: Partial<CoronaryInputs>) => {
      cleanup();
      const { container } = render(<CoronaryDiagram derived={settled(preset)} />);
      const lesion = [...container.querySelectorAll('[class*="arteryLumen"]')].at(-1) as SVGElement;
      return Number(lesion.style.strokeWidth);
    };

    expect(lumenOf(CORONARY_PRESETS.criticalStenosis)).toBeLessThan(lumenOf({}));
  });
});
