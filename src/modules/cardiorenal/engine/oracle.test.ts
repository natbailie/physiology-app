/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbBloodVolume, step } from './engine';
import { DEFAULT_INPUTS, PRESETS } from './presets';
import type { DerivedValues, SimInputs, SimState } from './types';

/**
 * Reference trace from the Pulse Physiology Engine's own baroreflex test scenario — see
 * `tools/pulse-oracle/`. Pulse is independently built and separately validated, so agreeing
 * with it is evidence in a way that agreeing with our own constants is not.
 *
 * Everything is compared as a FRACTION of each engine's own baseline. That is not a way of
 * loosening the test — the two models are not in the same units. Our `bloodVolume`, `gfr` and
 * `urineOutput` are NORMALISED (100 = normal), where Pulse reports litres and mL/min, and Pulse
 * models a 5.49 L reference patient against our 5 L.
 */

interface OracleSample {
  t: number;
  bloodVolumeL: number;
  heartRateBpm: number;
  meanArterialPressureMmHg: number;
  cardiacOutputLPerMin: number;
  systemicVascularResistance: number;
  glomerularFiltrationRateMlPerMin: number;
  renalBloodFlowLPerMin: number;
  urineProductionRateMlPerMin: number;
}

interface OracleTrace {
  scenario: string;
  landmarks: Record<string, number>;
  samples: OracleSample[];
}

const trace = JSON.parse(
  readFileSync(fileURLToPath(new URL('./__oracle__/baroreflex-class1.json', import.meta.url)), 'utf8'),
) as OracleTrace;

function at(landmark: string): OracleSample {
  const t = trace.landmarks[landmark];
  const sample = trace.samples.find((s) => s.t === t);
  if (!sample) throw new Error(`no sample at landmark "${landmark}" (t=${t})`);
  return sample;
}

function run(patch: Partial<SimInputs>, seconds: number, from?: SimState) {
  const inputs = { ...DEFAULT_INPUTS, ...patch };
  let state = from ?? createInitialState();
  let derived = computeDerived(state, inputs);
  let t = 0;
  while (t < seconds) {
    const dt = Math.min(seconds - t, 0.2);
    t += dt;
    const next = step(state, inputs, dt);
    state = next.state;
    derived = next.derived;
  }
  return { state, derived };
}

const pulseBaseline = at('baseline');
const pulseSettled = at('settled');

// Pulse bleeds 1000 mL/min for 30 s out of a 5.49 L patient — a ~9% loss. `bloodVolume` here is
// normalised, so the equivalent perturbation is a multiplier, and the observation window is the
// same 200 s Pulse watches for.
const ourBase = run(PRESETS.normal, 3000);
const ourBled = run(PRESETS.normal, 200, perturbBloodVolume(ourBase.state, 0.9));

const theirFraction = (key: keyof OracleSample) =>
  (pulseSettled[key] - pulseBaseline[key]) / pulseBaseline[key];
const ourFraction = (key: keyof DerivedValues) =>
  ((ourBled.derived[key] as number) - (ourBase.derived[key] as number)) /
  (ourBase.derived[key] as number);

describe('oracle: the trace is the scenario it claims to be', () => {
  it('records a Class I loss — under 15% of blood volume', () => {
    const lost = (pulseBaseline.bloodVolumeL - pulseSettled.bloodVolumeL) / pulseBaseline.bloodVolumeL;
    expect(lost).toBeGreaterThan(0.05);
    expect(lost).toBeLessThan(0.15);
  });
});

describe('oracle: baseline agrees with an independently validated engine', () => {
  it('puts a normal adult at the same arterial pressure Pulse does', () => {
    expect(ourBase.derived.meanArterialPressure).toBeGreaterThan(pulseBaseline.meanArterialPressureMmHg - 5);
    expect(ourBase.derived.meanArterialPressure).toBeLessThan(pulseBaseline.meanArterialPressureMmHg + 5);
  });

  it('puts a normal adult at the same heart rate Pulse does', () => {
    expect(ourBase.derived.effectiveHeartRate).toBeGreaterThan(pulseBaseline.heartRateBpm - 5);
    expect(ourBase.derived.effectiveHeartRate).toBeLessThan(pulseBaseline.heartRateBpm + 5);
  });
});

describe('oracle: the reflex responds the way Pulse’s does', () => {
  const moves = [
    ['mean arterial pressure', 'meanArterialPressureMmHg', 'meanArterialPressure', 'falls'],
    ['cardiac output', 'cardiacOutputLPerMin', 'cardiacOutput', 'falls'],
    ['renal blood flow', 'renalBloodFlowLPerMin', 'renalBloodFlow', 'falls'],
    ['urine output', 'urineProductionRateMlPerMin', 'urineOutput', 'falls'],
    ['heart rate', 'heartRateBpm', 'effectiveHeartRate', 'rises'],
    ['systemic vascular resistance', 'systemicVascularResistance', 'effectiveSVR', 'rises'],
  ] as const;

  for (const [label, theirs, ours, direction] of moves) {
    it(`${direction} ${label}, as Pulse does`, () => {
      const sign = direction === 'falls' ? -1 : 1;
      expect(theirFraction(theirs) * sign).toBeGreaterThan(0);
      expect(ourFraction(ours) * sign).toBeGreaterThan(0);
    });
  }

  it('defends arterial pressure far better than it defends flow — which is the reflex', () => {
    // Both engines give up cardiac output to hold pressure up. If pressure ever fell as hard as
    // flow did, the baroreflex would not be doing anything.
    expect(Math.abs(theirFraction('meanArterialPressureMmHg'))).toBeLessThan(
      Math.abs(theirFraction('cardiacOutputLPerMin')) / 2,
    );
    expect(Math.abs(ourFraction('meanArterialPressure'))).toBeLessThan(
      Math.abs(ourFraction('cardiacOutput')) / 2,
    );
  });

  it('holds GFR almost still while renal blood flow falls — renal autoregulation', () => {
    // The teaching point of the module, and both engines produce it: filtration is defended
    // even as the flow feeding it drops away.
    expect(Math.abs(theirFraction('glomerularFiltrationRateMlPerMin'))).toBeLessThan(0.05);
    expect(Math.abs(ourFraction('gfr'))).toBeLessThan(0.05);
    expect(Math.abs(theirFraction('renalBloodFlowLPerMin'))).toBeGreaterThan(
      Math.abs(theirFraction('glomerularFiltrationRateMlPerMin')),
    );
    expect(Math.abs(ourFraction('renalBloodFlow'))).toBeGreaterThan(Math.abs(ourFraction('gfr')));
  });
});

describe('oracle: the reflex leans on RATE, not only on resistance', () => {
  /**
   * This was an open divergence and is now the thing under test. We used to answer a ~9% loss with
   * +2.5% heart rate against Pulse's +17%, and the shockStates oracle found the same
   * under-response at the other end of the severity range — one shared assumption, two modules.
   *
   * Two things were wrong and both are corrected. Reflex drive was LINEAR in the pressure error and
   * saturated only 40 mmHg from setpoint, so almost all its gain sat in territory nobody survives;
   * and preload fell in proportion to blood volume, so a 9% loss cost 9% of stroke volume where
   * Pulse loses 24%. See `BAROREFLEX.HALF_ACTIVATION_ERROR_MMHG` and
   * `STARLING.SUB_BASELINE_EXPONENT`.
   */
  it('answers a Class I loss with a tachycardia of the order Pulse produces', () => {
    const theirs = theirFraction('heartRateBpm');
    const ours = ourFraction('effectiveHeartRate');
    expect(theirs).toBeGreaterThan(0.1);
    // Compared as a BAND rather than a value: the two engines model different patients, and the
    // claim worth holding is that the rate arm carries compensation of the same magnitude.
    expect(ours).toBeGreaterThan(theirs * 0.6);
    expect(ours).toBeLessThan(theirs * 1.6);
  });

  it('gives up stroke volume the way Pulse does, which is what the rate is compensating for', () => {
    // The reason the rate response was too small: filling, and so stroke volume, barely moved.
    expect(ourFraction('strokeVolume')).toBeLessThan(-0.1);
  });
});
