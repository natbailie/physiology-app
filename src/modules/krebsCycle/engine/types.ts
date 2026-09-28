/**
 * Mitochondrial tricarboxylic-acid flux: acetyl-CoA (from pyruvate via PDH, from fatty acids
 * via beta-oxidation) condenses with oxaloacetate and turns the eight-step cycle, reducing
 * NAD+ and FAD and releasing CO2 for the electron-transport chain to cash in as ATP.
 *
 * The whole module is one throughput: substrate offered, oxygen to accept the electrons, ADP
 * and calcium demanding the turnover, and thiamine plus PDH gating the carbohydrate door.
 * When the chain can take electrons as fast as the cycle makes them, flux follows demand and
 * lactate stays flat; when oxygen, cofactors or the PDH gate choke, pyruvate spills to
 * lactate and the cycle stalls while the demand is still shouting.
 */
export interface KrebsCycleInputs {
  /** Carbohydrate supply as pyruvate availability, 0-100: meals, glycogen, gluconeogenesis. */
  glucoseSupplyPct: number;
  /** Fatty-acid supply via beta-oxidation, 0-100: fasting, ketogenic intake, adipose release. */
  fattyAcidSupplyPct: number;
  /** Oxygen available to the electron-transport chain, %: altitude, anaemia, perfusion. */
  oxygenPct: number;
  /** ATP demand in METs, 1-8: rest through hard exercise, the ADP/Ca2+ drive on the cycle. */
  atpDemandMet: number;
  /** Thiamine (B1) status, %: cofactor for PDH and alpha-ketoglutarate dehydrogenase. */
  thiaminePct: number;
  /** Pyruvate dehydrogenase activity, 0-1: intact near 1, inherited defect or inhibition low. */
  pdhActivity: number;
}

export interface KrebsCycleInternalState {
  simTimeSeconds: number;
  /** Smoothed values so the readouts move like instruments, not teleports. */
  tcaFlux: number;
  lactateMmolL: number;
  atpYield: number;
}

export interface KrebsCycleDerived {
  /** Pyruvate -> acetyl-CoA flux through PDH, normalised so baseline is 1. */
  pdhFlux: number;
  /** Fatty-acid -> acetyl-CoA flux through beta-oxidation, baseline 1. */
  fatFlux: number;
  /** Combined acetyl-CoA presented to citrate synthase, baseline 2. */
  acetylCoA: number;
  /** Turns of the cycle per unit time, baseline 1 — the central throughput. */
  tcaFlux: number;
  /** NADH production rate, baseline 4 (three per turn plus one at PDH). */
  nadhRate: number;
  /** FADH2 production rate, baseline 1. */
  fadh2Rate: number;
  /** ATP synthesis rate from the reducing equivalents plus substrate-level GTP. */
  atpYield: number;
  /** CO2 exhaled, mL/min — the carbon the turns release. */
  co2mLPerMin: number;
  /** O2 consumed, mL/min — the electrons the chain accepts. */
  o2mLPerMin: number;
  /** Plasma lactate, mmol/L — pyruvate that missed the PDH gate. */
  lactateMmolL: number;
  /** Respiratory quotient, CO2 per O2: 1.0 pure carbohydrate, 0.7 pure fat. */
  rqProxy: number;
  /** Classification drawn under the cycle diagram. */
  krebsState: string;
}

export interface KrebsCycleSnapshot {
  state: KrebsCycleInternalState;
  derived: KrebsCycleDerived;
}

export interface KrebsCycleHistoryPoint {
  t: number;
  lactate: number;
  atp: number;
  co2: number;
}
