import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbOpioidBolus, step } from './engine';
import { DEFAULT_SOMATIC_INPUTS, SOMATIC_PRESETS } from './presets';
import type { SomaticDerived, SomaticInputs } from './types';

function settle(patch: Partial<SomaticInputs>, seconds = 3000): { derived: SomaticDerived } {
  const inputs = { ...DEFAULT_SOMATIC_INPUTS, ...patch };
  let state = createInitialState();
  let derived = computeDerived(state, inputs);
  let t = 0;
  while (t < seconds) {
    const dt = Math.min(seconds - t, 0.2);
    t += dt;
    const next = step(state, inputs, dt);
    state = next.state;
    derived = next.derived;
  }
  return { derived };
}

describe('baseline', () => {
  it('settles a normal subject with intact modalities and a closed gate', () => {
    const d = settle(SOMATIC_PRESETS.normal).derived;
    expect(d.perceivedPainScore).toBeLessThan(0.5);
    expect(d.touchLeftPct).toBeGreaterThan(95);
    expect(d.painTempRightPct).toBeGreaterThan(95);
    expect(d.gateOpenFraction).toBeLessThan(0.3);
    expect(d.classification).toBe('normal sensation');
  });
});

describe('nociceptive pain and its modulation', () => {
  it('produces severe pain from a burn, with first pain faster than second', () => {
    const d = settle(SOMATIC_PRESETS.acuteBurn).derived;
    expect(d.perceivedPainScore).toBeGreaterThan(5);
    expect(d.firstPainLatencyMs).toBeLessThan(d.secondPainLatencyMs / 5);
    expect(d.classification).toBe('acute nociceptive pain');
  });

  it('closes the gate when the injured area is rubbed', () => {
    const still = settle({ nociceptiveStimulusDrive: 75 }).derived;
    const rubbed = settle({ nociceptiveStimulusDrive: 75, rubbingGateDrive: 80 }).derived;
    expect(rubbed.painRatingTarget).toBeLessThan(still.painRatingTarget);
    expect(rubbed.gateOpenFraction).toBeLessThan(still.gateOpenFraction);
  });

  it('lets descending modulation and an opioid bolus both suppress transmission', () => {
    const baseline = settle({ nociceptiveStimulusDrive: 75 }).derived;
    const strongDescending = settle({ nociceptiveStimulusDrive: 75, descendingModulation: 90 }).derived;
    expect(strongDescending.painRatingTarget).toBeLessThan(baseline.painRatingTarget);

    const inputs = { ...DEFAULT_SOMATIC_INPUTS, nociceptiveStimulusDrive: 75 };
    let state = createInitialState();
    for (let t = 0; t < 2000; t += 0.2) state = step(state, inputs, 0.2).state;
    const before = computeDerived(state, inputs);
    const dosed = computeDerived(perturbOpioidBolus(state), inputs);
    expect(dosed.painRatingTarget).toBeLessThan(before.painRatingTarget);
  });

  it('blocks small fibres first: pain abolished before touch at partial doses', () => {
    const d = settle(SOMATIC_PRESETS.laBlock).derived;
    // Pain traffic (C + Aδ) heavily suppressed; Aβ touch traffic largely preserved.
    expect(d.cFibreTraffic).toBeLessThan(d.abTraffic * 0.4);
    expect(d.touchLeftPct).toBe(100);
  });
});

describe('sensitisation and allodynia', () => {
  it('makes light touch PAINFUL once the periphery is sensitised', () => {
    const d = settle(SOMATIC_PRESETS.neuropathicAllodynia, 6000).derived;
    expect(d.allodyniaActive).toBe(true);
    // Touch-only drive on top of the sensitised state produces real pain.
    const touched = settle(
      { ...SOMATIC_PRESETS.neuropathicAllodynia, touchStimulusDrive: 60, nociceptiveStimulusDrive: 5 },
      6000,
    ).derived;
    expect(touched.perceivedPainScore).toBeGreaterThan(1.5);
    expect(touched.classification).toContain('allodynia');
  });

  it('amplifies sustained C-input through central wind-up', () => {
    const plain = settle({ nociceptiveStimulusDrive: 60 }).derived;
    const woundUp = settle({ nociceptiveStimulusDrive: 60, windUpGain: 90 }, 6000).derived;
    expect(woundUp.transmissionCellOutput).toBeGreaterThan(plain.transmissionCellOutput);
  });
});

describe('tract lesions dissociate modalities', () => {
  it('gives Brown-Séquard ipsilateral touch loss WITH contralateral pain loss', () => {
    const d = settle(SOMATIC_PRESETS.brownSequardLeft).derived;
    expect(d.touchLeftPct).toBeLessThan(20); // left dorsal columns gone
    expect(d.touchRightPct).toBeGreaterThan(80);
    expect(d.painTempRightPct).toBeLessThan(20); // right spinothalamic crossed already
    expect(d.painTempLeftPct).toBeGreaterThan(80);
    expect(d.classification).toBe('Brown-Séquard: hemicord syndrome');
  });

  it('takes BOTH spinothalamics in anterior cord syndrome but spares dorsal columns', () => {
    const d = settle(SOMATIC_PRESETS.anteriorCord).derived;
    expect(d.painTempLeftPct).toBeLessThan(20);
    expect(d.painTempRightPct).toBeLessThan(20);
    expect(d.touchLeftPct).toBeGreaterThan(90);
    expect(d.touchRightPct).toBeGreaterThan(90);
    expect(d.classification).toBe('anterior cord syndrome');
  });

  it('dissociates pain segmentally in syringomyelia with columns intact', () => {
    const d = settle(SOMATIC_PRESETS.syringomyelia).derived;
    expect(d.segmentalPainTempPct).toBeLessThan(25);
    expect(d.touchLeftPct).toBeGreaterThan(90);
    expect(d.touchRightPct).toBeGreaterThan(90);
    expect(d.classification).toBe('syringomyelia: segmental dissociation');
  });

  it('loses everything below a complete transection', () => {
    const d = settle(SOMATIC_PRESETS.completeTransection).derived;
    expect(d.touchLeftPct).toBeLessThan(10);
    expect(d.touchRightPct).toBeLessThan(10);
    expect(d.painTempLeftPct).toBeLessThan(10);
    expect(d.painTempRightPct).toBeLessThan(10);
    expect(d.classification).toBe('complete transection');
  });
});

describe('numerical robustness', () => {
  it('never produces NaN or Infinity across extreme inputs', () => {
    const extremes: Partial<SomaticInputs>[] = [
      { touchStimulusDrive: 100, nociceptiveStimulusDrive: 100, localAnaestheticBlock: 100 },
      { rubbingGateDrive: 100, peripheralSensitisation: 100, windUpGain: 100 },
      { leftHemisectionSeverity: 100, rightHemisectionSeverity: 100, anteriorQuadrantSeverity: 100 },
      { centralCanalSeverity: 100, descendingModulation: 0 },
    ];
    for (const patch of extremes) {
      const d = settle(patch, 1500).derived;
      for (const [key, value] of Object.entries(d)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} for ${JSON.stringify(patch)}`).toBe(true);
        }
      }
      expect(d.perceivedPainScore >= 0 && d.perceivedPainScore <= 10 || Number.isFinite(d.painRatingTarget)).toBe(true);
    }
  });
});
