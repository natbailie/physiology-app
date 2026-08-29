export type InsultType = 'bacterial' | 'sterileCrystal' | 'foreignBody';

export type InflammationState_Classification =
  | 'quiescent'
  | 'acute inflammation'
  | 'acute inflammation (resolving)'
  | 'abscess formation'
  | 'chronic inflammation'
  | 'granulomatous inflammation'
  | 'smouldering under immunosuppression'
  | 'systemic inflammatory response';

export interface InflammationInputs {
  /** Size of the initiating insult, % of a severe challenge (0-100). */
  insultSeverityPct: number;
  /** What kind of thing is doing the damage — it decides whether clearance is even possible. */
  insultType: InsultType;
  /** Antibiotic efficacy, % of a maximal regimen (0-100). Kills bacteria; touches nothing else. */
  antibioticEfficacyPct: number;
  /** Corticosteroid dose, % of a high regimen (0-100). Blunts every arm — including resolution. */
  steroidDosePct: number;
  /** Innate immune function, % of normal (0-100) — neutrophil supply and killing power. */
  innateImmuneFunctionPct: number;
  /** Source control: drainage/debridement, % effect (0-100). Removes what drugs cannot reach. */
  sourceControlPct: number;
}

/** Internal state carried between ticks. Loads are relative units, not clinical counts. */
export interface InflammationInternalState {
  simTimeSeconds: number;
  /** The driving load itself — multiplying bacteria, dissolving crystal, sitting splinter. */
  insultLoad: number;
  /** Local chemical wave: histamine, bradykinin, prostaglandins. Fast in, faster out. */
  mediatorLevel: number;
  /** Recruited neutrophil population, relative (1 = a vigorous normal response). */
  neutrophilPopulation: number;
  /** Monocyte-derived macrophage activity, relative. Late, persistent, decisive. */
  monocyteMacrophageActivity: number;
  /** Dead neutrophils and debris — the stuff an abscess is made of. */
  pusBurden: number;
  /** Collateral tissue damage from enzymes, hypoxia and chronicity. */
  tissueDamage: number;
  /** How long the insult has persisted continuously, seconds — chronicity's clock. */
  persistenceSeconds: number;
  /** The mononuclear arm: macrophage-lymphocyte organisation that outlasts the acute wave. */
  chronicInflammationIndex: number;
  /** Organised granuloma burden — weeks in the making. */
  granulomaLoad: number;
  /** Systemic spillover: TNF/IL-1/IL-6 reaching the rest of the body. */
  systemicCytokineLevel: number;
  /** C-reactive protein, mg/L — a hepatic compartment lagging the cytokines. */
  crpMgL: number;
}

export interface InflammationDerived {
  // Local chemical wave.
  mediatorLevel: number;

  // Local cardinal signs.
  vasodilationIndex: number;
  permeabilityIndex: number;
  painProxyIndex: number;

  // The cells.
  neutrophilCount10e9PerL: number;
  neutrophilPopulation: number;
  monocyteMacrophageActivity: number;
  pusBurden: number;
  tissueDamage: number;

  // The long game.
  chronicInflammationIndex: number;
  granulomaLoad: number;

  // Systemic spillover.
  systemicCytokineLevel: number;
  crpMgL: number;
  coreTemperatureC: number;
  sirsActive: boolean;

  insultLoad: number;

  classification: InflammationState_Classification;
  patternSummary: string;

  // Passthroughs so tick() stays pure.
  insultSeverityPct: number;
  insultType: InsultType;
  antibioticEfficacyPct: number;
  steroidDosePct: number;
  innateImmuneFunctionPct: number;
  sourceControlPct: number;
}

export interface InflammationSnapshot {
  state: InflammationInternalState;
  derived: InflammationDerived;
}

export interface InflammationHistoryPoint {
  t: number;
  insultLoad: number;
  neutrophilCount10e9PerL: number;
  crpMgL: number;
  pusBurden: number;
}
