import { ADAPTIVE, ANTIGEN_PRESENTATION, EFFECTOR, HUMORAL, MEMORY } from './constants';
import { clamp } from '@/shared/lib/math';
import type { ImmuneInputs, PathogenType } from './types';

/** Net immune competence after pharmacological suppression, 0..1. */
export function suppressionFactor(immunosuppression: number): number {
  return clamp(1 - immunosuppression / 100, 0, 1);
}

/**
 * Target antigen presentation, 0..1. Dendritic cells sample antigen at the infection site and
 * traffic to a draining lymph node — the step that makes a primary response slow.
 */
export function antigenPresentationTarget(pathogenLoad: number, vaccineAntigen: number, suppression: number): number {
  // A vaccine supplies antigen without a replicating organism, so it primes this step exactly
  // as an infection would — which is the entire principle of immunisation.
  const antigen = Math.max(pathogenLoad, vaccineAntigen);
  return clamp(antigen * ANTIGEN_PRESENTATION.GAIN * suppression, 0, 1);
}

/**
 * Target helper T cell activity, 0..1 — the coordinating hub of adaptive immunity.
 *
 * Everything downstream depends on it: cytotoxic T cells need its licence, and B cells need
 * its second signal to switch class. That single dependency is why CD4 depletion in HIV
 * disables the cellular AND humoral arms simultaneously, rather than just one of them.
 */
export function helperTTarget(antigenPresentation: number, helperTCellCount: number, suppression: number, memoryLevel = 0): number {
  const recall = 1 + clamp(memoryLevel, 0, 1) * ADAPTIVE.MEMORY_AMPLIFICATION;
  return clamp(antigenPresentation * ADAPTIVE.HELPER_GAIN * clamp(helperTCellCount, 0, 1.5) * suppression * recall, 0, 1);
}

/** Target cytotoxic T cell activity, 0..1 — licensed by helper T cells. */
export function cytotoxicTTarget(helperTActivity: number, suppression: number): number {
  return clamp(helperTActivity * ADAPTIVE.CYTOTOXIC_GAIN * suppression, 0, 1);
}

/** Target B cell activity, 0..1 — needs both antigen and helper T cell support. */
export function bCellTarget(
  antigenPresentation: number,
  helperTActivity: number,
  bCellFunction: number,
  suppression: number,
  memoryLevel = 0,
): number {
  // The helper signal is required, not merely helpful: without it B cells make little and
  // cannot class switch at all.
  const helperSupport = 0.2 + helperTActivity * 0.8;
  const recall = 1 + clamp(memoryLevel, 0, 1) * ADAPTIVE.MEMORY_AMPLIFICATION;
  return clamp(
    antigenPresentation * helperSupport * ADAPTIVE.B_CELL_GAIN * clamp(bCellFunction, 0, 1.5) * suppression * recall,
    0,
    1,
  );
}

/** Target IgM, 0..1 — produced early, no class switching required. */
export function igmTarget(bCellActivity: number): number {
  return clamp(bCellActivity * HUMORAL.IGM_GAIN, 0, 1);
}

/**
 * Target IgG, 0..1. Requires class switching, which requires helper T cell support — so it
 * lags IgM, and it is the isotype a memory response produces almost immediately.
 */
export function iggTarget(bCellActivity: number, helperTActivity: number, memoryLevel: number): number {
  const classSwitchCapacity = clamp(helperTActivity, 0, 1);
  // Memory B cells are already switched, so a recall response makes IgG straight away.
  const memoryBoost = 1 + memoryLevel * 1.6;
  return clamp(bCellActivity * classSwitchCapacity * HUMORAL.IGG_GAIN * memoryBoost, 0, 1);
}

/**
 * How much faster the adaptive arm engages given existing memory.
 *
 * Memory does not make the response bigger so much as it makes it FASTER — the delay of
 * finding and expanding a rare naive clone is already paid. Since the pathogen is replicating
 * exponentially throughout that delay, shortening it is worth far more than it sounds, and it
 * is why a vaccinated host clears an organism before it ever becomes symptomatic.
 */
export function memorySpeedup(memoryLevel: number): number {
  return 1 + clamp(memoryLevel, 0, 1) * ADAPTIVE.MEMORY_SPEEDUP;
}

/** Target memory level — formed in proportion to the adaptive response actually mounted. */
export function memoryTarget(bCellActivity: number, helperTActivity: number, currentMemory: number): number {
  const formed = clamp(bCellActivity * helperTActivity * MEMORY.FORMATION_GAIN * 2.2, 0, 1);
  // Memory ratchets: a weaker later response never erases what an earlier one established.
  return Math.max(currentMemory, formed);
}

/**
 * Total killing pressure on the pathogen.
 *
 * The two effector arms are matched to different targets: antibody neutralises organisms in
 * the extracellular space but cannot reach inside a host cell, while cytotoxic T cells kill
 * infected cells and so handle intracellular organisms. Swapping the pathogen type therefore
 * changes WHICH arm matters, not merely how hard the response works.
 */
export function effectorKilling(
  innateActivity: number,
  cytotoxicTActivity: number,
  igmTitre: number,
  iggTitre: number,
  pathogenType: PathogenType,
  inputs: ImmuneInputs,
): number {
  const antibody = igmTitre * 0.35 + iggTitre;
  const antibodyWeight = pathogenType === 'extracellular' ? EFFECTOR.ANTIBODY_VS_EXTRACELLULAR : EFFECTOR.ANTIBODY_VS_INTRACELLULAR;
  const cytotoxicWeight = pathogenType === 'intracellular' ? EFFECTOR.CYTOTOXIC_VS_INTRACELLULAR : EFFECTOR.CYTOTOXIC_VS_EXTRACELLULAR;

  const innateKilling = clamp(innateActivity * clamp(inputs.innateImmuneFunction, 0, 1.5), 0, INNATE_MAX);
  return innateKilling + antibody * antibodyWeight + cytotoxicTActivity * cytotoxicWeight;
}

// Innate killing saturates — it buys time rather than clearing a serious infection alone.
const INNATE_MAX = 0.9;
