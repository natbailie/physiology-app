import { TOXICOLOGY } from './constants';
import { clamp } from '@/shared/lib/math';
import type {
  ToxicologyDerived,
  ToxicologyHistoryPoint,
  ToxicologyInputs,
  ToxicologyInternalState,
  ToxicologySnapshot,
} from './types';

const K = Math.LN2 / TOXICOLOGY.HALF_LIFE_HOURS;

/** Log-linear extrapolation of the Rumack-Matthew line (100 mg/L at 4h, timed, and 15 mg/L at 24h). */
function nomogramLineAt(hours: number): number {
  const h = clamp(hours, 0, 24);
  const spread = 24 - 4;
  const spanned = Math.pow(TOXICOLOGY.NOMOGRAM_LINE_24H_MG_PER_L / TOXICOLOGY.NOMOGRAM_LINE_4H_MG_PER_L, (h - 4) / spread);
  return TOXICOLOGY.NOMOGRAM_LINE_4H_MG_PER_L * spanned;
}

/** Circulating paracetamol (mg/L) after instant absorption at 0.5h and first-order elimination.
 * Dose is per kg and the volume of distribution is ~1 L/kg, so the injected concentration in
 * mg/L reads off the absorbed dose in mg/kg directly. */
function plasmaOf(inputs: ToxicologyInputs): number {
  const absorbed = inputs.doseMgKg * (1 - inputs.charcoalDosePct / 100);
  const elapsed = Math.max(0, inputs.hoursSinceIngestion - TOXICOLOGY.PEAK_HOURS);
  return absorbed * Math.exp(-K * elapsed);
}

function nacProtectionOf(startHours: number): number {
  if (startHours <= TOXICOLOGY.NAC_WINDOW_HOURS) return TOXICOLOGY.NAC_PROTECTION_EARLY;
  if (startHours <= 24) return TOXICOLOGY.NAC_PROTECTION_LATE;
  return TOXICOLOGY.NAC_PROTECTION_VERY_LATE;
}

function stateOf(derived: ToxicologyDerived, inputs: ToxicologyInputs): string {
  if (inputs.hoursSinceIngestion > 24) return 'Past the window';
  if (derived.hepatotoxicityRisk >= 0.6) return 'High risk';
  const needsNac = derived.absorbedDoseMgPerKg >= TOXICOLOGY.TOXIC_DOSE_MG_PER_KG;
  if (!derived.nacStarted) return needsNac ? 'Awaiting NAC' : 'Sub-toxic';
  if (derived.nomogramRatio > 1) return 'Above the line';
  if (needsNac) return 'Low risk — protected';
  return 'Sub-toxic';
}

export function createInitialState(): ToxicologyInternalState {
  return { simTimeSeconds: 0, plasmaMgL: 0 };
}

export function computeDerived(_state: ToxicologyInternalState, inputs: ToxicologyInputs): ToxicologyDerived {
  const { doseMgKg, hoursSinceIngestion, charcoalDosePct, nacStartHours } = inputs;
  const plasmaMgL = plasmaOf(inputs);
  const nomogramLineMgL = nomogramLineAt(hoursSinceIngestion);
  const nomogramRatio = plasmaMgL / nomogramLineMgL;
  const absorbedDoseMgPerKg = doseMgKg * (1 - charcoalDosePct / 100);
  const charcoalReductionPct = charcoalDosePct;
  const nacStarted = nacStartHours <= hoursSinceIngestion;
  const protectionRaw = nacProtectionOf(nacStartHours);
  const nacProtection = nacStarted ? protectionRaw : 0;
  const rawRisk = clamp((nomogramRatio - 0.8) / 0.9, 0, 1);
  const hepatotoxicityRisk = rawRisk * (1 - 0.85 * nacProtection);
  const antidoteWindowHours = clamp(TOXICOLOGY.NAC_WINDOW_HOURS - hoursSinceIngestion, 0, TOXICOLOGY.NAC_WINDOW_HOURS);

  const derived: ToxicologyDerived = {
    hoursSinceIngestion,
    plasmaMgL,
    nomogramLineMgL,
    nomogramRatio,
    absorbedDoseMgPerKg,
    charcoalReductionPct,
    nacStarted,
    nacProtection,
    antidoteWindowHours,
    hepatotoxicityRisk,
    state: '',
  };
  derived.state = stateOf(derived, inputs);
  return derived;
}

export function step(state: ToxicologyInternalState, inputs: ToxicologyInputs, dtSeconds: number): ToxicologySnapshot {
  const nextState: ToxicologyInternalState = {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    plasmaMgL: plasmaOf(inputs),
  };
  return { state: nextState, derived: computeDerived(nextState, inputs) };
}

export function toHistoryPoint(snapshot: ToxicologySnapshot): ToxicologyHistoryPoint {
  return {
    t: snapshot.state.simTimeSeconds,
    plasma: snapshot.derived.plasmaMgL,
    risk: snapshot.derived.hepatotoxicityRisk,
  };
}

/** `ToxicologySnapshot` re-exported so engine consumers can name it without re-importing types. */
export type { ToxicologySnapshot };