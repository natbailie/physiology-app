import { BASELINE, INTERSTITIAL, STARLING, TISSUE_BEDS } from './constants';
import { scaleClamped } from '@/shared/lib/math';
import type { EdemaMechanism, TissueBed } from './types';

/**
 * Attribute the current state to one of the four mechanisms of oedema by asking which change
 * from baseline contributes most to the excess filtration. All four fall out of the same
 * equation, which is the point: there is no separate theory of nephrotic oedema or of septic
 * oedema, only different terms of one expression being disturbed.
 */
export function dominantMechanism(
  capillaryPressureMmHg: number,
  plasmaOncoticMmHg: number,
  interstitialOncoticMmHg: number,
  reflectionCoefficient: number,
  capillaryPermeability: number,
  lymphaticFlowCapacity: number,
  interstitialExcess: number,
  tissueBed: TissueBed,
): EdemaMechanism {
  if (interstitialExcess < INTERSTITIAL.OEDEMA_ONSET_EXCESS) return 'none';

  const kf = STARLING.KF_BASE_ML_PER_MIN_PER_MMHG * TISSUE_BEDS[tissueBed].kfScale;

  // Each term is expressed as the extra mL/min of filtration it is responsible for.
  const fromPressure = kf * Math.max(0, capillaryPressureMmHg - BASELINE.CAPILLARY_PRESSURE_MMHG);
  const fromOncotic = kf * Math.max(0, BASELINE.PLASMA_ONCOTIC_MMHG - plasmaOncoticMmHg);
  const fromPermeability =
    kf *
    (Math.max(0, capillaryPermeability - 1) * BASELINE.NET_FILTRATION_PRESSURE_MMHG +
      Math.max(0, 1 - reflectionCoefficient) * (plasmaOncoticMmHg - interstitialOncoticMmHg));
  // A lymphatic problem is a loss of DRAINAGE CAPACITY, not an exhausted reserve — every severe
  // oedema exhausts its reserve, whatever caused it. Keying on capacity is what lets this be the
  // answer when every Starling force is normal, which is the case that is otherwise missed.
  const lostCapacity = Math.max(0, 1 - lymphaticFlowCapacity);
  const fromLymphatics = lostCapacity * 3 * Math.max(fromPressure, fromOncotic, fromPermeability, 1);

  const candidates: { mechanism: EdemaMechanism; weight: number }[] = [
    { mechanism: 'raisedCapillaryPressure', weight: fromPressure },
    { mechanism: 'lowPlasmaOncotic', weight: fromOncotic },
    { mechanism: 'increasedPermeability', weight: fromPermeability },
    { mechanism: 'lymphaticFailure', weight: fromLymphatics },
  ];

  const winner = candidates.reduce((best, candidate) => (candidate.weight > best.weight ? candidate : best));
  return winner.weight <= 0 ? 'lymphaticFailure' : winner.mechanism;
}

export const MECHANISM_LABELS: Record<EdemaMechanism, string> = {
  none: 'Starling forces balanced',
  raisedCapillaryPressure: 'raised capillary pressure',
  lowPlasmaOncotic: 'low plasma oncotic pressure',
  increasedPermeability: 'increased permeability',
  lymphaticFailure: 'lymphatic failure',
};

/**
 * The combined safety factor: how much further capillary pressure could rise before fluid began
 * to accumulate. Guyton put it at about 17 mmHg in normal tissue — roughly 7 from the rise in
 * interstitial pressure, 7 from washing protein out of the interstitium, and 3 to 7 from the
 * lymphatic reserve. It is why a healthy person can stand all day and not swell.
 */
export function safetyFactor(
  netFiltrationPressureMmHg: number,
  interstitialPressureMmHg: number,
  interstitialOncoticMmHg: number,
  lymphaticReserveFraction: number,
  tissueBed: TissueBed,
): number {
  const bed = TISSUE_BEDS[tissueBed];
  const fromInterstitialPressure =
    INTERSTITIAL.GEL_PRESSURE_GAIN_MMHG * INTERSTITIAL.GEL_CAPACITY_FRACTION -
    Math.max(0, interstitialPressureMmHg - bed.baselineInterstitialPressureMmHg);
  const fromProteinWashout = Math.max(0, interstitialOncoticMmHg);
  const fromLymphatics = lymphaticReserveFraction * 6;
  return Math.max(0, fromInterstitialPressure + fromProteinWashout + fromLymphatics - Math.max(0, netFiltrationPressureMmHg));
}

/** For the lung: fluid in the interstitium widens the diffusion distance long before it reaches
 * the alveoli, so gas exchange starts to fail well before anything is audible or visible. */
export function oxygenationImpairment(interstitialExcess: number, tissueBed: TissueBed): number {
  if (tissueBed !== 'pulmonary') return 0;
  return scaleClamped(interstitialExcess, 0.03, 0.6, 0, 1);
}
