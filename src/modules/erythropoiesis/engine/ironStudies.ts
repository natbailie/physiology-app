import { HEPCIDIN, IRON_PANEL } from './constants';
import { clamp, scaleClamped } from '@/shared/lib/math';

/**
 * Hepcidin target as a fraction of normal.
 *
 * Three forces meet here. Full stores push production up — the body defending itself from
 * overload. Interleukin-6 pushes much harder still — which is why a week of pneumonia can
 * lock away more iron than months of bleeding. And a marrow driving beyond its supply, or a
 * liver whose iron sensing has failed, suppresses production outright — which is why
 * thalassaemia intermedia and haemochromatosis both overload WITHOUT any transfusion.
 */
export function hepcidinTarget(params: {
  ironStores: number;
  inflammationLevelPct: number;
  erythropoieticDriveMultiplier: number;
  ironSensingIntegrityPct: number;
  liverSyntheticFunctionPct: number;
}): number {
  const storeDrive = scaleClamped(
    params.ironStores,
    0,
    1.6,
    HEPCIDIN.STORE_DRIVE_MIN,
    HEPCIDIN.STORE_DRIVE_MAX,
  );
  const inflammation = 1 + (HEPCIDIN.INFLAMMATION_MAX_MULTIPLIER - 1) * Math.pow(clamp(params.inflammationLevelPct / 100, 0, 1), 0.8);
  const driveSuppression = 1 / Math.pow(Math.max(params.erythropoieticDriveMultiplier, 0.1), HEPCIDIN.DRIVE_SUPPRESSION_EXPONENT);
  const sensing = scaleClamped(
    params.ironSensingIntegrityPct,
    0,
    100,
    HEPCIDIN.SENSING_MIN_MULTIPLIER,
    1,
  );
  const productionCapacity = clamp(params.liverSyntheticFunctionPct / 100, 0, 1);

  return clamp(storeDrive * inflammation * driveSuppression * sensing * productionCapacity, 0.02, 12);
}

/** Ferroportin abundance relative to normal. High hepcidin internalises the exporters; low
 * hepcidin lets them accumulate, so absorption and macrophage release run ABOVE normal. */
export function ferroportinGate(hepcidinFraction: number): number {
  return clamp(1 + (HEPCIDIN.NORMAL_FRACTION - hepcidinFraction) * HEPCIDIN.GATE_LOW_HEPCIDIN_GAIN, HEPCIDIN.GATE_MIN, HEPCIDIN.GATE_MAX);
}

/** Effective iron reaching the marrow after the ferroportin gate has had its say. A floor
 * remains because recycled senescent-cell iron never leaves the marrow entirely. */
export function gatedIronAdequacy(baseAdequacy: number, gate: number): number {
  return baseAdequacy * (HEPCIDIN.GATE_MIN * 2 + (1 - HEPCIDIN.GATE_MIN * 2) * clamp(gate, 0, HEPCIDIN.GATE_MAX));
}

/** Serum iron follows what actually gets through the gate. */
export function serumIronUgDl(gatedAdequacy: number): number {
  return IRON_PANEL.SERUM_IRON_BASE_UG_DL * clamp(gatedAdequacy, 0.05, 1.6);
}

/**
 * Transferrin (measured as TIBC): the marrow's answer to scarcity, cut down by inflammation
 * as a negative acute-phase reactant, and made no better than the liver allows.
 */
export function tibcUgDl(params: {
  ironStores: number;
  inflammationLevelPct: number;
  liverSyntheticFunctionPct: number;
}): number {
  const deficiencyUpregulation = scaleClamped(
    params.ironStores,
    0,
    0.7,
    IRON_PANEL.TIBC_DEFICIENCY_MAX_MULTIPLE,
    1,
  );
  // As overload develops, transferrin falls back — there is more iron than carriers.
  const overloadDownregulation = scaleClamped(params.ironStores, 1, 2, 1, 0.88);
  const inflammationDownregulation = scaleClamped(
    params.inflammationLevelPct,
    0,
    100,
    1,
    IRON_PANEL.TIBC_INFLAMMATION_MIN_MULTIPLE,
  );
  const liverFraction = scaleClamped(params.liverSyntheticFunctionPct, 0, 100, 0.55, 1);
  return (
    IRON_PANEL.TIBC_BASE_UG_DL *
    deficiencyUpregulation *
    overloadDownregulation *
    inflammationDownregulation *
    liverFraction
  );
}

export function transferrinSaturationPct(serumIronUgDlValue: number, tibcUgDlValue: number): number {
  return (serumIronUgDlValue / Math.max(tibcUgDlValue, 1)) * 100;
}

/** Ferritin reads the STORES — until inflammation multiplies the readout on top of them,
 * which is exactly how a truly deficient patient produces a reassuring ferritin. */
export function ferritinNgMl(ironStores: number, inflammationLevelPct: number): number {
  const phaseMultiple =
    1 + (IRON_PANEL.FERRITIN_INFLAMMATION_MAX_MULTIPLE - 1) * clamp(inflammationLevelPct / 100, 0, 1);
  const cap = phaseMultiple > 1 ? 700 : 400;
  return clamp(ironStores * 120 * phaseMultiple, 2, cap);
}
