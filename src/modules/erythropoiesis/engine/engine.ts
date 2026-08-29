import { EPO, HEMOGLOBIN, HEPCIDIN, IRON_STORES, MARROW, SUBSTRATE } from './constants';
import { epoTarget, oxygenDeliveryMlPerMin, tissueHypoxia } from './oxygenSensing';
import { producedMcvTarget, substrateProductionLimit } from './substrates';
import {
  ferritinNgMl as ferritinPanel,
  ferroportinGate,
  gatedIronAdequacy,
  hepcidinTarget,
  serumIronUgDl,
  tibcUgDl,
  transferrinSaturationPct,
} from './ironStudies';
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
    hepcidinFraction: HEPCIDIN.NORMAL_FRACTION,
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

  // The iron studies panel, all downstream of one hormone.
  const gate = ferroportinGate(state.hepcidinFraction);
  const baseAdequacy = baseIronAdequacy(inputs.ironAvailability, state.ironStores);
  const gatedAdequacy = gatedIronAdequacy(baseAdequacy, gate);
  const serumIron = serumIronUgDl(gatedAdequacy);
  const tibc = tibcUgDl({
    ironStores: state.ironStores,
    inflammationLevelPct: inputs.inflammationLevelPct,
    liverSyntheticFunctionPct: inputs.liverSyntheticFunctionPct,
  });
  const saturation = transferrinSaturationPct(serumIron, tibc);

  return {
    hemoglobinGDl: state.hemoglobinGDl,
    hematocritPercent: state.hemoglobinGDl * HEMOGLOBIN.HEMATOCRIT_RATIO,
    mcv: state.circulatingMcv,
    reticulocyteIndex: reticIndex,
    epoLevel: state.epoLevel,
    marrowOutput: state.marrowOutput,
    ferritinNgMl: ferritinPanel(state.ironStores, inputs.inflammationLevelPct),

    hepcidinFraction: state.hepcidinFraction,
    serumIronUgDl: serumIron,
    tibcUgDl: tibc,
    transferrinSaturationPct: saturation,
    ferroportinGateFraction: gate,

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
    inflammationLevelPct: inputs.inflammationLevelPct,
    liverSyntheticFunctionPct: inputs.liverSyntheticFunctionPct,
    erythropoieticDriveMultiplier: inputs.erythropoieticDriveMultiplier,
    ironSensingIntegrityPct: inputs.ironSensingIntegrityPct,
  };
}

/** The pre-gate adequacy: supply and stores as the OLD substrates.ts weighed them. Exported
 * from a wrapper here so the gating stays in one place alongside the panel. */
function baseIronAdequacy(ironAvailabilityPct: number, ironStores: number): number {
  const supply = clamp(ironAvailabilityPct / SUBSTRATE.IRON_SATURATION_PCT, 0, 1.5);
  return clamp(supply * 0.6 + clamp(ironStores, 0, 1) * 0.4, 0, 1.2);
}

/** The adequacy the MARROW actually feels, after hepcidin has closed (or flung open) the
 * ferroportin door. This is what makes ACD starve a replete patient. */
export function effectiveIronAdequacy(inputs: ErythroInputs, ironStores: number, hepcidinFraction: number): number {
  const gate = ferroportinGate(hepcidinFraction);
  return gatedIronAdequacy(baseIronAdequacy(inputs.ironAvailability, ironStores), gate);
}

export function tick(state: ErythroState, derived: ErythroDerived, inputs: ErythroInputs, dtSeconds: number): ErythroState {
  // The marrow feels the GATED iron: hepcidin stands between stores and haemoglobin.
  const substrateLimit = substrateProductionLimit(
    inputs.ironAvailability,
    state.ironStores,
    derived.b12FolateStatus,
    effectiveIronAdequacy(inputs, state.ironStores, state.hepcidinFraction),
  );

  const targetEpo = epoTarget(state.hemoglobinGDl, derived.inspiredOxygen, derived.renalFunction);
  const targetOutput = marrowOutputTarget(state.epoLevel, derived.marrowFunction, substrateLimit);

  // Haemoglobin is the balance of production against loss — the plant variable the whole
  // feedback loop exists to defend.
  const loss = redCellLossRate(derived.hemolysisRate, derived.bloodLossRate, state.hemoglobinGDl);
  const dHemoglobin = (state.marrowOutput - loss) * HEMOGLOBIN.FLUX_GAIN * dtSeconds * 100;

  // Chronic bleeding drains iron stores; adequate intake slowly refills them. Intake passes
  // through ferroportin too — a wide-open gate (low hepcidin) is how overload happens.
  const gate = ferroportinGate(state.hepcidinFraction);
  const bleeding = derived.bloodLossRate / 100;
  const intakeSurplus = clamp(derived.ironAvailability / 100 - 1, -1, 1) * clamp(gate, 0.3, HEPCIDIN.GATE_MAX);
  const dIronStores =
    (-bleeding * IRON_STORES.DEPLETION_PER_SECOND + intakeSurplus * IRON_STORES.REPLETION_PER_SECOND) * dtSeconds * 100;

  const targetProducedMcv = producedMcvTarget(derived.ironAvailability, state.ironStores, derived.b12FolateStatus);

  const hepcidinTargetFraction = hepcidinTarget({
    ironStores: state.ironStores,
    inflammationLevelPct: inputs.inflammationLevelPct,
    erythropoieticDriveMultiplier: inputs.erythropoieticDriveMultiplier,
    ironSensingIntegrityPct: inputs.ironSensingIntegrityPct,
    liverSyntheticFunctionPct: inputs.liverSyntheticFunctionPct,
  });

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
    hepcidinFraction: approach(state.hepcidinFraction, hepcidinTargetFraction, dtSeconds, HEPCIDIN.TAU_SECONDS),
  };
}

export function step(state: ErythroState, inputs: ErythroInputs, dtSeconds: number): ErythroSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, inputs, dtSeconds), derived };
}

/** Acute haemorrhage — an instant drop in haemoglobin. The marrow's reticulocyte response
 * then takes days to appear, which is why an early post-bleed count looks deceptively
 * hypoproliferative. */
export function perturbAcuteBloodLoss(state: ErythroState, magnitudeGDl = 4): ErythroState {
  return { ...state, hemoglobinGDl: clamp(state.hemoglobinGDl - magnitudeGDl, HEMOGLOBIN.MIN_G_DL, HEMOGLOBIN.MAX_G_DL) };
}
