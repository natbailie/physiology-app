import { BASELINE, INTERSTITIAL, ONCOTIC, PLASMA, PROTEIN, TISSUE_BEDS } from './constants';
import { interstitialOncoticPressure, plasmaOncoticPressure, proteinConcentrationGDl } from './oncoticPressure';
import { capillaryPressure, endPressures, filtrationRate, netFiltrationPressure } from './starlingForces';
import { interstitialPressure, isPitting, oedemaSeverity } from './interstitialMechanics';
import { lymphFlow, lymphaticCapacity, lymphaticReserveFraction, proteinInfluxGPerMin, proteinReturnGPerMin } from './lymphaticReturn';
import { dominantMechanism, oxygenationImpairment, safetyFactor } from './edemaClassification';
import { clamp } from '@/shared/lib/math';
import type { CapillaryDerived, CapillaryInputs, CapillarySnapshot, CapillaryState } from './types';

export function createInitialState(): CapillaryState {
  return {
    simTimeSeconds: 0,
    interstitialVolumeFraction: 1,
    plasmaVolumeMl: BASELINE.PLASMA_VOLUME_ML,
    plasmaProteinG: (PROTEIN.BASELINE_PLASMA_G_DL / 100) * BASELINE.PLASMA_VOLUME_ML,
    interstitialProteinFraction: 1,
  };
}

/** Grams of protein the interstitium holds at rest, for the bed in question. */
function baselineProteinMassG(tissueBed: CapillaryInputs['tissueBed']): number {
  const bed = TISSUE_BEDS[tissueBed];
  return (bed.baselineInterstitialProteinGDl / 100) * bed.interstitialVolumeMl;
}

export function computeDerived(state: CapillaryState, inputs: CapillaryInputs): CapillaryDerived {
  const bed = TISSUE_BEDS[inputs.tissueBed];
  const interstitialExcess = state.interstitialVolumeFraction - 1;
  const interstitialVolumeMl = bed.interstitialVolumeMl * state.interstitialVolumeFraction;

  const pi = interstitialPressure(interstitialExcess, inputs.interstitialCompliance, inputs.tissueBed);
  const pc = capillaryPressure(
    inputs.arterialInflowPressure,
    inputs.venousOutflowPressure,
    inputs.precapillaryTone,
    inputs.tissueBed,
    state.plasmaVolumeMl,
    BASELINE.PLASMA_VOLUME_ML,
  );
  const ends = endPressures(pc, inputs.arterialInflowPressure, inputs.venousOutflowPressure, inputs.tissueBed);

  // Concentration, not content: the interstitium washes its own protein out as it fills, and
  // that dilution is one of the safety factors resisting further filtration.
  const interstitialProteinGDl = proteinConcentrationGDl(
    baselineProteinMassG(inputs.tissueBed) * state.interstitialProteinFraction,
    interstitialVolumeMl,
  );
  const oncoticPlasma = plasmaOncoticPressure(state.plasmaProteinG, state.plasmaVolumeMl);
  const oncoticInterstitial = interstitialOncoticPressure(interstitialProteinGDl);

  const netPressure = netFiltrationPressure(pc, pi, oncoticPlasma, oncoticInterstitial, inputs.reflectionCoefficient);
  const filtration = filtrationRate(netPressure, inputs.capillaryPermeability, inputs.tissueBed);

  const capacity = lymphaticCapacity(inputs.lymphaticFlowCapacity, inputs.tissueBed);
  const lymph = lymphFlow(pi, inputs.lymphaticFlowCapacity, inputs.tissueBed);
  const reserve = lymphaticReserveFraction(lymph, capacity);

  return {
    capillaryPressureMmHg: pc,
    arteriolarEndPressure: ends.arteriolar,
    venularEndPressure: ends.venular,
    interstitialPressureMmHg: pi,
    plasmaOncoticMmHg: oncoticPlasma,
    interstitialOncoticMmHg: oncoticInterstitial,
    netFiltrationPressure: netPressure,
    arteriolarNetPressure: netFiltrationPressure(ends.arteriolar, pi, oncoticPlasma, oncoticInterstitial, inputs.reflectionCoefficient),
    venularNetPressure: netFiltrationPressure(ends.venular, pi, oncoticPlasma, oncoticInterstitial, inputs.reflectionCoefficient),
    filtrationRateMlPerMin: filtration,
    lymphFlowMlPerMin: lymph,
    lymphaticCapacityMlPerMin: capacity,
    lymphaticReserveFraction: reserve,
    netAccumulationMlPerMin: filtration - lymph,
    interstitialVolumeMl,
    plasmaVolumeMl: state.plasmaVolumeMl,
    interstitialProteinGDl,
    interstitialExcess,
    oedemaSeverity: oedemaSeverity(interstitialExcess, inputs.tissueBed),
    isPitting: isPitting(interstitialExcess, inputs.interstitialCompliance),
    dominantMechanism: dominantMechanism(
      pc,
      oncoticPlasma,
      oncoticInterstitial,
      inputs.reflectionCoefficient,
      inputs.capillaryPermeability,
      inputs.lymphaticFlowCapacity,
      interstitialExcess,
      inputs.tissueBed,
    ),
    oxygenationImpairment: oxygenationImpairment(interstitialExcess, inputs.tissueBed),
    safetyFactorMmHg: safetyFactor(netPressure, pi, oncoticInterstitial, reserve, inputs.tissueBed),
    arterialInflowPressure: inputs.arterialInflowPressure,
    venousOutflowPressure: inputs.venousOutflowPressure,
    precapillaryTone: inputs.precapillaryTone,
    plasmaAlbuminGDl: inputs.plasmaAlbuminGDl,
    capillaryPermeability: inputs.capillaryPermeability,
    reflectionCoefficient: inputs.reflectionCoefficient,
    lymphaticFlowCapacity: inputs.lymphaticFlowCapacity,
    interstitialCompliance: inputs.interstitialCompliance,
    tissueBed: inputs.tissueBed,
  };
}

export function tick(state: CapillaryState, derived: CapillaryDerived, dtSeconds: number): CapillaryState {
  const dtMinutes = dtSeconds / 60;
  const bed = TISSUE_BEDS[derived.tissueBed];

  // Fluid filtered out of the capillary either returns as lymph or stays in the interstitium.
  // Everything the interstitium gains, the plasma loses — until the body replaces it.
  const netAccumulationMl = derived.netAccumulationMlPerMin * dtMinutes;
  const interstitialVolumeFraction = clamp(
    state.interstitialVolumeFraction + netAccumulationMl / bed.interstitialVolumeMl,
    INTERSTITIAL.MIN_VOLUME_FRACTION,
    INTERSTITIAL.MAX_VOLUME_FRACTION,
  );

  const refill = ((BASELINE.PLASMA_VOLUME_ML - state.plasmaVolumeMl) / PLASMA.REFILL_TAU_SECONDS) * dtSeconds;
  const plasmaVolumeMl = clamp(state.plasmaVolumeMl - netAccumulationMl + refill, PLASMA.MIN_VOLUME_ML, PLASMA.MAX_VOLUME_ML);

  // Protein moves between the two compartments and is conserved between them: it crosses the
  // wall by diffusion and by convection through whatever sigma fails to reflect, and returns
  // by only one route — the lymph.
  const plasmaProteinGDl = (state.plasmaProteinG / Math.max(state.plasmaVolumeMl, 100)) * 100;
  const proteinIn = proteinInfluxGPerMin(
    derived.filtrationRateMlPerMin,
    derived.reflectionCoefficient,
    plasmaProteinGDl,
    derived.interstitialProteinGDl,
    derived.tissueBed,
  );
  const proteinOut = proteinReturnGPerMin(derived.lymphFlowMlPerMin, derived.interstitialProteinGDl);
  const baselineMass = (bed.baselineInterstitialProteinGDl / 100) * bed.interstitialVolumeMl;
  const interstitialProteinFraction = Math.max(
    0.02,
    state.interstitialProteinFraction + ((proteinIn - proteinOut) * dtMinutes) / Math.max(baselineMass, 0.01),
  );

  // The liver replaces lost plasma protein, but over days. That slowness is why the
  // hypoalbuminaemia of nephrotic syndrome persists and why an albumin infusion is a gesture
  // rather than a cure.
  const targetPlasmaProteinG =
    ((derived.plasmaAlbuminGDl * ONCOTIC.PROTEIN_PER_ALBUMIN) / 100) * BASELINE.PLASMA_VOLUME_ML;
  const synthesis = ((targetPlasmaProteinG - state.plasmaProteinG) / PROTEIN.SYNTHESIS_TAU_SECONDS) * dtSeconds;
  const plasmaProteinG = Math.max(5, state.plasmaProteinG - (proteinIn - proteinOut) * dtMinutes + synthesis);

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    interstitialVolumeFraction,
    plasmaVolumeMl,
    plasmaProteinG,
    interstitialProteinFraction,
  };
}

export function step(state: CapillaryState, inputs: CapillaryInputs, dtSeconds: number): CapillarySnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, dtSeconds), derived };
}

/** An albumin infusion: raises plasma oncotic pressure and pulls fluid back out of the tissues —
 * but only where the wall still reflects protein. In sepsis or burns, with sigma low, the
 * infused albumin follows the fluid straight into the interstitium and helps very little. */
export function perturbAlbuminInfusion(state: CapillaryState, millilitres = 500, albuminGDl = 20): CapillaryState {
  return {
    ...state,
    plasmaVolumeMl: clamp(state.plasmaVolumeMl + millilitres, PLASMA.MIN_VOLUME_ML, PLASMA.MAX_VOLUME_ML),
    plasmaProteinG: state.plasmaProteinG + (millilitres * albuminGDl * ONCOTIC.PROTEIN_PER_ALBUMIN) / 100,
  };
}

/** Standing up: gravity adds tens of mmHg to the venous pressure at the ankle. The dependent
 * oedema after a long day upright is that term, and nothing else. */
export function perturbStandUp(state: CapillaryState, fraction = 0.04): CapillaryState {
  return {
    ...state,
    interstitialVolumeFraction: state.interstitialVolumeFraction + fraction,
  };
}
