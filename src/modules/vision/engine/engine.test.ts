import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbBrightGlare, perturbLightsOut, perturbShineTorch, step } from './engine';
import { DEFAULT_VISION_INPUTS, VISION_PRESETS } from './presets';
import type { VisionDerived, VisionInputs } from './types';

function settle(patch: Partial<VisionInputs>, seconds = 9000): VisionDerived {
  const inputs = { ...DEFAULT_VISION_INPUTS, ...patch };
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
  return derived;
}

describe('baseline', () => {
  it('settles a normal adult in daylight on textbook values', () => {
    const d = settle(VISION_PRESETS.normalDaylight);
    expect(d.regime).toBe('photopic');
    expect(d.pupilRightMm).toBeGreaterThan(2.2);
    expect(d.pupilRightMm).toBeLessThan(5);
    expect(d.acuityDenominator).toBeLessThanOrEqual(6);
    expect(d.rapdPositive).toBe(false);
    expect(d.classification).toBe('photopic');
  });
});

describe('the pupil light reflex', () => {
  it('dilates both pupils in darkness, equally', () => {
    const day = settle(VISION_PRESETS.normalDaylight);
    const night = settle({ sceneLuminanceLogCd: -4 });
    expect(night.pupilRightMm).toBeGreaterThan(day.pupilRightMm);
    expect(night.pupilRightMm).toBeGreaterThan(5.5);
    expect(Math.abs(night.pupilRightMm - night.pupilLeftMm)).toBeLessThan(0.3);
  });

  it('responds to a persistent step down in luminance (lights out)', () => {
    const inputs = { ...DEFAULT_VISION_INPUTS };
    let s2 = perturbLightsOut(createInitialState());
    for (let t = 0; t < 3000; t += 0.2) s2 = step(s2, inputs, 0.2).state;
    const after = computeDerived(s2, inputs);
    const day = settle(VISION_PRESETS.normalDaylight);
    expect(after.effectiveLuminanceLogCd).toBeLessThan(day.effectiveLuminanceLogCd);
    expect(after.pupilRightMm).toBeGreaterThan(day.pupilRightMm);
  });

  it('keeps the pupils EQUAL with an afferent defect but UNEQUAL with an efferent one', () => {
    const rapd = settle(VISION_PRESETS.opticNeuritisLeft);
    expect(rapd.rapdPositive).toBe(true);
    expect(rapd.anisocoriaMm).toBeLessThan(0.5);

    const efferent = settle(VISION_PRESETS.fixedDilatedRight);
    expect(efferent.anisocoriaMm).toBeGreaterThan(CLINICAL_ANISOCORIA);
    expect(efferent.rapdPositive).toBe(false);
  });

  it('preserves the consensual reflex when the efferent limb is dead', () => {
    const inputs = { ...DEFAULT_VISION_INPUTS, ...VISION_PRESETS.fixedDilatedRight };
    let state = createInitialState();
    for (let t = 0; t < 1500; t += 0.2) state = step(state, inputs, 0.2).state;
    const atRest = computeDerived(state, inputs);

    const duringFlash = computeDerived(perturbShineTorch(state, 1), inputs);

    // The right pupil cannot constrict — its efferent supply is gone.
    expect(duringFlash.pupilRightMm).toBeCloseTo(atRest.pupilRightMm, 1);
    // The left pupil still constricts consensually: afferents and its own efferent are intact.
    expect(duringFlash.pupilLeftMm).toBeLessThan(atRest.pupilLeftMm - 0.8);
    expect(duringFlash.directReflexLeftScore).toBeGreaterThan(
      duringFlash.directReflexRightScore + 12,
    );
  });

  it('weakens BOTH pupils when the torch shines in the optic-neuritic eye', () => {
    const inputs = { ...DEFAULT_VISION_INPUTS, ...VISION_PRESETS.opticNeuritisLeft };
    let state = createInitialState();
    for (let t = 0; t < 1500; t += 0.2) state = step(state, inputs, 0.2).state;

    const normalEye = computeDerived(perturbShineTorch(state, 1), inputs);
    const affectedEye = computeDerived(perturbShineTorch(state, -1), inputs);

    expect(normalEye.directReflexRightScore).toBeGreaterThan(
      affectedEye.directReflexLeftScore * 1.5,
    );
  });
});

describe('the dual receptor system', () => {
  it('gives usable starlight vision with healthy rods but poor acuity (the fovea is blind)', () => {
    const d = settle(VISION_PRESETS.starlight);
    expect(d.nightBlindness).toBe(false);
    expect(d.regime).toBe('scotopic');
    // Rod-only resolution collapses toward the peripheral ceiling.
    expect(d.acuityDenominator).toBeGreaterThanOrEqual(24);
  });

  it('makes retinitis pigmentosa night-blind while daylight vision is spared', () => {
    const night = settle(VISION_PRESETS.retinitisPigmentosa);
    expect(night.nightBlindness).toBe(true);
    expect(night.classification).toBe('night blindness (rod failure)');

    const day = settle({ ...VISION_PRESETS.retinitisPigmentosa, sceneLuminanceLogCd: 2 });
    expect(day.nightBlindness).toBe(false);
    expect(day.acuityDenominator).toBeLessThanOrEqual(9);
  });

  it('makes macular degeneration a DAYLIGHT acuity problem with normal pupils', () => {
    const d = settle(VISION_PRESETS.macularDegeneration);
    expect(d.acuityDenominator).toBeGreaterThanOrEqual(18);
    // The retinal SIGNAL is weak even though the scene is bright — the fovea cannot read it.
    expect(d.perceivedBrightness).toBeLessThan(60);
    expect(d.pupilRightMm).toBeLessThan(4.5);
    expect(d.anisocoriaMm).toBeLessThan(0.5);
    expect(d.classification).toBe('macular cone failure');
  });

  it('sends glutamate FALLING as light rises — the sign inversion of phototransduction', () => {
    const bright = settle({ sceneLuminanceLogCd: 3 });
    const dark = settle({ sceneLuminanceLogCd: -4 });
    expect(bright.glutamateRelease).toBeLessThan(0.3);
    expect(dark.glutamateRelease).toBeGreaterThan(0.7);
    expect(bright.glutamateRelease).toBeLessThan(dark.glutamateRelease);
  });
});

describe('adaptation and bleaching', () => {
  it('leaves a flashed eye temporarily blind until rhodopsin regenerates', () => {
    const inputs = { ...DEFAULT_VISION_INPUTS };
    // Adapt to a dim scene first, where the bleach will matter.
    const dimInputs = { ...inputs, sceneLuminanceLogCd: -3.5 };
    let state = createInitialState();
    for (let t = 0; t < 8000; t += 0.2) state = step(state, dimInputs, 0.2).state;
    const adaptedBefore = computeDerived(state, dimInputs);

    const flashed = perturbBrightGlare(state);
    const immediatelyAfter = computeDerived(flashed, dimInputs);
    expect(flashed.bleachedFraction).toBeGreaterThan(0.9);
    expect(adaptedBefore.perceivedBrightness).toBeGreaterThan(immediatelyAfter.perceivedBrightness);

    // Pigment regenerates over simulated minutes and sensitivity returns.
    let recovered = flashed;
    for (let t = 0; t < 12000; t += 0.2) recovered = step(recovered, dimInputs, 0.2).state;
    expect(computeDerived(recovered, dimInputs).perceivedBrightness).toBeGreaterThan(
      immediatelyAfter.perceivedBrightness,
    );
  });

  it('shifts rod adaptation down through the mesopic band as darkness deepens', () => {
    const dusk = settle({ sceneLuminanceLogCd: -2 });
    const deepNight = settle({ sceneLuminanceLogCd: -5 });
    expect(deepNight.regime).toBe('scotopic');
    expect(dusk.regime).toBe('mesopic');
    expect(deepNight.rodDrive).toBeGreaterThan(0.8);
  });
});

const CLINICAL_ANISOCORIA = 1.5;

describe('the aqueous circulation', () => {
  it('settles a normal eye inside the textbook pressure range', () => {
    const d = settle(VISION_PRESETS.normalDaylight);
    expect(d.intraocularPressureMmHg).toBeGreaterThanOrEqual(10);
    expect(d.intraocularPressureMmHg).toBeLessThanOrEqual(21);
    expect(d.angleClosureFraction).toBeLessThan(0.05);
  });

  it('makes a failing trabecular meshwork a silent, painless rise', () => {
    const glaucoma = settle(VISION_PRESETS.openAngleGlaucoma);
    expect(glaucoma.intraocularPressureMmHg).toBeGreaterThan(21);
    expect(glaucoma.classification).toBe('chronic glaucoma (open angle)');
    // Nothing is occluded: the angle is open, the drainage is merely resistant.
    expect(glaucoma.angleClosureFraction).toBeLessThan(0.05);
  });

  it('lowers pressure when carbonic anhydrase is blocked — production meets outflow again', () => {
    const untreated = settle(VISION_PRESETS.openAngleGlaucoma);
    const treated = settle({ ...VISION_PRESETS.openAngleGlaucoma, acetazolamideDosePct: 70 });
    expect(treated.intraocularPressureMmHg).toBeLessThan(untreated.intraocularPressureMmHg - 4);
  });

  it('provokes an acute crisis when a mydriatic meets an occludable angle', () => {
    const crisis = settle({ ...VISION_PRESETS.acuteAngleClosure }, 12000);
    expect(crisis.intraocularPressureMmHg).toBeGreaterThan(40);
    expect(crisis.angleClosureFraction).toBeGreaterThan(0.7);
    expect(crisis.classification).toBe('acute angle closure');
  });

  it('rescues the crisis with pilocarpine, which reopens the meshwork mechanically', () => {
    const crisisInputs = { ...DEFAULT_VISION_INPUTS, ...VISION_PRESETS.acuteAngleClosure };
    const rescued = settle({ ...crisisInputs, pilocarpineDosePct: 90 }, 12000);
    const untreated = settle(crisisInputs, 12000);
    expect(rescued.intraocularPressureMmHg).toBeLessThan(untreated.intraocularPressureMmHg - 15);
    expect(rescued.angleClosureFraction).toBeLessThan(untreated.angleClosureFraction * 0.3);
  });

  it('dilates a WIDE-angle eye safely: pressure barely moves', () => {
    const before = settle({});
    const after = settle({ mydriaticDosePct: 90 });
    expect(Math.abs(after.intraocularPressureMmHg - before.intraocularPressureMmHg)).toBeLessThan(2);
  });
});

describe('accommodation and presbyopia', () => {
  it('meets a near target in a young lens with reserve to spare', () => {
    const d = settle({ targetDistanceMetres: 0.25 });
    expect(d.accommodationDeficitD).toBeLessThan(0.1);
    expect(d.blurActive).toBe(false);
    // The near point lies closer than any reading distance.
    expect(d.nearPointCm).toBeLessThan(20);
  });

  it('blurs print for the presbyope at reading distance while distance stays clear', () => {
    const near = settle({ ...VISION_PRESETS.presbyopia, targetDistanceMetres: 0.4 });
    expect(near.accommodationDeficitD).toBeGreaterThan(0.5);
    expect(near.blurActive).toBe(true);
    expect(near.nearPointCm).toBeGreaterThan(50);

    const far = settle({ ...VISION_PRESETS.presbyopia, targetDistanceMetres: 6 });
    expect(far.accommodationDeficitD).toBeLessThan(0.1);
    expect(far.blurActive).toBe(false);
  });

  it('constricts the pupils for near work beyond what the light reflex alone produces', () => {
    const lightOnly = settle({ targetDistanceMetres: 6 });
    const nearWork = settle({ targetDistanceMetres: 0.25 });
    expect(nearWork.pupilRightMm).toBeLessThan(lightOnly.pupilRightMm - 0.3);
  });
});

describe('the visual pathways', () => {
  it('puts a pituitary mass between the crossing fibres: bitemporal hemianopia', () => {
    const d = settle(VISION_PRESETS.chiasmalCompression);
    expect(d.fieldSectors.leftEye.superiorTemporal).toBeLessThan(0.05);
    expect(d.fieldSectors.leftEye.inferiorTemporal).toBeLessThan(0.05);
    expect(d.fieldSectors.rightEye.superiorTemporal).toBeLessThan(0.05);
    expect(d.fieldSectors.rightEye.inferiorTemporal).toBeLessThan(0.05);
    expect(d.fieldSectors.leftEye.superiorNasal).toBeGreaterThan(0.95);
    expect(d.fieldSectors.rightEye.superiorNasal).toBeGreaterThan(0.95);
    expect(d.fieldDefectLabel).toContain('bitemporal');
  });

  it('kills one whole field with an optic nerve lesion but spares the other eye entirely', () => {
    const d = settle({ fieldLesionSite: 'leftOpticNerve' });
    expect(d.fieldSectors.leftEye.superiorNasal).toBeLessThan(0.05);
    expect(d.fieldSectors.leftEye.inferiorTemporal).toBeLessThan(0.05);
    expect(d.fieldSectors.rightEye.superiorNasal).toBeGreaterThan(0.95);
    expect(d.fieldSectors.rightEye.inferiorNasal).toBeGreaterThan(0.95);
    expect(d.fieldDefectLabel).toContain('monocular');
  });

  it('maps a left optic tract lesion to RIGHT homonymous hemianopia', () => {
    const d = settle({ fieldLesionSite: 'leftOpticTract' });
    expect(d.fieldSectors.rightEye.superiorTemporal).toBeLessThan(0.05);
    expect(d.fieldSectors.rightEye.inferiorTemporal).toBeLessThan(0.05);
    expect(d.fieldSectors.leftEye.superiorNasal).toBeLessThan(0.05);
    expect(d.fieldSectors.leftEye.inferiorNasal).toBeLessThan(0.05);
    // The uncrossed halves survive on both sides.
    expect(d.fieldSectors.rightEye.superiorNasal).toBeGreaterThan(0.95);
    expect(d.fieldSectors.leftEye.superiorTemporal).toBeGreaterThan(0.95);
    expect(d.fieldDefectLabel).toContain('homonymous hemianopia');
  });

  it('gives Meyer\'s loop its pie in the sky: contralateral superior quadrantanopia', () => {
    const d = settle({ fieldLesionSite: 'leftTemporalRadiation' });
    expect(d.fieldSectors.rightEye.superiorTemporal).toBeLessThan(0.05);
    expect(d.fieldSectors.leftEye.superiorNasal).toBeLessThan(0.05);
    expect(d.fieldSectors.rightEye.inferiorTemporal).toBeGreaterThan(0.95);
    expect(d.fieldSectors.leftEye.inferiorNasal).toBeGreaterThan(0.95);
    expect(d.fieldDefectLabel).toContain('superior quadrantanopia');
  });

  it('spares the macula behind an occipital lobe infarct', () => {
    // A RIGHT posterior cerebral infarct blinds the LEFT field of both eyes.
    const d = settle(VISION_PRESETS.occipitalInfarctRight);
    expect(d.fieldSectors.leftEye.superiorTemporal).toBeLessThan(0.05);
    expect(d.fieldSectors.leftEye.inferiorTemporal).toBeLessThan(0.05);
    expect(d.fieldSectors.rightEye.superiorNasal).toBeLessThan(0.05);
    expect(d.fieldSectors.rightEye.inferiorNasal).toBeLessThan(0.05);
    expect(d.maculaSpared).toBe(true);
    expect(d.fieldDefectLabel).toContain('macula sparing');
  });

  it('leaves every sector intact without a lesion', () => {
    const d = settle({});
    for (const eye of [d.fieldSectors.leftEye, d.fieldSectors.rightEye]) {
      for (const integrity of Object.values(eye)) {
        expect(integrity).toBeGreaterThan(0.99);
      }
    }
    expect(d.fieldDefectLabel).toBe('no field defect');
  });
});

describe('numerical robustness', () => {
  it('never produces NaN or Infinity across extreme inputs', () => {
    const extremes: Partial<VisionInputs>[] = [
      { sceneLuminanceLogCd: -6, rodIntegrity: 0 },
      { sceneLuminanceLogCd: 4.5, coneIntegrity: 0, leftOpticNerveAfferent: 0 },
      { rodIntegrity: 0.05, coneIntegrity: 0.05, rightPupilEfferentGain: 0 },
      { sceneLuminanceLogCd: 0, leftOpticNerveAfferent: 0.1, rightPupilEfferentGain: 0.1 },
      { angleWidthPct: 0, mydriaticDosePct: 100, targetDistanceMetres: 0.12 },
      { aqueousProductionRate: 0, trabecularOutflowFacility: 0, maximumAccommodationD: 0 },
      { fieldLesionSite: 'rightOccipitalLobe', pilocarpineDosePct: 100, acetazolamideDosePct: 100 },
    ];
    for (const patch of extremes) {
      const d = settle(patch, 3000);
      for (const [key, value] of Object.entries(d)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} for ${JSON.stringify(patch)}`).toBe(true);
        }
      }
      expect(d.pupilRightMm).toBeGreaterThanOrEqual(2);
      expect(d.pupilRightMm).toBeLessThanOrEqual(7.5);
      expect(d.acuityDenominator).toBeGreaterThanOrEqual(6);
    }
  });
});
