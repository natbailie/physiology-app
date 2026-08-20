import { GONADOTROPINS } from './constants';
import { clamp } from '@/shared/lib/math';

/**
 * Target LH (0..1). Normally driven by GnRH and restrained by gonadal steroid negative
 * feedback — but during the positive-feedback window it is driven to maximum, producing the
 * ovulatory surge.
 */
export function lhTarget(
  gnrhDrive: number,
  responsiveness: number,
  steroidFeedback: number,
  inPositiveFeedback: boolean,
): number {
  if (inPositiveFeedback) {
    return clamp(GONADOTROPINS.SURGE_LH_TARGET * responsiveness, 0, 1);
  }
  const driven = gnrhDrive * responsiveness * GONADOTROPINS.LH_GAIN;
  return clamp(driven * (1 - steroidFeedback * GONADOTROPINS.LH_FEEDBACK_SENSITIVITY), 0, 1);
}

/**
 * Target FSH (0..1). Driven by the same GnRH signal as LH but restrained by TWO brakes:
 * gonadal steroid AND inhibin, which acts selectively on FSH. That second, FSH-specific brake
 * is why the two gonadotropins can dissociate — in primary gonadal failure, loss of inhibin
 * lets FSH rise disproportionately to LH, a useful diagnostic signature.
 */
export function fshTarget(
  gnrhDrive: number,
  responsiveness: number,
  steroidFeedback: number,
  inhibinLevel: number,
  inPositiveFeedback: boolean,
): number {
  if (inPositiveFeedback) {
    return clamp(GONADOTROPINS.SURGE_FSH_TARGET * responsiveness, 0, 1);
  }
  const driven = gnrhDrive * responsiveness * GONADOTROPINS.FSH_GAIN;
  const steroidBrake = steroidFeedback * GONADOTROPINS.FSH_FEEDBACK_SENSITIVITY;
  const inhibinBrake = inhibinLevel * GONADOTROPINS.FSH_INHIBIN_SENSITIVITY;
  return clamp(driven * (1 - clamp(steroidBrake + inhibinBrake, 0, 1)), 0, 1);
}
