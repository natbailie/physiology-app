/**
 * Calibrated to the classic urodynamics: first desire around 150-200 mL, strong desire
 * at 300-400 mL, normal capacity 400-500 mL, maximum ~600 mL. Filling rate 1-5 mL/min
 * (normal ≈ 1.5). Voiding only when intravesical pressure exceeds sphincter closing
 * pressure — turbulent flow through the urethra.
 */

export const BLADDER = {
  MAX_CAPACITY_ML: 600,
  FIRST_DESIRE_ML: 180,
  STRONG_DESIRE_ML: 350,
  MICTURITION_THRESHOLD_ML: 400,
  /** Passive wall tension: pressure = PASSIVE_TENSION × (V / CAPACITY)². */
  PASSIVE_TENSION_CMH2O: 8,
  /** Active detrusor contraction adds this at full tone, cmH₂O. */
  DETRUSOR_PRESSURE_CMH2O: 40,
  /** Maximum closing pressure a fully contracted sphincter can contain, cmH₂O. */
  SPHINCTER_MAX_CLOSING_PRESSURE: 80,
  /**
   * Flow coefficient: flow = k × ΔP × √ΔP (turbulent flow through the urethra).
   * Calibrated so a detrusor at full tone (40 cmH₂O) against a fully relaxed sphincter
   * produces ~1200 mL/min peak flow, consistent with a strong voluntary void.
   */
  FLOW_COEFFICIENT: 4.8,
  DETRUSOR_TAU_SECONDS: 3,
  SPHINCTER_TAU_SECONDS: 0.5,
  AFFERENT_SENSITIVITY: 0.0045,
  AFFERENT_MAX: 1,
} as const;

export const SIMULATION = {
  TIME_SCALE: 60,
  MAX_DT_SECONDS: 2,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 600,
} as const;
