import { PARIETAL_CELL } from './constants';
import { clamp, scaleClamped } from '@/shared/lib/math';

/**
 * Parietal cell H+/K+-ATPase output (0..~1.2, normalized where ~1 = strong physiological
 * stimulation), from three convergent stimuli: direct vagal ACh, gastrin's major indirect
 * action via ECL-cell histamine release, and gastrin's smaller direct action. PPIs block the
 * shared final pathway (the pump itself) regardless of which stimulus drove it; H2 blockers
 * remove only the histamine-mediated contribution, leaving ACh and direct gastrin partially
 * able to drive acid secretion — the key MOA distinction between the two drug classes.
 */
export function parietalCellAcidOutput(gastrinDrive: number, vagalTone: number, ppiDose: number, h2BlockerDose: number): number {
  const achDrive = scaleClamped(vagalTone, 0, PARIETAL_CELL.VAGAL_SATURATION, 0, 1) * PARIETAL_CELL.ACH_GAIN;
  const histamineDrive = gastrinDrive * PARIETAL_CELL.ECL_HISTAMINE_GAIN;
  const gastrinDirectDrive = gastrinDrive * PARIETAL_CELL.GASTRIN_DIRECT_GAIN;

  const h2Blockade = clamp(h2BlockerDose / 100, 0, 1) * PARIETAL_CELL.H2_BLOCK_EFFICACY;
  const combined = achDrive + histamineDrive * (1 - h2Blockade) + gastrinDirectDrive;

  const ppiBlockade = clamp(ppiDose / 100, 0, 1) * PARIETAL_CELL.PPI_BLOCK_EFFICACY;
  return clamp(combined * (1 - ppiBlockade), 0, 1.2);
}
