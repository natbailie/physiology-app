import type { LeadName } from './types';

/**
 * Hexaxial reference system: each limb lead's positive electrode direction, in degrees, with
 * 0° pointing to the patient's left (lead I) and +90° pointing down (aVF).
 *
 * A depolarisation wavefront travelling TOWARD a lead's positive electrode writes an upward
 * deflection; one travelling away writes a downward deflection. Everything the lead selector
 * demonstrates — including why aVR is normally inverted — is just this projection.
 */
export const LEAD_AXES: Record<LeadName, number> = {
  I: 0,
  II: 60,
  III: 120,
  aVR: -150,
  aVL: -30,
  aVF: 90,
};

export const TIMING = {
  // Atrial depolarisation begins the beat; t = 0 is P-wave onset.
  ATRIAL_ONSET_MS: 0,
  // Offsets from the ventricular onset (which is itself avDelayMs after the atrial onset).
  HIS_OFFSET_MS: -12,
  BUNDLE_OFFSET_MS: -6,
  SEPTUM_OFFSET_MS: 0,
  LV_FREE_WALL_OFFSET_MS: 12,
  RV_FREE_WALL_OFFSET_MS: 15,
  LV_BASE_OFFSET_MS: 46,
  // A bundle branch block delays and slows its territory. Calibrated so a complete block
  // widens the QRS to roughly 140 ms — comfortably past the 120 ms diagnostic threshold,
  // without the absurd widths a larger penalty would produce.
  BUNDLE_BLOCK_MAX_DELAY_MS: 46,
  BUNDLE_BLOCK_MAX_STRETCH: 1.9,
  // Ventricular escape rhythm when the AV node stops conducting entirely.
  ESCAPE_RATE_BPM: 40,
  // Above this, dissociation is complete (third-degree block).
  COMPLETE_BLOCK_THRESHOLD: 0.75,
  // Between these, beats are intermittently dropped (second-degree block).
  DROPPED_BEAT_THRESHOLD: 0.3,
};

export const REPOLARIZATION = {
  // Repolarisation is far slower and more spread out than depolarisation, which is why the T
  // wave is broad and low rather than sharp and tall like the QRS. Calibrated to leave a
  // clearly readable ST segment between the end of the QRS and the start of the T wave —
  // the window where an injury current becomes visible.
  DURATION_MS: 130,
  // Peak T amplitude relative to the same region's depolarisation contribution.
  MAGNITUDE_SCALE: 0.3,
  // Action potential duration shortens as rate rises; this exponent reproduces the familiar
  // rate-dependence that Bazett's correction exists to undo.
  RATE_ADAPTATION_EXPONENT: 0.35,
  // Atrial repolarisation (the Ta wave) is small and buried inside the QRS, so it is given a
  // negligible weight rather than being drawn.
  ATRIAL_MAGNITUDE_SCALE: 0.05,
};

export const POTASSIUM = {
  NORMAL_MEQ_L: 4,
  // Hyperkalemia accelerates repolarisation — the classic tall, narrow, peaked T wave.
  T_PEAKING_PER_MEQ: 0.42,
  APD_SHORTENING_PER_MEQ: 0.07,
  // It also slows conduction, widening the QRS...
  CONDUCTION_SLOWING_PER_MEQ: 0.22,
  // ...and depresses atrial excitability, flattening then abolishing the P wave.
  ATRIAL_SUPPRESSION_PER_MEQ: 0.3,
};

export const INJURY = {
  // Ischemic myocardium sits at a less negative resting potential, so a current flows between
  // injured and healthy tissue during electrical diastole. It appears on the trace as a shift
  // of the ST segment — elevation in leads facing the injury, reciprocal depression opposite.
  ST_DEVIATION_MV_PER_UNIT: 0.55,
  // Frontal-plane direction of the modeled infarct territory (inferior wall).
  TERRITORY_ANGLE_DEGREES: 90,
};

export const ATRIAL_FIBRILLATION = {
  // Chaotic atrial activity replaces the organised P wave with low-amplitude fibrillatory waves.
  FIBRILLATORY_AMPLITUDE_MV: 0.06,
  FIBRILLATORY_FREQUENCY_HZ: 7,
  // The ventricular response is irregularly irregular: each RR interval is scaled by a
  // deterministic pseudo-random factor in this range, so the rhythm is reproducibly erratic.
  RR_VARIATION_MIN: 0.62,
  RR_VARIATION_MAX: 1.42,
};

export const AXIS = {
  NORMAL_MIN_DEGREES: -30,
  NORMAL_MAX_DEGREES: 90,
  EXTREME_MIN_DEGREES: -90,
};

export const ECG_SIMULATION = {
  MAX_DT_SECONDS: 0.02,
  RENDER_INTERVAL_MS: 33,
  // ~4s of real time on screen at this render interval; at TIME_SCALE 0.35 that is roughly
  // 1.4s of cardiac time — a couple of complete beats visible at once.
  HISTORY_CAPACITY: 260,
  // Slower than real time so the depolarisation wavefront sweeping the myocardium is actually
  // watchable while its wave is being inscribed. The heart diagram and the trace are driven by
  // the same clock, so they stay provably in step.
  TIME_SCALE: 0.35,
};
