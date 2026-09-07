import { RF_GAS, RF_PHYSIOLOGY } from './constants';

/**
 * Fractional oxyhaemoglobin saturation on the oxyhaemoglobin dissociation curve — a Hill (n, P50)
 * logistic. Chosen rather than the raw Severinghaus exponential, which overflows at low PaO2 in
 * floating point and is unchanged by the sign bug that form invites. P50 sits very near the
 * textbook 26.6 mmHg.
 */
export function severinghausSaO2(paO2: number): number {
  const P50 = RF_GAS.P50_MMHG;
  const HILL = RF_GAS.HILL_N;
  const clamped = Math.max(paO2, 5);
  return Math.min(Math.max(clamped ** HILL / (clamped ** HILL + P50 ** HILL), 0), 1);
}

/** O2 content of blood at a given PaO2, vol%. */
export function arterialO2Content(paO2: number, hb: number): number {
  return paO2 * RF_PHYSIOLOGY.O2_SOLUBILITY + hb * RF_PHYSIOLOGY.O2_BINDING_CAPACITY * severinghausSaO2(paO2);
}

/** End-capillary O2 content, i.e. arterial content at alveolar PAO2 with a balanced PaCO2. */
export function endCapillaryO2Content(pAO2: number, hb: number): number {
  return arterialO2Content(pAO2, hb);
}

function solveContentShunt(pAO2: number, q: number, hb: number): number {
  if (q <= 1e-4) {
    return pAO2;
  }
  //  q = (CcO2 - CaO2) / (CcO2 - CvO2), with CcO2 - CvO2 = (CcO2 - CaO2) + AV difference.
  //  Multiplying through leaves a fixed content gap to close:
  const targetGap = q * RF_PHYSIOLOGY.AV_O2_CONTENT_DIFFERENCE_VOL_PCT / (1 - q);
  const endCap = endCapillaryO2Content(pAO2, hb);
  let lo: number = RF_GAS.MIN_PAO2;
  let hi: number = Math.min(pAO2 + 5, RF_GAS.MAX_PAO2);
  const target = endCap - targetGap;
  if (arterialO2Content(hi, hb) < target) {
    return hi;
  }
  for (let i = 0; i < 40; i += 1) {
    const mid = (lo + hi) / 2;
    if (arterialO2Content(mid, hb) < target) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

/** Solves the PaO2 that satisfies the 3-compartment shunt equation at a given alveolar PAO2. */
export function paO2FromShunt(pAO2: number, shuntFraction: number): number {
  return solveContentShunt(pAO2, shuntFraction, RF_PHYSIOLOGY.HAEMOGLOBIN_G_PER_DL);
}

/** Alveolar gas equation: the O2 an alveolus should hold, mmHg. */
export function alveolarPAO2(fiO2: number, paCO2: number): number {
  return (RF_GAS.BAROMETRIC_PRESSURE_MMHG - RF_GAS.WATER_VAPOUR_PRESSURE_MMHG) * fiO2 - paCO2 / RF_GAS.RESPIRATORY_QUOTIENT;
}