import { TRANSFUSION, TYPE_I, TYPE_II, TYPE_III, TYPE_IV } from './constants';
import { clamp } from '@/shared/lib/math';

/**
 * Blockade of the type I arm, as a multiplier — and of the type I arm ONLY.
 *
 * Applied where histamine acts rather than where it is released, because that is what an H1
 * antagonist does: the mediators still leave the granules, they simply have nowhere to bind.
 * A useful consequence falls out of modelling it that way round — a blocked patient still has
 * a raised tryptase, so the test remains diagnostic in someone whose reaction was treated.
 */
export function blockadeFactor(mastCellStabilisation: number): number {
  return clamp(1 - mastCellStabilisation / 100, 0, 1);
}

/**
 * Type I: the RATE at which antigen cross-linking IgE empties mast cell granules.
 *
 * A rate rather than a level, because the granules are a finite store being emptied — that is
 * what makes the reaction a spike lasting an hour instead of a plateau lasting a day.
 *
 * It needs BOTH antigen and pre-bound IgE, so it is a product rather than a sum, and that is
 * the whole of sensitisation. A naive host has no IgE to cross-link, so a first exposure
 * produces nothing at all no matter how large the dose, while a sensitised host reacts
 * violently to a dose that did nothing the first time. Nothing about the antigen changed
 * between them; the only difference is what the previous exposure left behind.
 */
export function mastCellReleaseRate(solubleAntigen: number, igeSensitisation: number, granuleStore: number): number {
  return (
    clamp(solubleAntigen, 0, 1) *
    clamp(igeSensitisation, 0, 1.5) *
    clamp(granuleStore, 0, 1) *
    TYPE_I.RELEASE_RATE_PER_HOUR
  );
}

/**
 * Type II target: antibody binding an antigen FIXED on a cell surface.
 *
 * The distinction from type III is the location of the antigen, not the antibody or the
 * effector — both use IgG and both use complement. Here the antigen is part of a cell, so the
 * cell is what gets destroyed and the antibody is detectably sitting on it, which is precisely
 * what a direct Coombs test finds.
 */
export function cellSurfaceBindingTarget(fixedAntigen: number, iggAgainstCellSurface: number): number {
  return clamp(fixedAntigen * clamp(iggAgainstCellSurface, 0, 1.5) * TYPE_II.GAIN, 0, 1);
}

/** How much of the type II killing complement is responsible for, given the host's complement. */
export function cellDestructionTarget(bound: number, complementFunction: number): number {
  const complementPart = TYPE_II.COMPLEMENT_SHARE * clamp(complementFunction, 0, 1.5);
  const phagocyticPart = 1 - TYPE_II.COMPLEMENT_SHARE;
  return clamp(bound * (complementPart + phagocyticPart) * TYPE_II.INJURY_GAIN, 0, 1);
}

/**
 * Type III target: SOLUBLE antigen and antibody meeting in the circulation.
 *
 * The equivalence term is the mechanism that makes this type behave unlike the others.
 * Complexes only deposit when antigen and antibody are present in comparable amounts — a large
 * excess of either produces complexes too small or too large to lodge in a vessel wall. So a
 * type III reaction has a dose optimum rather than a dose-response, which is why serum sickness
 * follows a big protein load and not a trace of it, and why it appears days later, once
 * antibody has risen to meet an antigen that is still circulating.
 */
export function immuneComplexTarget(solubleAntigen: number, circulatingIgg: number): number {
  const antigen = clamp(solubleAntigen, 0, 1);
  const antibody = clamp(circulatingIgg, 0, 1.5);
  if (antigen <= 0 || antibody <= 0) return 0;

  // Peaks where the two are matched and falls away on either side of it.
  const ratio = antigen / antibody;
  const equivalence = Math.exp(-TYPE_III.EQUIVALENCE_SHARPNESS * (Math.log(ratio) ** 2));
  const amount = Math.min(antigen, antibody);
  return clamp(amount * equivalence * TYPE_III.GAIN, 0, 1);
}

/** Deposited complexes injure through complement, so a complement-deficient host is spared. */
export function complexInjuryTarget(deposition: number, complementFunction: number): number {
  const complementPart = TYPE_III.COMPLEMENT_SHARE * clamp(complementFunction, 0, 1.5);
  const directPart = 1 - TYPE_III.COMPLEMENT_SHARE;
  return clamp(deposition * (complementPart + directPart) * TYPE_III.INJURY_GAIN, 0, 1);
}

/**
 * Type IV target: antigen-specific T cells recruited to the site.
 *
 * No antibody anywhere in this arm, and no complement — which is why a type IV reaction leaves
 * C3 and C4 completely normal, and why plasma exchange and antibody-directed treatments do
 * nothing for it. The slowness is not incidental: cells have to physically arrive.
 */
export function tCellTarget(fixedAntigen: number, sensitisedTCells: number): number {
  return clamp(fixedAntigen * clamp(sensitisedTCells, 0, 1.5) * TYPE_IV.GAIN, 0, 1);
}

/** Macrophages are what actually cause the damage in type IV; the T cells only direct them. */
export function macrophageTarget(tCellRecruitment: number): number {
  return clamp(tCellRecruitment * TYPE_IV.INJURY_GAIN, 0, 1);
}

/** Type I injury: histamine-driven vasodilatation, leak and bronchospasm, minus any blockade. */
export function histamineInjury(histamine: number, blockade: number): number {
  return clamp(histamine * TYPE_I.INJURY_GAIN * blockade, 0, 1);
}

/**
 * Total antibody available against a cell-surface antigen — the type II arm's real strength.
 *
 * Three sources, and they behave completely differently in time. Deliberate sensitisation is
 * standing. Naturally-occurring anti-A and anti-B need no prior exposure at all, which is why
 * an ABO-incompatible unit can kill on a first transfusion. And a recalled antibody against a
 * minor antigen has to be re-made from memory, which takes days — the delayed reaction.
 */
export function totalAntiCellAntibody(
  iggAgainstCellSurface: number,
  aboCompatibility: number,
  recalledAntibody: number,
): number {
  const isohaemagglutinin = clamp(1 - aboCompatibility, 0, 1) * TRANSFUSION.ISOHAEMAGGLUTININ_STRENGTH;
  const recalled = clamp(recalledAntibody, 0, 1) * TRANSFUSION.RECALL_STRENGTH;
  return clamp(iggAgainstCellSurface, 0, 1.5) + isohaemagglutinin + recalled;
}

/** Total mast cell trigger: standing IgE sensitisation plus anti-IgA against donor plasma. */
export function totalMastCellTrigger(igeSensitisation: number, recipientIgaDeficiency: number): number {
  return clamp(igeSensitisation, 0, 1.5) + clamp(recipientIgaDeficiency, 0, 1) * TRANSFUSION.ANTI_IGA_STRENGTH;
}

/**
 * Pulmonary capillary leak from donor antibody activating recipient neutrophils — TRALI.
 *
 * Note what it is NOT: not a volume problem, and not one of the four types either, since the
 * antibody came from the donor rather than the patient. The lung fills because the capillaries
 * leak, so the ventricle is never stretched and the BNP never rises. That is the only thing
 * separating it from circulatory overload, and the treatments are opposites — support the
 * breathing in one, offload the volume in the other.
 */
export function capillaryLeakTarget(donorAntileukocyteAntibody: number, transfusedVolume: number): number {
  return clamp(clamp(donorAntileukocyteAntibody, 0, 1) * Math.min(transfusedVolume * 2, 1), 0, 1);
}
