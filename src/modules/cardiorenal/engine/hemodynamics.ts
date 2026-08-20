import { HEMODYNAMICS } from './constants';
import { clamp } from '@/shared/lib/math';

export function strokeVolume(contractility: number, currentPreloadFactor: number): number {
  return HEMODYNAMICS.BASELINE_STROKE_VOLUME_ML * contractility * currentPreloadFactor;
}

/** Cardiac output in mL/min. */
export function cardiacOutput(effectiveHeartRate: number, currentStrokeVolume: number): number {
  return effectiveHeartRate * currentStrokeVolume;
}

export function effectiveSVR(
  vascularTone: number,
  baroreflexToneMultiplier: number,
  angiotensinIIToneMultiplier: number,
  anpToneReliefMultiplier: number,
): number {
  const svr =
    vascularTone * baroreflexToneMultiplier * angiotensinIIToneMultiplier * anpToneReliefMultiplier;
  return Math.max(HEMODYNAMICS.MIN_EFFECTIVE_SVR, svr);
}

/** Mean arterial pressure in mmHg, calibrated so baseline inputs yield ~MAP_SETPOINT. */
export function meanArterialPressure(currentCardiacOutput: number, currentEffectiveSVR: number): number {
  const map =
    HEMODYNAMICS.MAP_SETPOINT *
    (currentCardiacOutput / HEMODYNAMICS.CO_BASELINE_ML_PER_MIN) *
    currentEffectiveSVR;
  return clamp(map, 0, 400);
}
