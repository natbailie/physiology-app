import { MV_VENTILATOR } from './constants';
import type { MvInputs } from './types';

/** Fraction of the collapsed shunt PEEP recruitment has reopened: ARDS recruits heavily,
 * emphysema almost not at all, and nothing reopens before ~4 cmH2O. */
export function recruitmentLevel(
  recruitability: number,
  peepCmH2O: number,
): number {
  if (recruitability <= 0) return 0;
  const above = peepCmH2O - MV_VENTILATOR.RECRUITMENT_PEEP_OFFSET_CMH2O;
  const recruit = Math.max(0, Math.min(above / MV_VENTILATOR.RECRUITMENT_PEEP_RANGE_CMH2O, 1));
  return recruitability * recruit;
}

/** The shunt that survives recruitment — oxygen cannot reach it; only reopening (PEEP) can. */
export function effectiveShuntFraction(
  shuntFraction: number,
  recruitability: number,
  peepCmH2O: number,
): number {
  return Math.max(0, shuntFraction * (1 - recruitmentLevel(recruitability, peepCmH2O)));
}

/** VA_fraction of basal — arterial CO2 is inversely proportional to it. */
export function co2Fraction(vaMLPerMin: number): number {
  return Math.max(0.01, vaMLPerMin / 4200);
}

/** Steady-state arterial CO2: the ventilation cleared a normal load at 40 mmHg; more load or
 * less washout drives it up proportionally. */
export function paCo2MmHg(vco2Multiplier: number, vaMLPerMin: number): number {
  const cleared = co2Fraction(vaMLPerMin);
  const paCO2 = 40 * (vco2Multiplier / cleared);
  return Math.max(MV_VENTILATOR.MIN_PCO2_MMHG, Math.min(paCO2, MV_VENTILATOR.MAX_PCO2_MMHG));
}

/** Alveolar gas equation — the ceiling an oxygen-optimising lung can achieve. */
export function alveolarPAO2(fiO2: number, paCO2MmHg: number): number {
  const dry = (760 - 47) * fiO2;
  return Math.max(10, dry - paCO2MmHg / 0.8);
}

/** Severinghaus: SaO2 (%) from PaO2 (mmHg). */
export function severinghausSaO2(paO2MmHg: number): number {
  const p3 = paO2MmHg ** 3;
  return 100 / (1 + 23400 / (p3 + 150 * paO2MmHg));
}

/** Inverse Severinghaus: PaO2 (mmHg) from a given SaO2 (0..1). The cubic p^3 + 150p − K = 0
 * has exactly one real root, solvable in closed form without iteration. */
export function severinghausPaO2(saO2: number): number {
  const s = Math.max(0.001, Math.min(saO2, MV_VENTILATOR.MAX_SV02_SAT));
  const k = 23400 * (s / (1 - s));
  const root = Math.sqrt(k * k / 4 + 125000);
  const alpha = Math.cbrt(k / 2 + root);
  const beta = Math.cbrt(k / 2 - root);
  return alpha + beta;
}

/** Content-based shunt: mixed-venous blood flows through unventilated units untouched. Solve
 * 1.34·Hb·SaO2(Pa) + 0.0031·Pa = (1−Qs/Qt)·CcO2 + Qs/Qt·CvO2. The left side rises monotonically
 * with PaO2 (SaO2 saturates, the dissolved term keeps creeping), so bisection is exact and can
 * never run away the way a damped fixed-point iteration does at near-saturation. */
export function arterialPaO2MmHg(
  alveolarPO2MmHg: number,
  shuntFraction: number,
  hbGPerDl: number,
  svO2: number,
): number {
  const cvCapacity = 1.34 * hbGPerDl;
  const cco2 = cvCapacity * (severinghausSaO2(alveolarPO2MmHg) / 100) + 0.0031 * alveolarPO2MmHg;
  const cvO2 = cvCapacity * svO2 + 0.0031 * 40;
  const arterialContent = (1 - shuntFraction) * cco2 + shuntFraction * cvO2;
  let lo: number = MV_VENTILATOR.MIN_PAO2_MMHG;
  let hi: number = MV_VENTILATOR.MAX_PAO2_MMHG;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    const content = cvCapacity * (severinghausSaO2(mid) / 100) + 0.0031 * mid;
    if (content < arterialContent) lo = mid;
    else hi = mid;
  }
  return lo;
}

export function saO2FromPaO2(paO2MmHg: number): number {
  return Math.round(severinghausSaO2(paO2MmHg) * 10) / 10;
}

export function aaGradientMmHg(alveolarPO2MmHg: number, paO2MmHg: number): number {
  return Math.max(0, alveolarPO2MmHg - paO2MmHg);
}

/** Bicarbonate replays the renal compensation: days of hypercapnia buy a steeper slope. */
export function plasmaHco3MmEqPerL(paCO2MmHg: number, chronic: number): number {
  const slope = chronic * 0.35 + (1 - chronic) * 0.1;
  return 24 + Math.max(-10, Math.min(paCO2MmHg - 40, 60)) * slope;
}

export function plasmaPH(hco3: number, paCO2MmHg: number): number {
  return 6.1 + Math.log10(hco3 / (0.03 * paCO2MmHg));
}

export function isChi53(inputs: MvInputs): boolean {
  return inputs.chronicKidneyCompensation > 0.5;
}