import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, step } from './engine';
import { DEFAULT_VISION_INPUTS } from './presets';
import type { VisionDerived, VisionInputs } from './types';

/**
 * An ANALYTIC oracle for the pupil and for accommodation.
 *
 * The pupil reference is the Watson & Yellott (2012) unified formula, which reconciled the older
 * Stanley-Davies, Moon-Spencer and Holladay fits into one expression of diameter against
 * luminance, field size, age and the number of eyes. It is written out here rather than imported.
 *
 * Our model is NOT that formula — it is a sigmoid in a normalised brightness drive, because the
 * module is about the reflex ARC (afferent, efferent, consensual) rather than about photometry. So
 * what is tested is not point agreement but SHAPE: monotonic constriction with luminance, the
 * right diameters at the two ends of the range, and a monotonic curve in between. Where the two
 * genuinely diverge, this file says so rather than widening a tolerance.
 *
 * Accommodation is the opposite case: the demand is exactly the reciprocal of viewing distance,
 * which is a definition, and that is asserted as an identity.
 */

/**
 * Watson & Yellott (2012) unified formula, monocular, 30-degree field, age 30.
 *
 *   D = D_sd(L, a) with the Stanley-Davies core
 *     D_sd = 7.75 - 5.75 * ((L*a/846)^0.41 / ((L*a/846)^0.41 + 2))
 * plus an age correction about a reference age of 28.58.
 */
function watsonYellottMm(luminanceCdM2: number, fieldAreaDeg2 = 706.9, ageYears = 30, eyes = 1): number {
  const effective = luminanceCdM2 * fieldAreaDeg2 * (eyes === 1 ? 0.1 : 1);
  const x = Math.pow(effective / 846, 0.41);
  const stanleyDavies = 7.75 - 5.75 * (x / (x + 2));
  const ageTerm = (ageYears - 28.58) * (0.02132 - 0.009562 * stanleyDavies);
  return stanleyDavies + ageTerm;
}

function settle(patch: Partial<VisionInputs>, seconds = 40): VisionDerived {
  const inputs = { ...DEFAULT_VISION_INPUTS, ...patch };
  let state = createInitialState();
  let derived = computeDerived(state, inputs);
  const dt = 0.02;
  for (let t = 0; t < seconds; t += dt) {
    const next = step(state, inputs, dt);
    state = next.state;
    derived = next.derived;
  }
  return derived;
}

describe('analytic: the pupil against Watson & Yellott (2012)', () => {
  it('reproduces the published landmarks of the formula itself', () => {
    // Reference integrity first: if the formula as written here is wrong, nothing below means
    // anything. It should give roughly 2-3 mm in daylight and 6-7 mm in near darkness.
    expect(watsonYellottMm(1000)).toBeGreaterThan(2);
    expect(watsonYellottMm(1000)).toBeLessThan(4);
    expect(watsonYellottMm(0.001)).toBeGreaterThan(5.5);
    expect(watsonYellottMm(0.001)).toBeLessThan(7.8);
    // Monotonically decreasing in luminance, over the whole range.
    const diameters = [-3, -2, -1, 0, 1, 2, 3, 4].map((logCd) => watsonYellottMm(Math.pow(10, logCd)));
    for (let i = 1; i < diameters.length; i++) expect(diameters[i]!).toBeLessThan(diameters[i - 1]!);
  });

  it('constricts monotonically with luminance, as the formula does', () => {
    const ours = [-3, -2, -1, 0, 1, 2, 3, 4].map((sceneLuminanceLogCd) => settle({ sceneLuminanceLogCd }).pupilRightMm);
    for (let i = 1; i < ours.length; i++) {
      expect(ours[i]!, `pupil should not widen as luminance rises`).toBeLessThanOrEqual(ours[i - 1]! + 1e-9);
    }
  });

  it('lands in the right place at both ends of the range', () => {
    // Photopic 2-4 mm, scotopic 5-8 mm. Both models agree here; they are calibrated to the same
    // physiology even though the functional forms differ.
    const bright = settle({ sceneLuminanceLogCd: 3 });
    const dark = settle({ sceneLuminanceLogCd: -3 });
    expect(bright.pupilRightMm).toBeGreaterThan(1.8);
    expect(bright.pupilRightMm).toBeLessThan(4);
    expect(dark.pupilRightMm).toBeGreaterThan(5);
    expect(dark.pupilRightMm).toBeLessThan(8.5);
    // The total excursion is comparable to the formula's across the same seven log units.
    const theirSwing = watsonYellottMm(1e-3) - watsonYellottMm(1e4);
    const ourSwing = dark.pupilRightMm - bright.pupilRightMm;
    expect(ourSwing).toBeGreaterThan(theirSwing * 0.5);
    expect(ourSwing).toBeLessThan(theirSwing * 2);
  });

  it('keeps the two pupils EQUAL when only the afferent limb fails, which is the reflex arc', () => {
    // The afferent signal is shared bilaterally, so an optic nerve lesion produces a relative
    // afferent pupillary defect and NOT anisocoria. Anisocoria means the efferent limb. This is
    // the geometric consequence of the wiring rather than of any photometric formula, and it is
    // what the module is actually for.
    const afferent = settle({ leftOpticNerveAfferent: 0.1 });
    expect(Math.abs(afferent.anisocoriaMm)).toBeLessThan(0.2);

    const efferent = settle({ rightPupilEfferentGain: 0.2 });
    expect(Math.abs(efferent.anisocoriaMm)).toBeGreaterThan(0.5);
  });
});

describe('analytic: accommodative demand is the reciprocal of distance', () => {
  it('is exactly 1/distance in dioptres, which is a definition', () => {
    for (const targetDistanceMetres of [0.25, 0.5, 1, 2, 6]) {
      expect(settle({ targetDistanceMetres }).accommodationDemandD, `demand at ${targetDistanceMetres} m`).toBeCloseTo(
        1 / targetDistanceMetres,
        2,
      );
    }
  });

  it('puts the near point where the amplitude runs out', () => {
    // Near point in metres is 1 / amplitude, so a 4 D presbyope cannot focus closer than 25 cm and
    // an 8 D young adult reaches 12.5 cm. The relation is the same reciprocal.
    const young = settle({ maximumAccommodationD: 8 });
    expect(young.nearPointCm).toBeCloseTo(100 / 8, 0);
    const presbyope = settle({ maximumAccommodationD: 2 });
    expect(presbyope.nearPointCm).toBeCloseTo(100 / 2, 0);
  });

  it('leaves a deficit only when demand exceeds amplitude', () => {
    // Reading at 25 cm needs 4 D. A 2 D presbyope is 2 D short; an 8 D young adult is not short
    // at all. That subtraction is the whole of presbyopia.
    const presbyope = settle({ targetDistanceMetres: 0.25, maximumAccommodationD: 2 });
    expect(presbyope.accommodationDeficitD).toBeCloseTo(4 - 2, 1);
    const young = settle({ targetDistanceMetres: 0.25, maximumAccommodationD: 8 });
    expect(young.accommodationDeficitD).toBeCloseTo(0, 2);
  });
});
