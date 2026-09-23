export interface ToxicologyInputs {
  /** Ingredient in milligrams per kilogram of paracetamol. */
  doseMgKg: number;
  /** Hours since the tablets were swallowed. */
  hoursSinceIngestion: number;
  /** Percent of the load sequestered by activated charcoal (0-50). */
  charcoalDosePct: number;
  /** Hour after ingestion at which N-acetylcysteine is (or was) started. */
  nacStartHours: number;
}

export interface ToxicologyInternalState {
  simTimeSeconds: number;
  /** Circulating paracetamol, mg/L, before any NAC. */
  plasmaMgL: number;
}

export interface ToxicologyDerived {
  /** The presented hour this reading is taken at. */
  hoursSinceIngestion: number;
  /** Circulating paracetamol at the presented time, in mg/L. */
  plasmaMgL: number;
  /** The nomogram line the plasma should be compared with at this hour. 100 at 4h, 15 at 24h. */
  nomogramLineMgL: number;
  /** Plasma divided by the nomogram line — >1 means above the treatment line. */
  nomogramRatio: number;
  /** The absorbed dose after charcoal has sequestered its share, in mg/kg. */
  absorbedDoseMgPerKg: number;
  /** How much of the load charcoal has taken up, in percent. */
  charcoalReductionPct: number;
  /** Whether NAC has actually started yet and, in hours, how close to the 8h window it began. */
  nacStarted: boolean;
  nacProtection: number;
  /** Hours of the eight-hour protection window still unused at presentation. */
  antidoteWindowHours: number;
  /** Combined hepatotoxic risk of the presentation, given dose, time and NAC. */
  hepatotoxicityRisk: number;
  state: string;
}

export interface ToxicologySnapshot {
  state: ToxicologyInternalState;
  derived: ToxicologyDerived;
}

export interface ToxicologyHistoryPoint {
  t: number;
  plasma: number;
  risk: number;
}