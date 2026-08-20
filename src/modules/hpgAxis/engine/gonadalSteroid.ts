import { FEMALE, MALE } from './constants';
import { clamp } from '@/shared/lib/math';

/** Target testosterone (0..1): Leydig cells respond to LH, gated by gonadal function. */
export function testosteroneTarget(lhLevel: number, gonadalFunction: number): number {
  return clamp(lhLevel * MALE.TESTOSTERONE_LH_GAIN * clamp(gonadalFunction, 0, 1.5), 0, 1);
}

/** Target inhibin (0..1): Sertoli cells respond to FSH. Its selective FSH suppression is the
 * second half of the male axis's two-loop structure. */
export function inhibinTarget(fshLevel: number, gonadalFunction: number): number {
  return clamp(fshLevel * MALE.INHIBIN_FSH_GAIN * clamp(gonadalFunction, 0, 1.5), 0, 1);
}

/**
 * Target follicle size (0..1): FSH recruits and grows the follicle through the follicular
 * phase, but a follicle that has already been selected keeps growing semi-autonomously.
 *
 * That autonomy term is essential, not decoration. Rising estrogen suppresses FSH by ordinary
 * negative feedback, so a purely FSH-driven follicle would throttle its own growth and
 * estrogen would plateau below the level needed to trigger the surge. In reality the dominant
 * follicle becomes progressively FSH-independent, which is exactly what lets its estrogen
 * output ESCAPE the negative feedback and climb to the threshold that flips the axis to
 * positive feedback. No autonomy, no ovulation.
 */
export function follicleSizeTarget(fshLevel: number, gonadalFunction: number, inFollicularPhase: boolean, currentFollicleSize: number): number {
  if (!inFollicularPhase) return 0;
  const fshDriven = fshLevel * FEMALE.FOLLICLE_GROWTH_FSH_GAIN;
  const autonomous = currentFollicleSize * FEMALE.FOLLICLE_AUTONOMY_GAIN;
  return clamp((fshDriven + autonomous) * clamp(gonadalFunction, 0, 1.5), 0, 1);
}

/** Target estrogen (0..1): produced by the growing follicle in the follicular phase and by
 * the corpus luteum in the luteal phase. */
export function estrogenTarget(follicleSize: number, corpusLuteumActivity: number, gonadalFunction: number): number {
  const follicular = follicleSize * FEMALE.ESTROGEN_FOLLICLE_GAIN;
  const luteal = corpusLuteumActivity * 0.55;
  return clamp(Math.max(follicular, luteal) * clamp(gonadalFunction, 0, 1.5), 0, 1);
}

/** Target progesterone (0..1): essentially absent until ovulation, then produced by the
 * corpus luteum. Its appearance is what marks the luteal phase and confirms ovulation
 * occurred — and it is what restores negative feedback after the surge. */
export function progesteroneTarget(corpusLuteumActivity: number, gonadalFunction: number): number {
  return clamp(corpusLuteumActivity * FEMALE.PROGESTERONE_LUTEAL_GAIN * clamp(gonadalFunction, 0, 1.5), 0, 1);
}
