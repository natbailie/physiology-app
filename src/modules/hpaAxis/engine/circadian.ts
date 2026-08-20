import { CIRCADIAN } from './constants';

/** Intrinsic diurnal modulation of hypothalamic CRH drive — not a slider input, since students
 * don't control their own circadian rhythm. Peaks near the start of the simulated "day". */
export function circadianCrhModulation(simTimeSeconds: number): number {
  const phase = (simTimeSeconds % CIRCADIAN.PERIOD_SECONDS) / CIRCADIAN.PERIOD_SECONDS;
  return CIRCADIAN.AMPLITUDE * Math.cos(2 * Math.PI * (phase - CIRCADIAN.PEAK_PHASE_FRACTION));
}
