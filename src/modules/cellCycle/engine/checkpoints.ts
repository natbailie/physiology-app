import { CHECKPOINT, PHASE } from './constants';
import { clamp } from '@/shared/lib/math';
import type { ArrestCause, CellCycleInputs, CellPhase } from './types';

export function phaseDurationH(phase: CellPhase): number {
  switch (phase) {
    case 'G1':
      return PHASE.G1_H;
    case 'S':
      return PHASE.S_H;
    case 'G2':
      return PHASE.G2_H;
    case 'M':
      return PHASE.M_H;
  }
}

/**
 * Cyclin D drive at the restriction point, %.
 *
 * Growth factors push it up; constitutive oncogenic signals (MYC-class) hold it high
 * WITHOUT any growth factor — which is the definition of transformation. RB loss makes the
 * readout moot: E2F is de-repressed whatever cyclin D says.
 */
export function cyclinDDrivePct(inputs: CellCycleInputs): number {
  const combined = clamp(inputs.growthFactorDrive + inputs.oncogeneDrive * 0.9, 0, CHECKPOINT.DRIVE_SATURATION);
  return (combined / CHECKPOINT.DRIVE_SATURATION) * 100;
}

/** Active p53 signal given functional capacity and present lesion load. */
export function p53ActivityPct(lesionLoad: number, p53Function: number): number {
  const activation = clamp((lesionLoad - CHECKPOINT.DAMAGE_ARREST_THRESHOLD * 0.5) / CHECKPOINT.DAMAGE_ARREST_THRESHOLD, 0, 1);
  return clamp(activation * clamp(p53Function, 0, 1), 0, 1) * 100;
}

/** Effective G1 duration under current regulation, hours. Strong oncogene drive shortens it. */
export function g1DurationH(inputs: CellCycleInputs): number {
  const shortening = 1 - 0.45 * clamp(inputs.oncogeneDrive, 0, 1);
  return PHASE.G1_H * clamp(shortening, 0.4, 1);
}

/**
 * What is holding cells where they are right now, in checkpoint priority order.
 *
 * The order matters clinically: a taxane-arrested mitotic cell cannot also be "in G2
 * arrest" — the spindle assembly checkpoint is where it actually sits. DNA damage arrests
 * at BOTH G1/S and G2/M when p53 works; when p53 does not, neither fires and damaged cells
 * proceed to replicate — the molecular beginning of genomic instability.
 */
export function determineArrest(
  phase: CellPhase,
  inputs: CellCycleInputs,
  lesionLoad: number,
): ArrestCause {
  const damageArrests = lesionLoad > CHECKPOINT.DAMAGE_ARREST_THRESHOLD && inputs.p53Function > 0.15;

  if (phase === 'M' && inputs.spindlePoisonPct > 20) return 'M phase — spindle assembly checkpoint';

  if (phase === 'G1') {
    if (inputs.cdk46InhibitionPct > 25) return 'G1/S checkpoint — CDK4/6 inhibited';
    if (damageArrests) return 'G1/S checkpoint — DNA damage (p53)';
    // Quiescence needs an intact brake: an RB-null cell never exits into G0, however
    // starved — it simply keeps entering S without permission.
    if (cyclinDDrivePct(inputs) < 15 && inputs.rbFunction > 0.15) return 'quiescence (no growth signal)';
    return 'none';
  }

  if (phase === 'S' && inputs.replicationBlockPct > 20) return 'S phase — replication blocked';

  if (phase === 'G2') {
    if (damageArrests) return 'G2/M checkpoint — DNA damage (p53)';
    return 'none';
  }

  return 'none';
}

/** Whether the current arrest permits apoptosis as its resolution (p53-mediated pathways). */
export function apoptosisPressurePct(arrestCause: ArrestCause, lesionLoad: number, p53Function: number): number {
  if (!arrestCause.startsWith('G1/S') && !arrestCause.startsWith('G2/M')) return 0;
  if (lesionLoad < CHECKPOINT.APOPTOSIS_THRESHOLD) return 0;
  return clamp(p53Function, 0, 1) * 100;
}
