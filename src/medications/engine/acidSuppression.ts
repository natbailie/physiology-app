import { clamp, scaleClamped } from '@/shared/lib/math';
import { parietalCellAcidOutput } from '@/modules/gastrointestinal/engine/parietalCell';

export interface AcidSuppressionInputs {
  /** PPI dose, % of a standard therapeutic dose (0-150). Blocks the H+/K+-ATPase pump itself — the
   * shared final pathway, so it suppresses acid regardless of the stimulus that drove it. */
  ppiDose: number;
  /** H2-receptor blocker dose, % of standard (0-150). Removes only the histamine-mediated
   * contribution, leaving ACh and direct gastrin partially able to drive the pump. */
  h2BlockerDose: number;
  /** Antacid dose, % of a standard dose (0-150). Buffers acid already in the lumen — fast but short
   * lived; it raises pH without touching secretion, so it stops working as the buffer is emptied. */
  antacidDose: number;
  /** Vagal (parasympathetic) tone, % of baseline (0-200). The background drive an emptied,
   * unblocked parietal cell would secrete against. */
  vagalTone: number;
}

export interface AcidSuppressionResult {
  /** Parietal-cell acid output, normalized % where ~100 = a strongly stimulated peak. */
  acidOutput: number;
  /** Gastric luminal pH, 1-7, from unstimulated baseline up toward antacid-pushed neutral. */
  gastricPH: number;
  /** Fraction of the lumen's acidity currently neutralised by antacid buffer, 0..1. */
  antacidNeutralisation: number;
}

const GASTRIC = {
  UNSTIMULATED_PH: 5.0,
  MIN_PH: 1.0,
  MAX_PH: 7.0,
  // How far full (1.0) acid output drives pH down from the unstimulated baseline.
  ACID_SECRETION_PH_DROP: 3.8,
  // How fully a maximal antacid dose can push pH back toward neutral, 0..1.
  ANTACID_MAX_EFFECT: 0.85,
};

/**
 * Gastric acid physiology across the three acid-reducing drug classes.
 *
 * PPIs and H2 blockers suppress the *secretion* of acid — the difference between them is where
 * in the chain they cut: H2 blockers remove only the histamine arm, so a strong vagal or gastrin
 * drive still gets acid out; PPIs block the pump itself and win even against maximal drive. The
 * antacid works the other way round, neutralising acid that has already been secreted, which is
 * why it is fast but never the definitive treatment.
 */
export function computeAcidSuppression({ ppiDose, h2BlockerDose, antacidDose, vagalTone }: AcidSuppressionInputs): AcidSuppressionResult {
  // A modest baseline gastrin drive so the stomach secretes something to block.
  const gastrinDrive = 0.5;
  const acidOutput = parietalCellAcidOutput(gastrinDrive, vagalTone, ppiDose, h2BlockerDose);

  const neutralisation = clamp(antacidDose / 100, 0, 1) * GASTRIC.ANTACID_MAX_EFFECT;

  const secretionPh = GASTRIC.UNSTIMULATED_PH - acidOutput * GASTRIC.ACID_SECRETION_PH_DROP;
  const bufferedPh = secretionPh + neutralisation * (GASTRIC.MAX_PH - secretionPh);
  const gastricPH = clamp(bufferedPh, GASTRIC.MIN_PH, GASTRIC.MAX_PH);

  return { acidOutput: acidOutput * 100, gastricPH, antacidNeutralisation: neutralisation };
}

export function acidPhToReadable(ph: number): string {
  return scaleClamped(ph, GASTRIC.MIN_PH, GASTRIC.MAX_PH, 0, 100).toFixed(0);
}
