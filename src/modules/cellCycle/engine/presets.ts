import type { CellCycleInputs } from './types';

export const DEFAULT_CELL_CYCLE_INPUTS: CellCycleInputs = {
  growthFactorDrive: 0.7,
  dnaDamage: 0.05,
  p53Function: 1,
  rbFunction: 1,
  oncogeneDrive: 0,
  cdk46InhibitionPct: 0,
  spindlePoisonPct: 0,
  replicationBlockPct: 0,
};

export type CellCyclePresetName =
  | 'normal'
  | 'quiescent'
  | 'irradiated'
  | 'tp53Mutated'
  | 'rbLost'
  | 'oncogeneActive'
  | 'cdk46Inhibited'
  | 'taxaneArrest'
  | 'hydroxyurea';

export const CELL_CYCLE_PRESETS: Record<CellCyclePresetName, Partial<CellCycleInputs>> = {
  normal: { ...DEFAULT_CELL_CYCLE_INPUTS },
  // No growth factor: an RB-intact cell parks in G0 — reversible, not death.
  quiescent: { ...DEFAULT_CELL_CYCLE_INPUTS, growthFactorDrive: 0.05 },
  // Radiation: lesions everywhere, p53 intact — arrest at G1/S and G2/M, apoptosis if the
  // damage is beyond repair. This is WHY radiotherapy works on p53-wild-type tumours.
  irradiated: { ...DEFAULT_CELL_CYCLE_INPUTS, dnaDamage: 0.85 },
  // The same lesion load with TP53 gone: neither checkpoint fires, nothing is repaired,
  // and a damaged genome replicates on schedule. Radiotherapy's hardest problem.
  tp53Mutated: { ...DEFAULT_CELL_CYCLE_INPUTS, dnaDamage: 0.85, p53Function: 0.04 },
  // RB loss: the restriction point no longer exists, so cells enter S without any growth
  // signal — autonomous cycling, the hallmark of a tumour suppressor gone.
  rbLost: { ...DEFAULT_CELL_CYCLE_INPUTS, growthFactorDrive: 0.05, rbFunction: 0.03 },
  // MYC-class oncogenic drive: cyclin D is held high without growth factors and G1
  // shortens — the cell races through its cycle.
  oncogeneActive: { ...DEFAULT_CELL_CYCLE_INPUTS, oncogeneDrive: 0.9 },
  // Palbociclib-class CDK4/6 inhibition: the restriction point is pharmacologically
  // jammed even under full oncogenic drive.
  cdk46Inhibited: { ...DEFAULT_CELL_CYCLE_INPUTS, oncogeneDrive: 0.9, cdk46InhibitionPct: 90 },
  // Taxane: microtubules cannot depolymerise, the spindle never forms properly, and cells
  // pile up in mitosis at the spindle assembly checkpoint.
  taxaneArrest: { ...DEFAULT_CELL_CYCLE_INPUTS, spindlePoisonPct: 90 },
  // Hydroxyurea: ribonucleotide reductase blocked, DNA synthesis stalls — classic S-phase
  // accumulation.
  hydroxyurea: { ...DEFAULT_CELL_CYCLE_INPUTS, replicationBlockPct: 90 },
};

export const CELL_CYCLE_PRESET_LABELS: Record<CellCyclePresetName, string> = {
  normal: 'Normal cycling',
  quiescent: 'G0 (no growth factor)',
  irradiated: 'Irradiated (p53 intact)',
  tp53Mutated: 'Irradiated + TP53 lost',
  rbLost: 'RB1 lost',
  oncogeneActive: 'Oncogene active (MYC-class)',
  cdk46Inhibited: 'CDK4/6 inhibited',
  taxaneArrest: 'Taxane (spindle poison)',
  hydroxyurea: 'Hydroxyurea',
};

export const CELL_CYCLE_PRESET_ORDER: CellCyclePresetName[] = [
  'normal',
  'quiescent',
  'irradiated',
  'tp53Mutated',
  'rbLost',
  'oncogeneActive',
  'cdk46Inhibited',
  'taxaneArrest',
  'hydroxyurea',
];
