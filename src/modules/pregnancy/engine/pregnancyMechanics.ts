import { FETAL, HORMONE, LABOUR, LACTATION, MATERNAL } from './constants';
import { clamp } from '@/shared/lib/math';
import type { PregnancyState_Classification } from './types';

/** Smooth progress of gestational adaptation from 4 to 40 weeks — most expansion is
 * complete by the early third trimester. */
export function pregnancyProgress(weeks: number): number {
  const t = clamp((weeks - 4) / 34, 0, 1);
  return t * t * (3 - 2 * t) * 0.9 + t * 0.1;
}

export function plasmaVolIncreasePct(weeks: number, twins: number, placentalFraction: number): number {
  return (
    MATERNAL.PLASMA_VOL_MAX_INCREASE_PCT *
    pregnancyProgress(weeks) *
    (1 + MATERNAL.TWIN_PLASMA_EXTRA_PCT / 100 * twins) *
    (0.55 + 0.45 * placentalFraction)
  );
}

export function redCellMassIncreasePct(weeks: number, twins: number): number {
  return MATERNAL.RED_CELL_MASS_MAX_INCREASE_PCT * pregnancyProgress(weeks) *
    (1 + MATERNAL.TWIN_RCM_EXTRA_PCT / 100 * twins);
}

/**
 * Physiological anaemia of pregnancy: plasma expands faster than red cell mass, so the
 * CONCENTRATION falls even as total red cells increase. The trough near 28-32 weeks is the
 * classic "anaemia" that is really dilution.
 */
export function haemoglobinGPerDl(baselineHb: number, rcmIncPct: number, pvIncPct: number): number {
  return baselineHb * ((1 + rcmIncPct / 100) / (1 + pvIncPct / 100));
}

export function cardiacOutputIncreasePct(weeks: number, twins: number, delivered: boolean): number {
  if (delivered) {
    // CO remains elevated immediately postpartum (autotransfusion), then normalises.
    return MATERNAL.CARDIAC_OUTPUT_MAX_INCREASE_PCT * 0.45;
  }
  return MATERNAL.CARDIAC_OUTPUT_MAX_INCREASE_PCT * pregnancyProgress(weeks) *
    (1 + MATERNAL.TWIN_CO_EXTRA_PCT / 100 * twins);
}

export function svrChangePct(weeks: number, placentalFraction: number): number {
  const fall = MATERNAL.SVR_MAX_FALL_PCT * pregnancyProgress(weeks) * placentalFraction;
  const rise = MATERNAL.SVR_RISE_PER_PLACENTA_DEFICIT_PCT * (1 - placentalFraction);
  return rise - fall;
}

export function meanArterialPressureMmHg(weeks: number, placentalFraction: number): number {
  // Mid-trimester dip under low SVR; placental failure reverses it upward — pre-eclampsia.
  const dip = MATERNAL.MAP_MID_PREGNANCY_DIP_MMHG * Math.sin(clamp((weeks - 6) / 30, 0, 1) * Math.PI);
  const rise = MATERNAL.MAP_RISE_PER_PLACENTA_DEFICIT_MMHG * (1 - placentalFraction) * clamp(weeks / 24, 0, 1);
  return 90 - dip + rise;
}

/** Progesterone-stimulated hyperventilation: PaCO2 falls to ~30 at term with renal
 * compensation holding pH only mildly alkalaemic. */
export function paCO2MmHg(weeks: number): number {
  return 37 - MATERNAL.PACO2_FALL_AT_TERM_MMHG * pregnancyProgress(weeks);
}

export function bicarbonateMmolL(weeks: number): number {
  return 24 - MATERNAL.BICARB_FALL_AT_TERM_MMOL_L * pregnancyProgress(weeks);
}

export function phArterial(weeks: number): number {
  // Henderson-Hasselbalch with the compensated pair.
  const paco2 = paCO2MmHg(weeks);
  const hco3 = bicarbonateMmolL(weeks);
  return 6.1 + Math.log10(hco3 / (0.03 * paco2));
}

export function gfrIncreasePct(weeks: number): number {
  return MATERNAL.GFR_MAX_INCREASE_PCT * pregnancyProgress(weeks);
}

export function creatinineMgDl(weeks: number): number {
  return MATERNAL.BASELINE_CREATININE_MG_DL / (1 + gfrIncreasePct(weeks) / 100);
}

export function serumSodiumMmolL(weeks: number): number {
  return 140 - MATERNAL.SODIUM_FALL_AT_TERM_MMOL_L * pregnancyProgress(weeks);
}

/** Estimated fetal weight: cubic growth curve scaled by placental function — the IUGR axis. */
export function fetalWeightG(weeks: number, placentalFraction: number): number {
  const growth = Math.pow(clamp(weeks / 40, 0, 1.06), FETAL.GROWTH_EXPONENT);
  const factor =
    FETAL.WEIGHT_PER_PLACENTA_FRACTION_MIN +
    (1 - FETAL.WEIGHT_PER_PLACENTA_FRACTION_MIN) * placentalFraction;
  return FETAL.TERM_WEIGHT_G * growth * factor;
}

export function uteroplacentalFlowSharePct(weeks: number): number {
  return 5 + (FETAL.UTEROPLACENTAL_FLOW_SHARE_MAX_PCT - 5) * pregnancyProgress(weeks);
}

/** Antenatal progesterone rises toward a term plateau; after delivery it collapses. */
export function progesteroneTargetNgMl(weeks: number, delivered: boolean): number {
  if (delivered) return HORMONE.PROGESTERONE_POSTPARTUM_NG_ML;
  return 12 + HORMONE.PROGESTERONE_TERM_NG_ML * pregnancyProgress(weeks);
}

/** Prolactin is primed through pregnancy but BLOCKED by progesterone until delivery.
 * After delivery it peaks regardless of feeding, then only suckling sustains it. */
export function prolactinTargetNgMl(
  weeks: number,
  delivered: boolean,
  sucklingPct: number,
  postpartumSeconds: number,
): number {
  if (!delivered) return HORMONE.PROLACTIN_BASELINE_NG_ML + HORMONE.PROLACTIN_PRIMED_NG_ML * pregnancyProgress(weeks);
  if (sucklingPct > 10) {
    return HORMONE.PROLACTIN_SUCKLING_TARGET_NG_ML * clamp(sucklingPct / 80, 0.4, 1) + HORMONE.PROLACTIN_BASELINE_NG_ML;
  }
  // No stimulus: the peripartum surge decays away over days and the gland involutes.
  return (
    HORMONE.PROLACTIN_BASELINE_NG_ML +
    (HORMONE.POSTPARTUM_PROLACTIN_PEAK_NG_ML - HORMONE.PROLACTIN_BASELINE_NG_ML) *
      Math.exp(-postpartumSeconds / HORMONE.POSTPARTUM_PROLACTIN_TAU_SECONDS)
  );
}

/**
 * Lactogenesis II needs BOTH prolactin AND the fall of progesterone — which is why milk
 * comes in on day 2-3, not at delivery. Demand scales supply but does not gate it entirely:
 * unsuckled breasts still engorge, then involute as prolactin decays.
 */
export function milkSupplyTargetMlPerDay(progesteroneNgMl: number, prolactinNgMl: number, sucklingPct: number): number {
  const progestGate = clamp((HORMONE.PROGESTERONE_MILK_BLOCK_THRESHOLD_NG_ML + 4 - progesteroneNgMl) / 8, 0, 1);
  const prolactinGate = clamp((prolactinNgMl - HORMONE.PROLACTIN_HALF_SATURATION_NG_ML + 20) / 60, 0, 1);
  const demandGate = 0.3 + 0.7 * clamp(sucklingPct / LABOUR_BASE_SUCKLING_NORM, 0, 1);
  return LACTATION.FULL_SUPPLY_ML_PER_DAY * progestGate * prolactinGate * demandGate;
}

const LABOUR_BASE_SUCKLING_NORM = 70;

/** Ferguson reflex: cervical stretch drives oxytocin drives contraction drives stretch.
 * Dilation therefore accelerates as labour progresses. */
export function dilationRateCmPerMin(dilationCm: number): number {
  const intensity = 0.35 + dilationCm / LABOUR.DILATION_COMPLETE_CM;
  return LABOUR.BASE_DILATION_RATE_CM_PER_MIN * intensity;
}

export function oxytocinDuringLabour(dilationCm: number): number {
  return 10 + LABOUR.OXYTOCIN_LABOUR_PER_CM * dilationCm;
}

export function classifyPregnancy(pattern: {
  weeks: number;
  twins: number;
  placentaPct: number;
  labourActive: boolean;
  delivered: boolean;
  sucklingPct: number;
  milkSupplyMlPerDay: number;
}): PregnancyState_Classification {
  if (pattern.labourActive) return 'in labour: Ferguson reflex active';
  if (pattern.delivered && pattern.sucklingPct > 20 && pattern.milkSupplyMlPerDay > 100)
    return 'postpartum: breastfeeding established';
  if (pattern.delivered) return 'postpartum: lactation suppressed';
  if (pattern.placentaPct < 60) return 'placental insufficiency: IUGR risk';
  if (pattern.twins >= 0.5) return 'twin gestation';
  if (pattern.weeks >= 37) return 'term singleton pregnancy';
  if (pattern.weeks >= 24) return 'third trimester';
  if (pattern.weeks >= 13) return 'second trimester';
  return 'first trimester';
}

export function patternSummary(pattern: {
  classification: PregnancyState_Classification;
  haemoglobinGPerDl: number;
  paCO2MmHg: number;
  creatinineMgDl: number;
  fetalWeightG: number;
  milkSupplyMlPerDay: number;
  progesteroneNgMl: number;
}): string {
  switch (pattern.classification) {
    case 'first trimester':
    case 'second trimester':
    case 'third trimester':
      return `Hb ${pattern.haemoglobinGPerDl.toFixed(1)} g/dL falling with dilution · PaCO2 ${pattern.paCO2MmHg.toFixed(0)} · creatinine ${pattern.creatinineMgDl.toFixed(2)} — all normal for pregnancy`;
    case 'term singleton pregnancy':
      return `Hb ${pattern.haemoglobinGPerDl.toFixed(1)}, CO maximally raised, fetal weight ${pattern.fetalWeightG.toFixed(0)} g`;
    case 'twin gestation':
      return 'double demand: deeper dilutional anaemia and higher output than any singleton week';
    case 'placental insufficiency: IUGR risk':
      return `fetus ${pattern.fetalWeightG.toFixed(0)} g with rising SVR and pressure — the placenta is the failing organ`;
    case 'in labour: Ferguson reflex active':
      return 'stretch drives oxytocin drives stretch — dilation accelerates because of itself';
    case 'postpartum: breastfeeding established':
      return `milk ${pattern.milkSupplyMlPerDay.toFixed(0)} mL/day sustained BY suckling-driven prolactin, not by stores`;
    case 'postpartum: lactation suppressed':
      return `progesterone ${pattern.progesteroneNgMl.toFixed(0)} fallen but no suckling signal: supply involutes within days`;
  }
}
