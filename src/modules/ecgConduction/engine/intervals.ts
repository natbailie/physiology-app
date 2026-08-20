import { qrsWindow, tWaveEndMs, type ActivationSchedule } from './activation';

export interface MeasuredIntervals {
  prIntervalMs: number;
  qrsDurationMs: number;
  qtIntervalMs: number;
  qtcMs: number;
}

/**
 * Reads the standard intervals off the activation schedule, exactly as they would be measured
 * off a strip: PR from atrial onset to the start of ventricular depolarisation, QRS across the
 * whole of ventricular depolarisation, QT from QRS onset to the end of repolarisation.
 */
export function measureIntervals(schedule: ActivationSchedule, avDelayMs: number, rrIntervalMs: number): MeasuredIntervals {
  const qrs = qrsWindow(schedule);
  const qtIntervalMs = tWaveEndMs(schedule) - qrs.onsetMs;

  return {
    // The ventricular clock starts avDelayMs after the atrial one, and the QRS may begin a
    // little into that frame, so both terms count toward the measured PR.
    prIntervalMs: avDelayMs + qrs.onsetMs,
    qrsDurationMs: qrs.durationMs,
    qtIntervalMs,
    qtcMs: bazettQtc(qtIntervalMs, rrIntervalMs),
  };
}

/**
 * Bazett's correction: QTc = QT / √(RR in seconds).
 *
 * The action potential shortens as heart rate rises, so a raw QT is uninterpretable without
 * knowing the rate. Because the engine models that rate adaptation explicitly rather than
 * hardcoding a QT, the correction here does real work — change the rate and watch QT move
 * while QTc stays put, which is the whole reason the correction exists.
 */
export function bazettQtc(qtIntervalMs: number, rrIntervalMs: number): number {
  const rrSeconds = Math.max(rrIntervalMs, 1) / 1000;
  return qtIntervalMs / Math.sqrt(rrSeconds);
}
