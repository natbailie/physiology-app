import type { TissueBed } from './types';

export const BASELINE = {
  PLASMA_VOLUME_ML: 3500,
  PLASMA_ALBUMIN_G_DL: 4.2,
  /** Guyton's mean values for a systemic capillary, which the defaults here reproduce:
   * Pc 17.3, Pi -3, pi_c 28, pi_i 8 — a net filtration pressure of about 0.3 mmHg, giving
   * ~2 mL/min of filtration, which is exactly the normal lymph flow. */
  CAPILLARY_PRESSURE_MMHG: 17.3,
  PLASMA_ONCOTIC_MMHG: 28,
  NET_FILTRATION_PRESSURE_MMHG: 0.3,
};

export const STARLING = {
  /** Whole-body filtration coefficient, mL/min per mmHg, before the per-bed scaling below. */
  KF_BASE_ML_PER_MIN_PER_MMHG: 6.7,
};

export const ONCOTIC = {
  /** Albumin is roughly 60% of plasma protein by mass but contributes most of the oncotic
   * pressure, being smaller and more numerous. This converts an albumin concentration into the
   * total-protein equivalent the Landis-Pappenheimer equation expects, calibrated so that a
   * normal 4.2 g/dL albumin gives exactly the textbook 28 mmHg. */
  PROTEIN_PER_ALBUMIN: 1.764,
  /** Landis-Pappenheimer: oncotic pressure is markedly NON-linear in protein concentration,
   * because of the Gibbs-Donnan effect and protein-protein interaction. Halving albumin more
   * than halves the oncotic pressure — which is why nephrotic syndrome causes oedema so
   * effectively while a mild fall in albumin causes none at all. */
  LP_LINEAR: 2.1,
  LP_QUADRATIC: 0.16,
  LP_CUBIC: 0.009,
  MAX_PROTEIN_G_DL: 14,
};

export const INTERSTITIAL = {
  /** Two-phase compliance. Within the gel phase the matrix is stiff and pressure rises steeply
   * — the single largest safety factor against oedema, worth about 7 mmHg. Once the gel is
   * saturated, free fluid appears, compliance becomes enormous, and pressure barely rises
   * however much more arrives. That transition is why oedema seems to appear all at once. */
  GEL_CAPACITY_FRACTION: 0.3,
  GEL_PRESSURE_GAIN_MMHG: 23,
  FREE_FLUID_PRESSURE_GAIN_MMHG: 2,
  MIN_PRESSURE_MMHG: -14,
  MAX_PRESSURE_MMHG: 24,
  PITTING_EXCESS: 0.3,
  OEDEMA_ONSET_EXCESS: 0.12,
  MIN_VOLUME_FRACTION: 0.4,
  /** Tissue cannot expand without limit — skin and fascia eventually refuse. Reaching this
   * ceiling means the model has run out of physiology, not that the swelling has stabilised. */
  MAX_VOLUME_FRACTION: 2.5,
};

export const LYMPHATIC = {
  /** Flow reaches capacity over roughly this rise in interstitial pressure, in every bed. */
  SATURATION_PRESSURE_MMHG: 4.75,
};

export const CIRCULATION = {
  /** How steeply capillary pressure follows plasma volume. */
  PERFUSION_EXPONENT: 1.5,
  MIN_PERFUSION_RATIO: 0.3,
  MAX_PERFUSION_RATIO: 1.4,
};

export const PROTEIN = {
  /** Plasma protein at normal albumin, g/dL — the concentration the diffusive flux works from. */
  BASELINE_PLASMA_G_DL: 4.2 * 1.764,
  /** Synthesis and catabolism together pull plasma protein back toward the level the albumin
   * input specifies, over about an hour. That input is the clinical set point — what the liver
   * is managing to sustain against whatever is being lost — so a single albumin infusion is a
   * transient measure rather than a treatment: the level returns to where the disease put it. */
  SYNTHESIS_TAU_SECONDS: 3600,
};

export const PLASMA = {
  /** Plasma volume is continuously restored from the gut and by renal retention. Without this
   * term a sustained filtration would simply empty the circulation; with it, the model shows
   * what actually happens — the interstitium fills at the expense of a body that keeps
   * replacing the lost volume. */
  REFILL_TAU_SECONDS: 7200,
  MIN_VOLUME_ML: 1200,
  MAX_VOLUME_ML: 9000,
};

interface BedProfile {
  label: string;
  /** Ratio of precapillary to postcapillary resistance. Precapillary resistance normally
   * dominates more than tenfold, which is why capillary pressure sits far closer to venous than
   * to arterial pressure — and therefore why a rise in VENOUS pressure is transmitted almost
   * completely to the capillary while a rise in arterial pressure is largely absorbed. */
  preToPostResistanceRatio: number;
  /** Fraction of the inflow-to-outflow pressure drop occurring across the capillary itself. */
  endPressureSpreadFraction: number;
  baselineInterstitialPressureMmHg: number;
  interstitialVolumeMl: number;
  baselineInterstitialProteinGDl: number;
  kfScale: number;
  lymphBaseFlowMlPerMin: number;
  /** Capacity divided by baseline flow IS the lymphatic reserve, and it differs sharply between
   * beds: about twentyfold systemically, tenfold in the lung, and only threefold in the liver —
   * which is why a modest rise in portal pressure produces ascites while the same relative rise
   * in a limb produces nothing at all. */
  lymphCapacityMlPerMin: number;
  defaultReflectionCoefficient: number;
  defaultInflowPressure: number;
  defaultOutflowPressure: number;
  toleranceExcess: number;
}

export const TISSUE_BEDS: Record<TissueBed, BedProfile> = {
  systemic: {
    label: 'systemic',
    preToPostResistanceRatio: 15,
    endPressureSpreadFraction: 0.17,
    baselineInterstitialPressureMmHg: -3,
    interstitialVolumeMl: 10500,
    baselineInterstitialProteinGDl: 3,
    kfScale: 1,
    lymphBaseFlowMlPerMin: 2,
    lymphCapacityMlPerMin: 40,
    defaultReflectionCoefficient: 1,
    defaultInflowPressure: 95,
    defaultOutflowPressure: 12,
    toleranceExcess: 0.3,
  },
  pulmonary: {
    label: 'pulmonary',
    // Low pressures throughout and a strongly NEGATIVE interstitial pressure that keeps the
    // alveoli dry. The lymphatic reserve is only about tenfold, and the tissue tolerates
    // almost nothing: a few hundred millilitres in the wrong place stops gas exchange.
    preToPostResistanceRatio: 1.5,
    endPressureSpreadFraction: 0.25,
    baselineInterstitialPressureMmHg: -8,
    interstitialVolumeMl: 500,
    baselineInterstitialProteinGDl: 4.6,
    kfScale: 0.0096,
    lymphBaseFlowMlPerMin: 0.2,
    // Only a fourfold acute reserve. Pulmonary oedema therefore appears once capillary pressure
    // approaches the plasma oncotic pressure — around 25 mmHg — which is exactly the clinical
    // threshold, and why left atrial pressure is the number that matters in heart failure.
    lymphCapacityMlPerMin: 0.8,
    defaultReflectionCoefficient: 0.9,
    defaultInflowPressure: 12,
    defaultOutflowPressure: 5,
    toleranceExcess: 0.08,
  },
  hepatic: {
    label: 'hepatic sinusoid',
    // Sinusoids are fenestrated and essentially freely permeable to protein, so sigma is near
    // zero and the oncotic gradient exerts almost nothing: filtration here is governed by
    // hydrostatic pressure alone. That is why portal hypertension produces ascites so readily,
    // why the ascitic fluid is protein-rich, and why albumin helps far less than intuition says.
    preToPostResistanceRatio: 0.5,
    endPressureSpreadFraction: 0.3,
    baselineInterstitialPressureMmHg: 0,
    interstitialVolumeMl: 800,
    baselineInterstitialProteinGDl: 6.5,
    kfScale: 0.0185,
    lymphBaseFlowMlPerMin: 1,
    // Barely a threefold reserve — the smallest of any bed, and the reason a portal pressure
    // gradient above about 12 mmHg produces ascites so reliably.
    lymphCapacityMlPerMin: 2.5,
    defaultReflectionCoefficient: 0.05,
    defaultInflowPressure: 10,
    defaultOutflowPressure: 5,
    toleranceExcess: 0.5,
  },
  glomerulus: {
    label: 'glomerulus',
    // The same four forces, arranged so filtration never reverses: sigma is 1, Bowman's space
    // is protein-free, capillary pressure is held high by the efferent arteriole, and Kf is
    // enormous. What a systemic capillary does at 2 mL/min, this does at 125 — and the
    // "lymphatic" return is simply the tubular fluid leaving down the nephron.
    preToPostResistanceRatio: 1,
    endPressureSpreadFraction: 0.02,
    baselineInterstitialPressureMmHg: 10,
    interstitialVolumeMl: 1000,
    baselineInterstitialProteinGDl: 0.02,
    kfScale: 1,
    lymphBaseFlowMlPerMin: 125,
    lymphCapacityMlPerMin: 400,
    defaultReflectionCoefficient: 1,
    defaultInflowPressure: 95,
    defaultOutflowPressure: 18,
    toleranceExcess: 0.3,
  },
};

export const CAPILLARY_SIMULATION = {
  MAX_DT_SECONDS: 0.05,
  RENDER_INTERVAL_MS: 33,
  HISTORY_CAPACITY: 260,
  /** One real second is half a simulated hour, so oedema that takes a day or two to build
   * appears over about a minute. */
  TIME_SCALE: 1800,
  /** Simulated seconds of settling applied before the first frame, so the module opens on
   * normal physiology instead of relaxing into it while the learner watches. Measured as
   * the time this module's opening transient takes to decay. */
  SETTLE_SECONDS: 10000,
};
