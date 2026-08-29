// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { HearingDiagram } from './HearingDiagram';
import { computeDerived, createInitialState, step } from '../engine/engine';
import { DEFAULT_HEARING_INPUTS, HEARING_PRESETS } from '../engine/presets';
import type { HearingInputs } from '../engine/types';

afterEach(cleanup);

/**
 * The air–bone gap is this module's diagnostic content, so the drawing has to show two routes
 * and let one fail without the other. These assertions hold that apart.
 *
 * Selectors are `[class*="name"]`, not `.name`: CSS modules render as `_name_hash` under Vitest.
 */
function settled(preset: Partial<HearingInputs>, seconds = 20) {
  const inputs = { ...DEFAULT_HEARING_INPUTS, ...preset };
  let snapshot = { state: createInitialState(), derived: computeDerived(createInitialState(), inputs) };
  for (let t = 0; t < seconds; t += 1) snapshot = step(snapshot.state, inputs, 1);
  return snapshot.derived;
}

function draw(preset: Partial<HearingInputs>) {
  const derived = settled(preset);
  const { container } = render(<HearingDiagram derived={derived} />);
  return { container, derived };
}

const conductionOf = (container: HTMLElement) =>
  Number((container.querySelector('[class*="ossicles"]') as SVGElement).style.getPropertyValue('--conduction'));

/** Hair-cell loss along the duct, apex-first (index 0 is the lowest frequency). */
const cochlearLoss = (container: HTMLElement) =>
  [...container.querySelectorAll('[class*="hairCells"]')].map((e) =>
    Number((e as SVGElement).style.getPropertyValue('--loss')),
  );

describe('ear diagram', () => {
  it('passes sound through an intact chain and leaves the cochlea unshaded', () => {
    const { container } = draw(HEARING_PRESETS.normal);

    expect(conductionOf(container)).toBeGreaterThan(0.9);
    expect(Math.max(...cochlearLoss(container))).toBeLessThan(0.2);
  });

  /**
   * A fixed stapes stops the ossicles conducting and does nothing at all to the cochlea. Both
   * halves of that have to be visible, because their difference is the gap.
   */
  it('fails the ossicular chain in otosclerosis while sparing the hair cells', () => {
    const { container, derived } = draw(HEARING_PRESETS.otosclerosis);

    expect(derived.airBoneGapDb).toBeGreaterThan(15);
    expect(conductionOf(container)).toBeLessThan(0.5);
    expect(Math.max(...cochlearLoss(container))).toBeLessThan(0.2);
  });

  /** The mirror image: hair cells lost, chain untouched, no gap. */
  it('damages the cochlea and not the chain in sensorineural loss', () => {
    const { container, derived } = draw(HEARING_PRESETS.severeCochlearLoss);

    expect(derived.airBoneGapDb).toBeLessThan(12);
    expect(conductionOf(container)).toBeGreaterThan(0.8);
    expect(Math.max(...cochlearLoss(container))).toBeGreaterThan(0.3);
  });

  /**
   * Noise takes the basal turn. Drawn along the tonotopic axis that is damage part-way down the
   * duct, which is the thing an audiogram's 4 kHz notch is actually telling you.
   */
  it('puts noise damage at the basal end of the duct, not the apex', () => {
    const { container } = draw(HEARING_PRESETS.noiseNotch);
    const loss = cochlearLoss(container);
    const apexHalf = loss.slice(0, loss.length / 2);
    const baseHalf = loss.slice(loss.length / 2);

    expect(Math.max(...baseHalf)).toBeGreaterThan(Math.max(...apexHalf));
  });

  it('moves the travelling wave along the duct with the stimulus frequency', () => {
    const markAt = (hz: number) => {
      cleanup();
      const { container } = render(<HearingDiagram derived={settled({ stimulusFrequencyHz: hz })} />);
      return Number((container.querySelector('[class*="placeMark"]') as SVGElement).getAttribute('x1'));
    };

    // High frequencies sit at the base, which is drawn on the left.
    expect(markAt(8000)).toBeLessThan(markAt(250));
  });
});
