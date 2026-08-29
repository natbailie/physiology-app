export type CerebralState_Classification =
  | 'normal'
  | 'compensated'
  | 'compliance exhausted'
  | 'critically raised ICP'
  | 'hypoperfused'
  | 'hyperaemic';

export interface CerebralInputs {
  /** Mean arterial pressure, mmHg (40-170). */
  meanArterialPressureMmHg: number;
  /** Volume of an added intracranial mass — haematoma, tumour, oedema — in mL (0-150). */
  massVolumeMl: number;
  /** Arterial CO2, mmHg (15-80). The most powerful cerebral vasodilator there is, which is why
   * hyperventilation lowers intracranial pressure within minutes. */
  paCO2MmHg: number;
  /** Arterial O2, mmHg (25-150). Vasodilates only once it falls below roughly 50. */
  paO2MmHg: number;
  /** CSF production, multiple of normal (0-2.5). */
  csfProductionRate: number;
  /** CSF absorption capacity at the arachnoid granulations, fraction of normal (0-1.5). Low
   * models communicating hydrocephalus. */
  csfAbsorptionCapacity: number;
  /** Integrity of cerebral autoregulation, fraction (0-1). Injury abolishes it, and flow then
   * follows pressure passively. */
  autoregulationIntegrity: number;
  /** Cerebral venous outflow pressure, mmHg (0-25). Raised by jugular obstruction, a tight
   * collar, or head-down positioning. */
  venousOutflowPressureMmHg: number;
  /** Blood-brain barrier permeability, % of normal (0 = impermeable, 100 = normal,
   * >100 = disrupted). Raised by trauma, tumour, inflammation or hypertensive crisis. */
  bbbPermeabilityPct: number;
}

export interface CerebralInternalState {
  simTimeSeconds: number;
  /** Intracranial pressure, mmHg — relaxes toward the pressure the current contents imply. */
  intracranialPressureMmHg: number;
  /** CSF volume above baseline, mL. Accumulates when production outruns absorption. */
  csfExcessMl: number;
  /** Volume removed from the box by an external drain, mL. Distinct from CSF displacement,
   * which the compensatory reserve already accounts for — a drain takes volume OUT. */
  drainedVolumeMl: number;
  /** Smoothed arteriolar calibre, 1 = normal. Carries the vasodilatory response to CO2 and to
   * a falling perfusion pressure. */
  vesselCalibre: number;
  /** Vasogenic oedema: fluid extravasated through a disrupted BBB, mL. Accumulates over hours
   * and contributes directly to the mass effect inside the skull. */
  vasogenicOedemaMl: number;
}

export interface CerebralDerived {
  intracranialPressureMmHg: number;
  cerebralPerfusionPressureMmHg: number;
  cerebralBloodFlow: number;
  cerebralBloodVolumeMl: number;
  csfExcessMl: number;
  /** Total volume added to a box that cannot expand. */
  totalExcessVolumeMl: number;
  /** How much of the compensatory reserve — CSF and venous blood that can be displaced — is
   * left. Zero is the knee of the pressure-volume curve. */
  compensatoryReserveMl: number;
  vesselCalibre: number;
  /** Change in ICP per mL added at the current point on the curve. Small when compensating,
   * enormous once it is exhausted. */
  elastanceMmHgPerMl: number;
  autoregulating: boolean;
  /** Systemic response to a critically low perfusion pressure: hypertension with bradycardia. */
  cushingResponseActive: boolean;
  reflexHeartRateBpm: number;
  herniationRisk: number;
  classification: CerebralState_Classification;
  patternSummary: string;
  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  meanArterialPressureMmHg: number;
  massVolumeMl: number;
  paCO2MmHg: number;
  paO2MmHg: number;
  csfProductionRate: number;
  csfAbsorptionCapacity: number;
  autoregulationIntegrity: number;
  venousOutflowPressureMmHg: number;
  bbbPermeabilityPct: number;
  vasogenicOedemaMl: number;
}

export interface CerebralSnapshot {
  state: CerebralInternalState;
  derived: CerebralDerived;
}

export interface CerebralHistoryPoint {
  t: number;
  icp: number;
  cpp: number;
  cbf: number;
  cbv: number;
}
