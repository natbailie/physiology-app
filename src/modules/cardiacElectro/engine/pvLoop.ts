import { ELASTANCE, VENTRICLE } from './constants';
import { chamberPressure, elastanceAtPhase } from './elastance';
import { clamp } from '@/shared/lib/math';
import type { CardiacPhase } from './types';

/**
 * Determines which of the four cardiac-cycle phases the ventricle is in. Crucially, the phase
 * is decided by VALVE STATES, which are themselves decided by pressure comparisons — not by
 * the clock. That is what makes the PV loop respond correctly to afterload: raise aortic
 * pressure and the aortic valve simply opens later, shortening ejection on its own.
 *
 * - Filling: mitral valve open (LV pressure below atrial filling pressure)
 * - Isovolumic contraction: both valves shut, pressure rising at constant volume
 * - Ejection: aortic valve open (LV pressure has exceeded afterload)
 * - Isovolumic relaxation: both valves shut again, pressure falling at constant volume
 */
export function cardiacPhase(
  cyclePhaseFraction: number,
  lvPressureMmHg: number,
  afterloadPressure: number,
  volumeML: number,
  preloadEDV: number,
): CardiacPhase {
  const inSystole = cyclePhaseFraction <= ELASTANCE.SYSTOLE_FRACTION;

  if (inSystole) {
    if (lvPressureMmHg >= afterloadPressure) return 'ejection';
    // Below afterload during systole means the aortic valve is shut — but WHICH isovolumic
    // phase depends on whether ejection has already happened. A ventricle still at its
    // end-diastolic volume is building pressure; one that has already emptied is relaxing.
    return volumeML < preloadEDV - 0.5 ? 'isovolumicRelaxation' : 'isovolumicContraction';
  }

  // Diastole: the ventricle relaxes isovolumically until its pressure drops below the atrial
  // filling pressure, at which point the mitral valve opens and filling begins.
  if (lvPressureMmHg > VENTRICLE.FILLING_PRESSURE_MMHG && volumeML < preloadEDV) {
    return 'isovolumicRelaxation';
  }
  return 'filling';
}

/**
 * The end-diastolic volume the ventricle is actually filling toward, mL.
 *
 * The requested preload plus a share of whatever the last beat failed to eject. See
 * `VENTRICLE.RESIDUAL_FILLING_COUPLING`. At the calibrated baseline the residue is exactly
 * `BASELINE_ESV_ML`, so this returns `preloadEDV` unchanged and the slider still means what it says.
 */
export function effectivePreloadEDV(preloadEDV: number, endSystolicVolumeLastBeat: number): number {
  const residue = endSystolicVolumeLastBeat - VENTRICLE.BASELINE_ESV_ML;
  return clamp(
    preloadEDV + VENTRICLE.RESIDUAL_FILLING_COUPLING * residue,
    VENTRICLE.MIN_VOLUME_ML,
    VENTRICLE.MAX_VOLUME_ML,
  );
}

/**
 * Advances ventricular volume for one tick according to the current phase. Volume changes ONLY
 * when a valve is open — during both isovolumic phases it is held constant by definition,
 * which is what produces the PV loop's two vertical limbs.
 */
export function nextVolume(
  phase: CardiacPhase,
  volumeML: number,
  preloadEDV: number,
  lvPressureMmHg: number,
  afterloadPressure: number,
  dtSeconds: number,
): number {
  switch (phase) {
    case 'filling': {
      // Fills toward EDV, driven by the atrioventricular pressure gradient.
      const gradient = clamp((preloadEDV - volumeML) / Math.max(preloadEDV, 1), 0, 1);
      return clamp(volumeML + gradient * preloadEDV * (dtSeconds / VENTRICLE.FILLING_TAU_SECONDS), VENTRICLE.MIN_VOLUME_ML, preloadEDV);
    }
    case 'ejection': {
      // Ejects while chamber pressure exceeds aortic pressure, with flow scaling on that
      // gradient. The gain is high because real ejection is rapid and near-isobaric: only a
      // few mmHg of gradient drives the whole stroke volume out. A sluggish gain would leave
      // volume lagging behind the rising elastance and produce absurd peak pressures.
      const gradient = Math.max(0, lvPressureMmHg - afterloadPressure);
      const ejectionRate = gradient * 12;
      return clamp(volumeML - ejectionRate * dtSeconds, VENTRICLE.MIN_VOLUME_ML, VENTRICLE.MAX_VOLUME_ML);
    }
    case 'isovolumicContraction':
    case 'isovolumicRelaxation':
    default:
      // Both valves closed — volume cannot change.
      return volumeML;
  }
}

/** Pressure the chamber develops at its current volume and point in the cycle. */
export function ventricularPressure(cyclePhaseFraction: number, volumeML: number, contractility: number): number {
  return clamp(
    chamberPressure(volumeML, elastanceAtPhase(cyclePhaseFraction, contractility)),
    VENTRICLE.MIN_PRESSURE_MMHG,
    VENTRICLE.MAX_PRESSURE_MMHG,
  );
}
