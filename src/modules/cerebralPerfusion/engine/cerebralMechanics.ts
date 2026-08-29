import { BBB, CLASSIFICATION, CRANIUM, CSF, CUSHING, FLOW, VESSEL } from './constants';
import { clamp, scaleClamped } from '@/shared/lib/math';
import type { CerebralState_Classification } from './types';

/**
 * Intracranial pressure implied by the current contents.
 *
 * The Monro-Kellie doctrine in one line: the skull is a fixed box holding brain, blood and CSF,
 * so anything added must displace something. CSF and venous blood leave first, and while they
 * can, pressure barely moves. Once that reserve is spent, pressure rises EXPONENTIALLY — which
 * is why a patient can accommodate a large slow tumour and then deteriorate over hours, and why
 * the last few millilitres of a haematoma matter far more than the first fifty.
 */
export function intracranialPressure(totalExcessMl: number): number {
  const beyondReserve = Math.max(0, totalExcessMl - CRANIUM.COMPENSATORY_RESERVE_ML);
  return Math.min(
    CRANIUM.MAX_ICP_MMHG,
    CRANIUM.BASELINE_ICP_MMHG * Math.exp(CRANIUM.ELASTANCE_PER_ML * beyondReserve),
  );
}

/** Slope of that curve at the current point — how much pressure one more millilitre buys. */
export function elastance(totalExcessMl: number): number {
  return intracranialPressure(totalExcessMl) * CRANIUM.ELASTANCE_PER_ML *
    (totalExcessMl > CRANIUM.COMPENSATORY_RESERVE_ML ? 1 : 0.02);
}

/** Cerebral perfusion pressure — what actually drives blood through the brain. The pressure
 * downstream is whichever is higher, the intracranial pressure or the venous outflow pressure,
 * because a vessel is compressed by whatever surrounds it. */
export function cerebralPerfusionPressure(
  meanArterialPressureMmHg: number,
  icpMmHg: number,
  venousOutflowMmHg: number,
): number {
  return meanArterialPressureMmHg - Math.max(icpMmHg, venousOutflowMmHg);
}

/**
 * Arteriolar calibre the vessels are heading toward.
 *
 * CO2 is the dominant term and acts within a minute, which is why hyperventilation is the
 * fastest lever on intracranial pressure — and why it is temporising rather than treatment,
 * since constricting the vessels also reduces flow.
 *
 * The autoregulatory term is the subtle one. A falling perfusion pressure dilates vessels to
 * protect flow, but dilated vessels hold MORE blood, and more blood in a full skull raises
 * pressure, which lowers perfusion pressure further. That is the vasodilatory cascade, and it
 * is why perfusion pressure is defended directly rather than left to look after itself.
 */
export function vesselCalibreTarget(
  paCO2MmHg: number,
  paO2MmHg: number,
  cppMmHg: number,
  autoregulationIntegrity: number,
): number {
  const co2Term = (clamp(paCO2MmHg, 15, 80) - VESSEL.CO2_REFERENCE_MMHG) * VESSEL.CO2_GAIN_PER_MMHG;
  const hypoxicTerm = Math.max(0, VESSEL.HYPOXIC_THRESHOLD_MMHG - clamp(paO2MmHg, 20, 150)) * VESSEL.HYPOXIC_GAIN;
  const autoregulatoryTerm =
    Math.max(0, FLOW.AUTOREGULATION_LOWER_CPP + 30 - cppMmHg) *
    VESSEL.AUTOREGULATORY_GAIN *
    clamp(autoregulationIntegrity, 0, 1);

  return clamp(1 + co2Term + hypoxicTerm + autoregulatoryTerm, VESSEL.MIN_CALIBRE, VESSEL.MAX_CALIBRE);
}

/** Cerebral blood volume, mL. Wider vessels hold more blood — the link that makes vasodilatation
 * a pressure problem inside a fixed box. */
export function cerebralBloodVolume(calibre: number): number {
  return VESSEL.BASELINE_BLOOD_VOLUME_ML * clamp(calibre, VESSEL.MIN_CALIBRE, VESSEL.MAX_CALIBRE);
}

/**
 * Cerebral blood flow, mL per 100 g per minute.
 *
 * With autoregulation intact, flow is held near constant across a wide band of perfusion
 * pressures. Abolish it and flow follows pressure passively — so the same blood pressure that
 * was harmless becomes ischaemia at one end and hyperaemia at the other.
 */
export function cerebralBloodFlow(cppMmHg: number, calibre: number, autoregulationIntegrity: number): number {
  const passive = FLOW.BASELINE_CBF * (cppMmHg / 80);
  const plateau =
    FLOW.BASELINE_CBF *
    scaleClamped(cppMmHg, FLOW.AUTOREGULATION_LOWER_CPP - 25, FLOW.AUTOREGULATION_LOWER_CPP, 0, 1) *
    (1 - scaleClamped(cppMmHg, FLOW.AUTOREGULATION_UPPER_CPP, FLOW.AUTOREGULATION_UPPER_CPP + 60, 0, 0.45));

  const integrity = clamp(autoregulationIntegrity, 0, 1);
  const regulated = plateau * integrity + passive * (1 - integrity);
  // Calibre still modulates flow: CO2 changes flow as well as volume.
  return Math.max(0, regulated * (0.55 + 0.45 * clamp(calibre, VESSEL.MIN_CALIBRE, VESSEL.MAX_CALIBRE)));
}

/** Net CSF accumulation, mL per minute. Absorption needs a pressure gradient against the venous
 * sinus, which is why a raised venous pressure alone produces hydrocephalus. */
export function csfNetAccumulation(
  productionRate: number,
  absorptionCapacity: number,
  icpMmHg: number,
  venousOutflowMmHg: number,
): number {
  const production = CSF.PRODUCTION_ML_PER_MIN * clamp(productionRate, 0, 2.5);
  const gradient = Math.max(0, icpMmHg - venousOutflowMmHg);
  const absorption = gradient * CSF.ABSORPTION_PER_MMHG * clamp(absorptionCapacity, 0, 1.5);
  return production - absorption;
}

/** The Cushing response: a brainstem attempt to restore perfusion by raising arterial pressure,
 * with the bradycardia that follows from baroreceptor stretch. Hypertension WITH bradycardia is
 * the combination that should never be dismissed. */
export function cushingResponse(cppMmHg: number): { active: boolean; heartRateBpm: number } {
  const severity = scaleClamped(cppMmHg, CUSHING.TRIGGER_CPP_MMHG, 15, 0, 1);
  return {
    active: severity > 0.15,
    heartRateBpm:
      CUSHING.BASELINE_HEART_RATE_BPM -
      (CUSHING.BASELINE_HEART_RATE_BPM - CUSHING.MIN_HEART_RATE_BPM) * severity,
  };
}

export function classify(
  icpMmHg: number,
  cppMmHg: number,
  cbf: number,
  reserveMl: number,
): CerebralState_Classification {
  if (icpMmHg >= CLASSIFICATION.CRITICAL_ICP_MMHG || cppMmHg < 30) return 'critically raised ICP';
  if (cbf < FLOW.ISCHAEMIC_THRESHOLD || cppMmHg < CLASSIFICATION.LOW_CPP_MMHG) return 'hypoperfused';
  if (cbf > FLOW.HYPERAEMIC_THRESHOLD) return 'hyperaemic';
  if (icpMmHg >= CLASSIFICATION.RAISED_ICP_MMHG) return 'compliance exhausted';
  if (reserveMl < CLASSIFICATION.LOW_RESERVE_ML) return 'compensated';
  return 'normal';
}

export function patternSummary(icpMmHg: number, cppMmHg: number, reserveMl: number, autoregulating: boolean): string {
  const pressure = icpMmHg >= CLASSIFICATION.RAISED_ICP_MMHG ? 'ICP raised' : 'ICP normal';
  const reserve =
    reserveMl < CLASSIFICATION.LOW_RESERVE_ML ? 'no reserve left' : `${reserveMl.toFixed(0)} mL reserve`;
  const perfusion = cppMmHg < CLASSIFICATION.LOW_CPP_MMHG ? 'perfusion inadequate' : 'perfusion adequate';
  return `${pressure}, ${reserve}, ${perfusion}, ${autoregulating ? 'autoregulating' : 'pressure-passive'}`;
}

/** Vasogenic oedema leak rate through a disrupted blood-brain barrier, mL per minute.
 * Proportional to permeability above the normal threshold (100%) and to the hydrostatic
 * gradient across the capillary wall. At normal permeability (100%) the barrier holds and
 * leak is negligible; at 200% (severe disruption) the rate reaches MAX_LEAK_RATE. */
export function bbbLeakRateMlPerMin(permPct: number): number {
  const excess = Math.max(0, permPct - BBB.LEAK_THRESHOLD_PCT);
  const maxExcess = 200 - BBB.LEAK_THRESHOLD_PCT;
  return BBB.MAX_LEAK_RATE_ML_PER_MIN * clamp(excess / maxExcess, 0, 1);
}
