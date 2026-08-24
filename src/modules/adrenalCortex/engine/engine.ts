import { ADRENAL_SIMULATION, STEROID } from './constants';
import {
  acthEffective,
  addisonianCrisisRisk,
  classifyAdrenalCortex,
  hypertensionFromDoc,
  mineralocorticoidActivity,
  patternSummary,
  saltWasting,
  steroidFlux,
} from './adrenalMechanics';
import { approach, clamp } from '@/shared/lib/math';
import type {
  AdrenalCortexDerived,
  AdrenalCortexInputs,
  AdrenalCortexInternalState,
  AdrenalCortexSnapshot,
} from './types';

export function createInitialState(): AdrenalCortexInternalState {
  return {
    simTimeSeconds: 0,
    cortisolPool: 100,
    aldosteronePool: 100,
    androgenPool: 100,
    docPool: 0,
    precursor17ohpPool: 5,
  };
}

function fluxTargets(inputs: AdrenalCortexInputs) {
  const flux = steroidFlux(inputs);
  const replacement = clamp(inputs.replacementTherapyPct, 0, 100);
  // ACTH feedback amplifies drive behind a blocked pathway; replacement suppresses it.
  const amplified = acthEffective(inputs.acthDrivePct, flux.endogenousCortisol, replacement);
  const scale = amplified / 100;

  return {
    endogenousCortisol: clamp(flux.endogenousCortisol * scale, 0, 400),
    aldosterone: clamp(flux.aldosterone * Math.min(scale, 1.6), 0, 300),
    // Androgen excess is ACTH-dependent but sublinear: the pathway saturates.
    androgens: clamp(flux.androgens * Math.sqrt(Math.max(scale, 0)), 0, 800),
    docExcess: clamp(flux.docExcess * scale, 0, 600),
    marker17ohp: clamp(flux.marker17ohp * scale, 0, 800),
    replacement,
  };
}

export function computeDerived(state: AdrenalCortexInternalState, inputs: AdrenalCortexInputs): AdrenalCortexDerived {
  const targets = fluxTargets(inputs);
  const effectiveCortisol = clamp(
    state.cortisolPool + (targets.replacement / 100) * 85,
    0,
    200,
  );
  const mcActivity = mineralocorticoidActivity(state.aldosteronePool, state.docPool);
  const crisis = addisonianCrisisRisk(effectiveCortisol, targets.replacement);

  const classificationPattern = {
    block21Pct: inputs.block21Pct,
    block11Pct: inputs.block11Pct,
    block17Pct: inputs.block17Pct,
    block3bhsdPct: inputs.block3bhsdPct,
    replacementTherapyPct: targets.replacement,
    mcActivity,
  };

  return {
    endogenousCortisol: state.cortisolPool,
    effectiveCortisol,
    aldosterone: state.aldosteronePool,
    androgens: state.androgenPool,
    docExcess: state.docPool,
    marker17ohp: state.precursor17ohpPool,
    mineralocorticoidActivity: mcActivity,
    saltWasting: saltWasting(mcActivity, targets.replacement),
    hypertensionFromDoc: hypertensionFromDoc(state.docPool),
    addisonianCrisisRiskPct: crisis,
    acthEffectivePct: acthEffective(inputs.acthDrivePct, state.cortisolPool, targets.replacement),
    classification: classifyAdrenalCortex(classificationPattern),
    patternSummary: patternSummary({
      classification: classifyAdrenalCortex(classificationPattern),
      cortisol: effectiveCortisol,
      androgens: state.androgenPool,
      marker17ohp: state.precursor17ohpPool,
      mcActivity,
      docExcess: state.docPool,
    }),
  };
}

export function tick(
  state: AdrenalCortexInternalState,
  inputs: AdrenalCortexInputs,
  dtSeconds: number,
): AdrenalCortexInternalState {
  const t = fluxTargets(inputs);
  void STEROID.FULL_EFFICIENCY;
  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    cortisolPool: approach(state.cortisolPool, t.endogenousCortisol, dtSeconds, STEROID.POOL_TAU_SECONDS),
    aldosteronePool: approach(state.aldosteronePool, t.aldosterone, dtSeconds, STEROID.POOL_TAU_SECONDS),
    androgenPool: approach(state.androgenPool, t.androgens, dtSeconds, STEROID.POOL_TAU_SECONDS),
    docPool: approach(state.docPool, t.docExcess, dtSeconds, STEROID.POOL_TAU_SECONDS),
    precursor17ohpPool: approach(state.precursor17ohpPool, t.marker17ohp, dtSeconds, STEROID.POOL_TAU_SECONDS),
  };
}

export function step(state: AdrenalCortexInternalState, inputs: AdrenalCortexInputs, dtSeconds: number): AdrenalCortexSnapshot {
  const nextState = tick(state, inputs, dtSeconds);
  return { state: nextState, derived: computeDerived(nextState, inputs) };
}

export { ADRENAL_SIMULATION };
