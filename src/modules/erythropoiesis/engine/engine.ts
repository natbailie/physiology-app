import { EPO, HEMOGLOBIN, IRON_STORES, MARROW, SUBSTRATE } from './constants';
import { epoTarget, oxygenDeliveryMlPerMin, tissueHypoxia } from './oxygenSensing';
import { producedMcvTarget, substrateProductionLimit } from './substrates';
import { isHypoproliferative, marrowOutputTarget, redCellLossRate, reticulocyteIndex } from './redCellKinetics';
import { approach, clamp } from '@/shared/lib/math';
import type { AnemiaClassification, ErythroDerived, ErythroInputs, ErythroSnapshot, ErythroState } from './types';

export function createInitialState(): ErythroState {
  return {
    simTimeSeconds: 0,
    hemoglobinGDl: HEMOGLOBIN.NORMAL_G_DL,
    epoLevel: 0.05,
    marrowOutput: 0.32,
    ironStores: 1,
    producedMcv: SUBSTRATE.NORMAL_MCV_FL,
    circulatingMcv: SUBSTRATE.NORMAL_MCV_FL,
  };
}

/** Classifies the anemia the way it is read clinically — by SIZE first, because the MCV is
 * what narrows the differential fastest. */
export function classifyAnemia(hemoglobinGDl: number, mcv: number): AnemiaClassification {
  if (hemoglobinGDl >= HEMOGLOBIN.POLYCYTHEMIA_THRESHOLD_G_DL) return 'polycythemia';
  if (hemoglobinGDl >= HEMOGLOBIN.ANEMIA_THRESHOLD_G_DL) return 'normal';
  if (mcv < 80) return 'microcytic anemia';
  if (mcv > 100) return 'macrocytic anemia';
  return 'normocytic anemia';
}

export function computeDerived(state: ErythroState, inputs: ErythroInputs): ErythroDerived {
  const reticIndex = reticulocyteIndex(state.marrowOutput);

  return {
    hemoglobinGDl: state.hemoglobinGDl,
    hematocritPercent: state.hemoglobinGDl * HEMOGLOBIN.HEMATOCRIT_RATIO,
    mcv: state.circulatingMcv,
    reticulocyteIndex: reticIndex,
    epoLevel: state.epoLevel,
    marrowOutput: state.marrowOutput,
    ferritinNgMl: clamp(state.ironStores * IRON_STORES.NORMAL_FERRITIN_NG_ML, 2, IRON_STORES.MAX_FERRITIN_NG_ML),
    oxygenDeliveryMlPerMin: oxygenDeliveryMlPerMin(state.hemoglobinGDl, inputs.inspiredOxygen),
    tissueHypoxia: tissueHypoxia(state.hemoglobinGDl, inputs.inspiredOxygen),
    anemiaClassification: classifyAnemia(state.hemoglobinGDl, state.circulatingMcv),
    isHypoproliferative: isHypoproliferative(reticIndex, state.hemoglobinGDl),
    renalFunction: inputs.renalFunction,
    ironAvailability: inputs.ironAvailability,
    b12FolateStatus: inputs.b12FolateStatus,
    marrowFunction: inputs.marrowFunction,
    bloodLossRate: inputs.bloodLossRate,
    hemolysisRate: inputs.hemolysisRate,
    inspiredOxygen: inputs.inspiredOxygen,
  };
}

export function tick(state: ErythroState, derived: ErythroDerived, dtSeconds: number): ErythroState {
  const substrateLimit = substrateProductionLimit(derived.ironAvailability, state.ironStores, derived.b12FolateStatus);

  const targetEpo = epoTarget(state.hemoglobinGDl, derived.inspiredOxygen, derived.renalFunction);
  const targetOutput = marrowOutputTarget(state.epoLevel, derived.marrowFunction, substrateLimit);

  // Haemoglobin is the balance of production against loss — the plant variable the whole
  // feedback loop exists to defend.
  const loss = redCellLossRate(derived.hemolysisRate, derived.bloodLossRate, state.hemoglobinGDl);
  const dHemoglobin = (state.marrowOutput - loss) * HEMOGLOBIN.FLUX_GAIN * dtSeconds * 100;

  // Chronic bleeding drains iron stores; adequate intake slowly refills them.
  const bleeding = derived.bloodLossRate / 100;
  const intakeSurplus = clamp(derived.ironAvailability / 100 - 1, -1, 1);
  const dIronStores =
    (-bleeding * IRON_STORES.DEPLETION_PER_SECOND + intakeSurplus * IRON_STORES.REPLETION_PER_SECOND) * dtSeconds * 100;

  const targetProducedMcv = producedMcvTarget(derived.ironAvailability, state.ironStores, derived.b12FolateStatus);

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    hemoglobinGDl: clamp(state.hemoglobinGDl + dHemoglobin, HEMOGLOBIN.MIN_G_DL, HEMOGLOBIN.MAX_G_DL),
    epoLevel: approach(state.epoLevel, targetEpo, dtSeconds, EPO.TAU_SECONDS),
    marrowOutput: approach(state.marrowOutput, targetOutput, dtSeconds, MARROW.TAU_SECONDS),
    ironStores: clamp(state.ironStores + dIronStores, 0.02, 1.6),
    producedMcv: approach(state.producedMcv, targetProducedMcv, dtSeconds, 30),
    // The circulating average lags production, because only NEW cells carry the new size —
    // which is why a treated deficiency shows a mixed population before the MCV normalises.
    circulatingMcv: approach(state.circulatingMcv, state.producedMcv, dtSeconds, SUBSTRATE.CIRCULATING_MCV_TAU_SECONDS),
  };
}

export function step(state: ErythroState, inputs: ErythroInputs, dtSeconds: number): ErythroSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, dtSeconds), derived };
}

/** Acute haemorrhage — an instant drop in haemoglobin. The marrow's reticulocyte response
 * then takes days to appear, which is why an early post-bleed count looks deceptively
 * hypoproliferative. */
export function perturbAcuteBloodLoss(state: ErythroState, magnitudeGDl = 4): ErythroState {
  return { ...state, hemoglobinGDl: clamp(state.hemoglobinGDl - magnitudeGDl, HEMOGLOBIN.MIN_G_DL, HEMOGLOBIN.MAX_G_DL) };
}
