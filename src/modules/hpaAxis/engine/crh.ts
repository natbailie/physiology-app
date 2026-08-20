import { CRH } from './constants';
import { circadianCrhModulation } from './circadian';
import { clamp } from '@/shared/lib/math';

/**
 * Target hypothalamic CRH drive (0..1): driven up by acute stress and the circadian rhythm,
 * suppressed by rising cortisol (negative feedback). The engine relaxes the actual (smoothed)
 * drive toward this target on CRH.TAU_SECONDS — the fastest actuator in this module, mirroring
 * baroreflexDrive/chemoreceptorDrive being the fastest actuators in the other two modules.
 */
export function crhDriveTarget(acuteStressLevel: number, acuteStressBolus: number, cortisolLevel: number, simTimeSeconds: number): number {
  const stressTerm = acuteStressLevel * CRH.STRESS_GAIN + acuteStressBolus;
  const circadianTerm = circadianCrhModulation(simTimeSeconds);
  const feedbackTerm = -(cortisolLevel - CRH.FEEDBACK_SETPOINT_UGDL) / CRH.FEEDBACK_SENSITIVITY_UGDL;
  return clamp(stressTerm + circadianTerm + feedbackTerm, 0, 1);
}
