import { FIBRE_VELOCITIES_M_PER_S, GATE, LIMB_DISTANCE_M, LESION, PAIN } from './constants';
import { clamp } from '@/shared/lib/math';
import type { ModalityMap, SomaticInputs, SomaticState_Classification } from './types';

/** Latency for each fibre class over the standard test distance — first pain (Aδ) versus
 * second pain (C) is one of the oldest observations in physiology. */
export function latencyMs(velocityMPerS: number): number {
  return (LIMB_DISTANCE_M / velocityMPerS) * 1000;
}

export const FIRST_PAIN_LATENCY_MS = latencyMs(FIBRE_VELOCITIES_M_PER_S.AD_DELTA);
export const SECOND_PAIN_LATENCY_MS = latencyMs(FIBRE_VELOCITIES_M_PER_S.C);
export const TOUCH_LATENCY_MS = latencyMs(FIBRE_VELOCITIES_M_PER_S.AB);

/**
 * Differential conduction block. Local anaesthetics hit small myelinated fibres first,
 * then unmyelinated C fibres, then the thick Aβ touch fibres — so at partial doses pain is
 * gone while light touch survives, and never the other way round.
 */
export function applyBlock(drive: number, blockFraction: number, vulnerability: number): number {
  return drive * (1 - clamp(blockFraction, 0, 1) * vulnerability);
}

/**
 * The dorsal-horn gate. Opening is driven by nociceptive traffic; closing by Aβ input,
 * counterstimulus (rubbing), descending modulation and opioid action. Allodynia enters here:
 * when peripheral sensitisation has lowered C-terminal thresholds, Aβ traffic itself begins
 * to open the gate.
 */
export function gateOpenFraction(pattern: {
  abTraffic: number;
  adDeltaTraffic: number;
  cFibreTraffic: number;
  rubbing: number;
  descending: number;
  opioidBurst: number;
  allodynicDrive: number;
}): number {
  const opening =
    GATE.CFIBRE_OPENING_WEIGHT * pattern.cFibreTraffic +
    GATE.AD_OPENING_WEIGHT * pattern.adDeltaTraffic +
    pattern.allodynicDrive;
  const closing =
    GATE.AB_CLOSING_WEIGHT * pattern.abTraffic +
    GATE.RUBBING_CLOSING_WEIGHT * pattern.rubbing +
    GATE.DESCENDING_CLOSING_WEIGHT * pattern.descending +
    GATE.OPIOID_CLOSING_WEIGHT * pattern.opioidBurst;
  const net = (opening - closing - GATE.GATE_MIDPOINT) / GATE.GATE_STEEPNESS;
  // High when opening dominates, near zero at rest.
  return 1 / (1 + Math.exp(-net));
}

export function transmissionCellOutput(gateOpen: number, cTraffic: number, adTraffic: number, windupMultiplier: number): number {
  return gateOpen * (cTraffic + adTraffic) * windupMultiplier;
}

export function windupMultiplier(centralAmplification: number): number {
  return 1 + (PAIN.WINDUP_MAX_MULTIPLIER - 1) * clamp(centralAmplification, 0, 1);
}

/** Raw target may exceed the 0-10 scale in severe states; perception clamps on display. */
export function painRatingTarget(output: number): number {
  return Math.max(0, (output / PAIN.SCALE_MAX_TC_OUTPUT) * 10);
}

/**
 * Which modalities survive BELOW the lesion, per side.
 *
 * Dorsal columns run IPSILATERAL to cortex (decussating in the medulla), so a hemisection
 * takes touch/proprioception on its OWN side. The spinothalamic tract has already crossed
 * within a segment or two of entry, so pain/temperature are lost on the OPPOSITE side —
 * the dissociated loss that names Brown-Séquard. Anterior-quadrant damage takes both
 * spinothalamics while sparing the posterior columns; a syrinx takes pain/temperature
 * SEGMENTALLY where it crosses in front of the central canal, sparing everything else.
 */
export function modalityMap(inputs: SomaticInputs): ModalityMap {
  const sL = clamp(inputs.leftHemisectionSeverity, 0, 100);
  const sR = clamp(inputs.rightHemisectionSeverity, 0, 100);
  const ant = clamp(inputs.anteriorQuadrantSeverity, 0, 100);
  const syrinx = clamp(inputs.centralCanalSeverity, 0, 100);

  return {
    // Ipsilateral dorsal columns.
    touchLeftPct: 100 - sL,
    touchRightPct: 100 - sR,
    proprioceptionLeftPct: 100 - sL,
    proprioceptionRightPct: 100 - sR,
    // Contralateral spinothalamics, plus bilateral anterior-quadrant involvement.
    painTempLeftPct: 100 - Math.max(sR, ant),
    painTempRightPct: 100 - Math.max(sL, ant),
    // Segmental dissociation at the level of the syrinx itself.
    segmentalPainTempPct: 100 - syrinx,
  };
}

export function classifySomatic(pattern: {
  sL: number;
  sR: number;
  ant: number;
  central: number;
  block: number;
  allodyniaActive: boolean;
  nociceptiveDrive: number;
}): SomaticState_Classification {
  if (pattern.sL >= LESION.COMPLETE_THRESHOLD && pattern.sR >= LESION.COMPLETE_THRESHOLD)
    return 'complete transection';
  if (Math.max(pattern.sL, pattern.sR) >= LESION.SIGNIFICANT_THRESHOLD && pattern.ant < LESION.SIGNIFICANT_THRESHOLD)
    return 'Brown-Séquard: hemicord syndrome';
  if (pattern.ant >= LESION.SIGNIFICANT_THRESHOLD && Math.max(pattern.sL, pattern.sR) < LESION.SIGNIFICANT_THRESHOLD)
    return 'anterior cord syndrome';
  if (pattern.central >= LESION.SIGNIFICANT_THRESHOLD) return 'syringomyelia: segmental dissociation';
  if (pattern.allodyniaActive) return 'neuropathic: allodynia and wind-up';
  if (pattern.block >= 55) return 'local anaesthetic block';
  if (pattern.nociceptiveDrive > 25) return 'acute nociceptive pain';
  return 'normal sensation';
}

export function patternSummary(pattern: {
  classification: SomaticState_Classification;
  map: ModalityMap;
  painScore: number;
  gateOpen: number;
}): string {
  switch (pattern.classification) {
    case 'normal sensation':
      return `gate ${Math.round(pattern.gateOpen * 100)}% open, all modalities intact bilaterally`;
    case 'acute nociceptive pain':
      return `${pattern.painScore.toFixed(1)}/10 from peripheral nociceptors — treatable at the gate`;
    case 'neuropathic: allodynia and wind-up':
      return 'touch now opens the sensitised gate: pain from stimuli that should be silent';
    case 'Brown-Séquard: hemicord syndrome':
      return `ipsilateral touch/proprioception lost (${pattern.map.touchLeftPct.toFixed(0)}/${pattern.map.touchRightPct.toFixed(0)}%) with CONTRALATERAL pain/temp loss (${pattern.map.painTempLeftPct.toFixed(0)}/${pattern.map.painTempRightPct.toFixed(0)}%) — dissociated by decussation`;
    case 'anterior cord syndrome':
      return `both spinothalamics gone (${pattern.map.painTempLeftPct.toFixed(0)}/${pattern.map.painTempRightPct.toFixed(0)}%) while dorsal columns survive — the corticospinal tracts travel with them`;
    case 'syringomyelia: segmental dissociation':
      return `pain/temp lost segmentally (${pattern.map.segmentalPainTempPct.toFixed(0)}% preserved) as fibres cross in front of the dilated canal; columns spared`;
    case 'complete transection':
      return 'nothing crosses the lesion: all modalities lost bilaterally below it';
    case 'local anaesthetic block':
      return 'small myelinated fibres blocked first — pain abolished before touch';
  }
}
