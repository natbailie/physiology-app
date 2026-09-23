/**
 * Fuel selection along the fed-fasting-starved axis, and the energy cost of catabolic stress.
 *
 * The whole module is one axis: how long since the last meal, and how well insulin can still move
 * fuel. Just fed, the body burns carbohydrate; through the post-absorptive phase it lives off
 * glycogen; in fasting and starvation glucagon flips the mix toward fat and then ketones; and a
 * catabolic stress (trauma, sepsis, an ITU stay) raises the energy bill and burns protein whatever
 * the fuel mix says. Every derived value answers from that single story.
 */
export interface MetabolismInputs {
  /** Hours since the last meal (0-72). Drives the fed -> post-absorptive -> fasting -> starved
   * transition and, with it, the whole fuel mix and the ketone level. */
  hoursPostAbsorptive: number;
  /** Relative insulin-resistance, 1 = a fully sensitive (fed, healthy) state. Healthy tissue and
   * type-2 muscle/liver behave differently; a resistant whole body cannot move glucose in. */
  insulinResistance: number;
  /** Catabolic stress, 0-1: the catecholamine + cortisol response to trauma, sepsis or an injury.
   * Raises the energy bill and drives gluconeogenesis and protein breakdown. */
  injuryStress: number;
  /** Whole-body resting energy, kcal/day. The thyroid and muscle mass set it; the energy module
   * multiplies it by stress and activity. */
  basalMetabolicRate: number;
  /** Physical activity in METs, 1-5. Multiplies the energy bill on top of the resting rate. */
  activityMet: number;
  /** Dietary carbohydrate supply, g/day, for the fed-state fuel mix. */
  carbohydrateIntake: number;
  /** Dietary fat supply, g/day. */
  fatIntake: number;
  /** Dietary protein supply, g/day. */
  proteinIntake: number;
}

export interface MetabolismInternalState {
  simTimeSeconds: number;
  /** Smoothly tracked values so the readouts move like instruments, not teleports. */
  bgmmolPerL: number;
  energyKcalPerDay: number;
  ketonesMmolPerL: number;
  glycogenPct: number;
  proteinOxidationGPerDay: number;
}

export interface MetabolismDerived {
  /** Blood glucose, mmol/L. */
  bgmmolPerL: number;
  /** Relative circulating insulin, 0-1. Drops as glucose falls post-absorptively. */
  insulinSignal: number;
  /** Relative glucagon, 0-1. Rises in fasting and starvation. */
  glucagonSignal: number;
  /** % of energy coming from carbohydrate oxidation. */
  carbOxidationPct: number;
  /** % of energy coming from fat oxidation. */
  fatOxidationPct: number;
  /** % of energy coming from protein oxidation (sarcopenia / catabolic stress). */
  proteinOxidationPct: number;
  /** Absolute energy expenditure, kcal/day. */
  energyKcalPerDay: number;
  /** Beta-hydroxybutyrate equivalent, mmol/L. */
  ketonesMmolPerL: number;
  /** Liver + muscle glycogen remaining, %. */
  glycogenPct: number;
  /** Protein breakdown, g/day — the visible cost of starvation and catabolic stress. */
  proteinOxidationGPerDay: number;
  /** Respiration quotient shelter: the CO2 a fuel mix produces per O2 consumed. */
  respiratoryQuotient: number;
  /** Classification drawn under the fuel gauge. */
  metabolicState: string;
  // Passthrough so tick() stays a pure (state, derived, dt) function.
  hoursPostAbsorptive: number;
  insulinResistance: number;
  injuryStress: number;
  basalMetabolicRate: number;
  activityMet: number;
}

export interface MetabolismSnapshot {
  state: MetabolismInternalState;
  derived: MetabolismDerived;
}

export interface MetabolismHistoryPoint {
  t: number;
  bg: number;
  ketones: number;
  energy: number;
}