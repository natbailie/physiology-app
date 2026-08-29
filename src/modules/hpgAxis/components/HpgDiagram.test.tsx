// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { HpgDiagram } from './HpgDiagram';
import { computeDerived, createInitialState, step } from '../engine/engine';
import { DEFAULT_HPG_INPUTS, HPG_PRESETS } from '../engine/presets';
import type { HpgDerived, HpgInputs } from '../engine/types';

afterEach(cleanup);

/** Selectors are `[class*="name"]`, not `.name`: CSS modules render as `_name_hash` under Vitest. */
function run(preset: Partial<HpgInputs>, seconds: number, capture?: (d: HpgDerived) => boolean) {
  const inputs = { ...DEFAULT_HPG_INPUTS, ...preset };
  let state = createInitialState();
  let derived = computeDerived(state, inputs);
  let caught: HpgDerived | null = null;
  for (let t = 0; t < seconds; t += 1) {
    const next = step(state, inputs, 1);
    state = next.state;
    derived = next.derived;
    if (capture && !caught && capture(derived)) caught = derived;
  }
  return caught ?? derived;
}

function draw(derived: HpgDerived) {
  return render(<HpgDiagram derived={derived} />).container;
}

describe('HPG axis diagram', () => {
  it('draws an ovary with follicles for a female axis and tubules for a male one', () => {
    // Count before unmounting: cleanup() empties the container it is holding.
    const female = draw(run(HPG_PRESETS.normalFemaleCycle, 2000));
    const follicles = female.querySelectorAll('[class*="antralFollicle"]').length;
    const femaleTubules = female.querySelectorAll('[class*="tubule"]').length;
    cleanup();
    const male = draw(run(HPG_PRESETS.normalMaleAxis, 2000));

    expect(follicles).toBeGreaterThan(0);
    expect(femaleTubules).toBe(0);
    expect(male.querySelectorAll('[class*="tubule"]').length).toBeGreaterThan(0);
  });

  /**
   * The one place in the body where a steroid drives its own trophic hormone up. The feedback
   * arrowhead is the whole point of drawing feedback as a signed edge: at the surge it stops
   * being a crossbar and becomes an arrow.
   */
  it('flips the feedback arrow to excitatory at the LH surge', () => {
    const surge = run(HPG_PRESETS.normalFemaleCycle, 60000, (d) => d.feedbackMode === 'positive');
    expect(surge.feedbackMode).toBe('positive');

    const surging = draw(surge);
    const marker = [...surging.querySelectorAll('path')]
      .map((p) => p.getAttribute('marker-end'))
      .filter((m) => m === 'url(#axisExcite)' || m === 'url(#axisInhibit)');
    expect(marker).toContain('url(#axisExcite)');
    expect(marker).not.toContain('url(#axisInhibit)');

    cleanup();
    const follicular = draw(run(HPG_PRESETS.normalFemaleCycle, 400));
    const resting = [...follicular.querySelectorAll('path')].map((p) => p.getAttribute('marker-end'));
    expect(resting).toContain('url(#axisInhibit)');
  });

  /**
   * A GnRH agonist given continuously — leuprolide — shuts the axis down rather than driving it,
   * because the pituitary reads frequency, not amount. The pulse train collapsing to a flat line
   * is the drawing saying exactly that.
   */
  it('collapses the pulse train to a continuous line and drops responsiveness under continuous GnRH', () => {
    const pulsatile = run({}, 2000);
    const continuous = run({ gnrhPulseFrequency: 0.05 }, 2000);

    const withPulses = draw(pulsatile);
    expect(withPulses.querySelectorAll('[class*="pulseSpike"]').length).toBeGreaterThan(0);
    expect(withPulses.querySelector('[class*="pulseContinuous"]')).toBeNull();

    cleanup();
    const flat = draw(continuous);
    expect(flat.querySelector('[class*="pulseContinuous"]')).not.toBeNull();
    expect(flat.querySelectorAll('[class*="pulseSpike"]').length).toBe(0);

    expect(continuous.pituitaryResponsiveness).toBeLessThan(pulsatile.pituitaryResponsiveness);
  });

  /** Exogenous testosterone enters the circulation, and the gonad it suppresses shrinks with it. */
  it('draws the exogenous route only when a steroid is actually being given', () => {
    const onSteroid = draw(run(HPG_PRESETS.anabolicSteroidUse, 4000));
    expect(onSteroid.querySelector('[class*="exogenous"]')).not.toBeNull();

    cleanup();
    const untreated = draw(run(HPG_PRESETS.normalMaleAxis, 4000));
    expect(untreated.querySelector('[class*="exogenous"]')).toBeNull();
  });

  /** Gonadal failure: no steroid, no inhibin, so the gonadotrophins climb — hypergonadotropic. */
  it('empties the gonad while the gonadotrophins climb in primary hypogonadism', () => {
    const failed = run(HPG_PRESETS.primaryHypogonadism, 4000);
    const normal = run(HPG_PRESETS.normalMaleAxis, 4000);

    expect(failed.testosteroneLevel).toBeLessThan(normal.testosteroneLevel);
    expect(failed.lhLevel).toBeGreaterThan(normal.lhLevel);
    expect(failed.fshLevel).toBeGreaterThan(normal.fshLevel);
  });
});
