/** Calibrated so the fetus sits at a pre-ductal saturation of roughly 65% with almost no
 * pulmonary blood flow, and a successfully transitioned newborn reaches the mid-90s with the
 * duct and foramen shut. */

export const PULMONARY = {
  /** Pulmonary vascular resistance in utero, as a multiple of the mature value. Fluid-filled,
   * hypoxic lungs are a near-closed circuit. */
  FETAL_PVR: 12,
  MATURE_PVR: 0.35,
  /** How much of the fall is driven by mechanical aeration versus by oxygen. Both matter, and
   * a lung that is inflated but hypoxic stays constricted — which is the trap in PPHN. */
  INFLATION_SHARE: 0.55,
  OXYGEN_SHARE: 0.45,
  /** FiO2 at which the oxygen-driven component is fully recruited, GIVEN an aerated lung. Note
   * this sits barely above room air on purpose: a healthy newborn transitions breathing air, so
   * the trigger is the rise in achieved oxygenation from the fetal state, not supplemental O2. */
  OXYGEN_FULL_EFFECT_FIO2: 0.3,
  OXYGEN_ROOM_AIR_EFFECT: 0.88,
  TAU_SECONDS: 25,
} as const;

export const SYSTEMIC = {
  /** Systemic resistance with no placenta attached. */
  BASE_SVR: 1,
  /** Fraction by which an intact placental circulation lowers systemic resistance. The placenta
   * receives a large share of combined ventricular output at very low resistance, which is why
   * clamping the cord raises systemic resistance abruptly — half of the transition, and the half
   * that is usually forgotten. */
  PLACENTAL_CONDUCTANCE_SHARE: 0.45,
} as const;

export const DUCTUS = {
  /** Resistance of the ductus arteriosus when fully patent, relative to the pulmonary bed. */
  PATENT_RESISTANCE: 0.35,
  /** The ductal muscle senses the oxygen tension of the blood flowing THROUGH it, which is
   * post-ductal. Saturation below this leaves it open; above the upper anchor it constricts.
   * Using local rather than alveolar oxygen is what keeps the duct open in a hypoxaemic baby —
   * the situation in which it is most needed, and most dangerous. */
  OXYGEN_CONSTRICTION_SAT_LOW: 78,
  OXYGEN_CONSTRICTION_SAT_HIGH: 90,
  /** Prostaglandin level (%) that fully opposes oxygen-driven closure. */
  PROSTAGLANDIN_HOLD: 45,
  CLOSURE_TAU_SECONDS: 260,
  REOPENING_TAU_SECONDS: 120,
} as const;

export const FORAMEN = {
  /** Left atrial pressure rises with pulmonary venous return; the flap shuts as soon as it
   * exceeds right atrial pressure. Functional closure is immediate — anatomical closure takes
   * months, which is why a probe-patent foramen persists in a quarter of adults. */
  CLOSURE_TAU_SECONDS: 12,
  REOPENING_TAU_SECONDS: 30,
} as const;

export const VENOSUS = {
  CLOSURE_TAU_SECONDS: 200,
} as const;

export const SATURATION = {
  /** Umbilical venous blood: the most oxygenated blood the fetus has, and still only ~80%. */
  UMBILICAL_VEIN: 80,
  /** Systemic venous return — the blood the shunts carry. In the fetus it is partly oxygenated
   * already, because the placenta returns via the inferior vena cava, which is why the fetal
   * pre/post-ductal gap is modest rather than dramatic. */
  SYSTEMIC_VENOUS: 40,
  PLACENTAL_VENOUS_LIFT: 0.35,
  /** Fully aerated lung at room air. */
  ALVEOLAR_ROOM_AIR: 97,
  /** A fluid-filled lung oxygenates nothing; blood leaves it as it arrived. */
  ATELECTATIC: 42,
} as const;

export const ATRIA = {
  /** Right atrial pressure with a full placental return through the ductus venosus, mmHg. */
  FETAL_RA_MMHG: 5,
  BASE_RA_MMHG: 2.5,
  /** Left atrial pressure once the lungs are carrying full flow. */
  MATURE_LA_MMHG: 6.5,
  FETAL_LA_MMHG: 2,
} as const;

export const CLASSIFICATION = {
  /** Saturation gap above which differential cyanosis is clinically apparent. */
  DIFFERENTIAL_GAP_PERCENT: 8,
  /** Ductal shunt fraction above which the duct is judged haemodynamically significant. */
  SIGNIFICANT_SHUNT: 0.12,
  TRANSITIONED_PVR: 2.5,
} as const;

export const FETAL_SIMULATION = {
  MAX_DT_SECONDS: 0.2,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 600,
  /** Minutes of physiology per second of watching — ductal closure takes hours in life. */
  TIME_SCALE: 30,
} as const;
