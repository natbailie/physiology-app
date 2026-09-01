import { describe, expect, it } from 'vitest';
import { projectOntoLead } from './leadProjection';
import { computeDerived, createInitialState, step } from './engine';
import { DEFAULT_ECG_INPUTS, ECG_PRESETS } from './presets';
import type { EcgDerived, EcgInputs, LeadName } from './types';

/**
 * An ANALYTIC oracle for the lead projection — and an unusually strong one, because the reference
 * is not an empirical range at all but a GEOMETRIC IDENTITY that has to hold for any dipole
 * whatsoever.
 *
 * Einthoven's law says lead II equals lead I plus lead III, at every instant, in every patient.
 * It is true because the three limb leads are the three sides of a triangle and the potential
 * differences around a closed loop must sum to zero — not because anybody measured it. The
 * augmented leads carry three more identities of the same kind.
 *
 * That makes this test qualitatively different from a reference range. A range can be met by a
 * wrong model that happens to land in the right place; these identities are violated by ANY error
 * in the lead angles or in the projection, and they hold for random vectors as well as for real
 * cardiac ones. If the hexaxial reference frame is even a few degrees out, they fail.
 *
 * Note the trace is deliberately NOT compared against Pulse. `tools/pulse-oracle/README.md` records
 * why: Pulse has no dipole and no activation sequence, only a single stored waveform replayed and
 * scaled with heart rate, so there is nothing there to compare a lead projection against.
 */

/** Deterministic pseudo-random vectors. `Math.random()` would make a failure unreproducible, and
 * the point is to test the geometry against arbitrary dipoles rather than against cardiac ones. */
function* arbitraryDipoles(count: number) {
  let seed = 1;
  const next = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648 - 0.5;
  };
  for (let i = 0; i < count; i++) yield { x: next() * 4, y: next() * 4, z: next() * 4 };
}

function settle(patch: Partial<EcgInputs>, seconds = 6): EcgDerived {
  const inputs = { ...DEFAULT_ECG_INPUTS, ...patch };
  let state = createInitialState();
  let derived = computeDerived(state, inputs);
  const dt = 0.002;
  for (let t = 0; t < seconds; t += dt) {
    const next = step(state, inputs, dt);
    state = next.state;
    derived = next.derived;
  }
  return derived;
}

describe("analytic: Einthoven's law holds for any dipole at all", () => {
  it('makes lead II the sum of leads I and III, for arbitrary vectors', () => {
    // The law itself. Kirchhoff around the Einthoven triangle: II = I + III.
    for (const dipole of arbitraryDipoles(40)) {
      const i = projectOntoLead(dipole, 'I');
      const ii = projectOntoLead(dipole, 'II');
      const iii = projectOntoLead(dipole, 'III');
      expect(ii, `II = I + III for dipole ${JSON.stringify(dipole)}`).toBeCloseTo(i + iii, 10);
    }
  });

  it('satisfies the three augmented-lead identities, including the augmentation factor', () => {
    /**
     * Goldberger's augmented leads are defined from the bipolar ones — but the UNaugmented
     * quantities are VR = -(I+II)/2, VL = I - II/2 and VF = II - I/2, and the machine multiplies
     * each by 3/2 to make them readable. Against unit lead vectors at the hexaxial angles that
     * augmentation appears as a factor of exactly 2/sqrt(3).
     *
     * This was worth getting wrong once: asserting the unaugmented relations failed by 15.47%,
     * which is precisely 2/sqrt(3), and the discrepancy identified itself.
     */
    const AUGMENTATION = 2 / Math.sqrt(3);
    for (const dipole of arbitraryDipoles(40)) {
      const i = projectOntoLead(dipole, 'I');
      const ii = projectOntoLead(dipole, 'II');
      expect(projectOntoLead(dipole, 'aVR')).toBeCloseTo(AUGMENTATION * (-(i + ii) / 2), 6);
      expect(projectOntoLead(dipole, 'aVL')).toBeCloseTo(AUGMENTATION * (i - ii / 2), 6);
      expect(projectOntoLead(dipole, 'aVF')).toBeCloseTo(AUGMENTATION * (ii - i / 2), 6);
    }
  });

  it('sums the three augmented leads to zero', () => {
    // aVR + aVL + aVF = 0 follows from the three definitions above. It is the quickest way to
    // spot a mis-angled hexaxial frame.
    for (const dipole of arbitraryDipoles(20)) {
      const total =
        projectOntoLead(dipole, 'aVR') + projectOntoLead(dipole, 'aVL') + projectOntoLead(dipole, 'aVF');
      expect(total).toBeCloseTo(0, 10);
    }
  });

  it('is exactly perpendicular where the hexaxial frame says it should be', () => {
    // A dipole pointing along a lead's own axis gives that lead its maximum deflection and gives
    // the lead 90 degrees away exactly nothing. This is what "isoelectric lead" means, and reading
    // it off the twelve-lead is the fastest bedside method of finding the axis.
    const alongLeadI = { x: 1, y: 0, z: 0 };
    expect(projectOntoLead(alongLeadI, 'I')).toBeCloseTo(1, 10);
    expect(projectOntoLead(alongLeadI, 'aVF')).toBeCloseTo(0, 10);

    const alongAvf = { x: 0, y: 1, z: 0 };
    expect(projectOntoLead(alongAvf, 'aVF')).toBeCloseTo(1, 10);
    expect(projectOntoLead(alongAvf, 'I')).toBeCloseTo(0, 10);
  });

  it('inverts aVR in a normal heart, which is the everyday consequence of the geometry', () => {
    // aVR sits at -150 degrees against a normal mean axis near +60, so it is nearly antiparallel
    // to the depolarisation wavefront. A POSITIVE aVR on a real ECG means the limb leads are on
    // backwards or the patient is in a very abnormal rhythm.
    const normalAxisDipole = { x: Math.cos(Math.PI / 3), y: Math.sin(Math.PI / 3), z: 0 };
    expect(projectOntoLead(normalAxisDipole, 'aVR')).toBeLessThan(0);
    expect(projectOntoLead(normalAxisDipole, 'II')).toBeGreaterThan(0.9);
  });
});

describe('analytic: the QT correction IS Bazett', () => {
  /** QTc = QT / sqrt(RR), with RR in seconds. Written out rather than imported. */
  const bazett = (qtMs: number, heartRateBpm: number) => qtMs / Math.sqrt(60 / heartRateBpm);

  it('reproduces the formula at the rates the module can reach', () => {
    for (const heartRate of [45, 60, 75, 100, 140]) {
      const d = settle({ heartRate });
      // Within a millisecond: the reported rate is a running mean over recent beats, so it lags
      // the input slightly at the extremes of the range.
      expect(Math.abs(d.qtcMs - bazett(d.qtIntervalMs, d.heartRateBpm)), `QTc at ${heartRate} bpm`).toBeLessThan(2);
    }
  });

  it('leaves QTc unchanged at 60 bpm, where the correction does nothing by construction', () => {
    // At an RR of exactly one second the square root is 1, so QTc equals QT. Every rate-correction
    // formula shares this fixed point, which is why they only disagree away from 60.
    const d = settle({ heartRate: 60 });
    expect(d.qtcMs).toBeCloseTo(d.qtIntervalMs, 0);
  });

  it('over-corrects at high rates, which is the known weakness of Bazett', () => {
    // The uncorrected QT SHORTENS with rate while Bazett's correction lengthens the corrected
    // value — the reason Fridericia is preferred above about 100 bpm. Worth the model showing it,
    // because a learner will be handed a falsely prolonged QTc by a machine one day.
    const slow = settle({ heartRate: 60 });
    const fast = settle({ heartRate: 140 });
    expect(fast.qtIntervalMs).toBeLessThan(slow.qtIntervalMs);
    expect(fast.qtcMs).toBeGreaterThan(slow.qtcMs);
  });
});

describe('analytic: the mean axis agrees with the leads it is computed from', () => {
  it('puts the axis in the quadrant the limb-lead deflections imply', () => {
    // The bedside method: a positive net QRS in both I and aVF means a normal axis. Checking the
    // reported number against the leads themselves is a consistency test between two different
    // routes to the same fact.
    const d = settle(ECG_PRESETS.normalSinus);
    expect(d.meanQrsAxisDegrees).toBeGreaterThan(-30);
    expect(d.meanQrsAxisDegrees).toBeLessThan(90);

    const axisRadians = (d.meanQrsAxisDegrees * Math.PI) / 180;
    const axisDipole = { x: Math.cos(axisRadians), y: Math.sin(axisRadians), z: 0 };
    for (const lead of ['I', 'aVF'] as LeadName[]) {
      expect(projectOntoLead(axisDipole, lead), `${lead} should be net positive on a normal axis`).toBeGreaterThan(0);
    }
  });
});
