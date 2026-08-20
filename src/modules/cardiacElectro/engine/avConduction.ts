import { ECG } from './constants';
import { clamp } from '@/shared/lib/math';

/** Gaussian bump used to shape each ECG deflection. */
function bump(phase: number, center: number, width: number, amplitude: number): number {
  const distance = phase - center;
  return amplitude * Math.exp(-(distance * distance) / (2 * width * width));
}

/**
 * A schematic P-QRS-T deflection for the current point in the cycle. This is a cartoon of
 * SEQUENCE and TIMING — atrial depolarization, then the AV delay, then ventricular
 * depolarization and repolarization — not a real electrogram, and it must not be read as one.
 *
 * The AV delay sets the gap between the P wave and the QRS (the PR interval). Its purpose is
 * to let the atria finish emptying before the ventricles contract; too long and the two
 * decouple entirely, which is complete heart block.
 */
export function ecgVoltage(cyclePhaseFraction: number, avConductionDelayMs: number, heartRateBpm: number): number {
  const cycleDurationMs = (60 / Math.max(heartRateBpm, 1)) * 1000;
  const delayAsPhaseFraction = clamp(avConductionDelayMs / cycleDurationMs, 0, 0.5);

  const qrsCenter = ECG.P_WAVE_CENTER + delayAsPhaseFraction;
  const tCenter = qrsCenter + ECG.T_WAVE_OFFSET_FROM_QRS;

  const p = bump(cyclePhaseFraction, ECG.P_WAVE_CENTER, ECG.P_WAVE_WIDTH, ECG.P_WAVE_AMPLITUDE);
  // QRS drawn as a sharp positive spike flanked by small negative deflections.
  const q = bump(cyclePhaseFraction, qrsCenter - ECG.QRS_WIDTH, ECG.QRS_WIDTH * 0.6, -0.18);
  const r = bump(cyclePhaseFraction, qrsCenter, ECG.QRS_WIDTH, ECG.QRS_AMPLITUDE);
  const s = bump(cyclePhaseFraction, qrsCenter + ECG.QRS_WIDTH, ECG.QRS_WIDTH * 0.6, -0.22);
  const t = bump(cyclePhaseFraction, tCenter, ECG.T_WAVE_WIDTH, ECG.T_WAVE_AMPLITUDE);

  return p + q + r + s + t;
}

/** Whether the AV delay has grown long enough that atrial and ventricular activation have
 * decoupled — complete heart block. */
export function isHeartBlock(avConductionDelayMs: number): boolean {
  return avConductionDelayMs >= ECG.HEART_BLOCK_DELAY_MS;
}
