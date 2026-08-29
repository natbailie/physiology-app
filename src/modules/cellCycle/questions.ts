import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type { CellCycleDerived, CellCycleInputs, CellCycleInternalState } from './engine/types';
import type { CellCyclePresetName } from './engine/presets';

type Snapshot = { state: CellCycleInternalState; derived: CellCycleDerived };
export type CellCycleQuestion = ModuleQuestion<CellCycleInputs, CellCyclePresetName, Snapshot>;

/** Numeric code for where the population is parked — a panel row the fairness check can
 * compare across scenarios. 0 cycling, then checkpoints in ring order. */
function arrestCode(s: Snapshot): number {
  const cause = s.derived.arrestCause;
  if (cause === 'none') return 0;
  if (cause.startsWith('G1/S')) return 1;
  if (cause.startsWith('S')) return 2;
  if (cause.startsWith('G2/M')) return 3;
  if (cause.startsWith('M')) return 4;
  return 5; // quiescence
}

const PANEL_SETTLE_SECONDS = 108000; // thirty simulated hours

export const CELL_CYCLE_QUESTIONS: readonly CellCycleQuestion[] = [
  {
    id: 'radiation-arrests-p53-intact',
    stem: 'A p53-wild-type tumour is irradiated. The dose loads every cell with DNA lesions.',
    setup: { preset: 'normal' },
    intervention: { label: 'Ionising radiation delivers heavy damage.', inputs: { dnaDamage: 0.85 } },
    prompt: 'What happens to the fraction of cells actively cycling?',
    watch: 'cycling rate',
    correctDirection: 'falls',
    // Longer than a full cycle: the population only fully piles up at the checkpoints once
    // every cell has arrived there, which can take most of a cycle from any starting phase.
    observeSeconds: 126000,
    explanation:
      'It collapses toward zero, because functional p53 converts lesion load into checkpoint arrest at BOTH G1/S and G2/M. The cycle stops until repair catches up — or, if the damage is beyond repair, permanently. This is the mechanism of radiotherapy stated plainly: ionising radiation does not kill cells directly so much as it hands them to their own guardian gene. Tumours that retain wild-type p53 tend to respond; the treatment works through the target the cell already owns.',
    metric: (s) => s.derived.cyclingRatePct,
  },
  {
    id: 'tp53-loss-defeats-arrest',
    stem: 'An identical radiation dose is delivered to a tumour with TP53 mutated to silence.',
    setup: { preset: 'irradiated' },
    intervention: { label: 'p53 function is lost.', inputs: { p53Function: 0.04 } },
    prompt: 'What happens to the cycling rate?',
    watch: 'cycling rate',
    correctDirection: 'rises',
    explanation:
      'It recovers toward full speed despite lesions everywhere, because p53 was the switch that translated damage into arrest — and with it gone, neither checkpoint fires, nothing is repaired, and damaged genomes replicate on schedule. Watch the lesion-load readout stay high while divisions continue: that combination is genomic instability, the engine of progression and the reason TP53-mutant tumours radiotherapy and chemotherapy both struggle with. Same dose, same normal tissue toxicity, entirely different tumour outcome.',
    metric: (s) => s.derived.cyclingRatePct,
    settleSeconds: 108000,
    observeSeconds: 126000,
  },
  {
    id: 'rb-loss-autonomous-entry',
    stem: 'A cell sits in G1 with essentially no growth factor available — normally it would enter quiescence.',
    setup: { preset: 'quiescent' },
    intervention: { label: 'RB1 function is lost.', inputs: { rbFunction: 0.03 } },
    prompt: 'What happens to its cycling status?',
    watch: 'cycling (1 = progressing)',
    correctDirection: 'rises',
    observeSeconds: 36000,
    explanation:
      'It starts cycling again, despite the absence of any growth signal. RB is the brake holding E2F shut at the restriction point; lose RB and the gate is jammed open regardless of mitogens, so quiescence becomes impossible — the cell enters S without permission. A cell that can no longer be talked out of dividing has acquired autonomy, the literal definition of transformation. Note also that CDK4/6 inhibitors need intact RB to work: they recreate the brake only where a wheel still exists to lock.',
    metric: (s) => Number(s.derived.arrestCause === 'none'),
    settleSeconds: 36000,
  },
  {
    id: 'cdk46-jams-even-an-oncogene',
    stem: 'A tumour drives its cycle with constitutive MYC-class signalling. A CDK4/6 inhibitor is then added.',
    setup: { preset: 'oncogeneActive' },
    intervention: { label: 'CDK4/6 is pharmacologically inhibited.', inputs: { cdk46InhibitionPct: 90 } },
    prompt: 'What happens to the cycling rate?',
    watch: 'cycling rate',
    correctDirection: 'falls',
    settleSeconds: 36000,
    observeSeconds: 79200,
    explanation:
      'It falls to zero once every cell has reached the next G1/S boundary, because CDK4/6 activity is what phosphorylates RB — and inhibiting it recreates an intact brake even in a cell whose cyclin D signal is pathologically high. This is why palbociclib-class drugs work in RB-INTACT tumours however oncogenic their drive, and why they predictably fail once RB itself is lost: there is nothing left to dephosphorylate. The target matters less than the state of the pathway downstream of it.',
    metric: (s) => s.derived.cyclingRatePct,
  },

  // --- Naming the scenario from where the population sits ---

  {
    id: 'checkpoint-scenario-discrimination',
    stem: 'Four populations, four panels. Where each population sits tells you what it has lost or been given.',
    answer: 'taxaneArrest',
    options: ['taxaneArrest', 'hydroxyurea', 'tp53Mutated', 'cdk46Inhibited'],
    panel: [
      { label: 'Arrest location (0=cycling)', unit: '', value: arrestCode, decimals: 0 },
      { label: 'Cycling rate (%)', unit: '', value: (s: Snapshot) => s.derived.cyclingRatePct, decimals: 0 },
      { label: 'Lesion load (%)', unit: '', value: (s: Snapshot) => s.derived.lesionLoadPct, decimals: 0 },
      { label: 'Doubling time (h)', unit: '', value: (s: Snapshot) => Math.min(s.derived.doublingTimeH, 9999), decimals: 0 },
    ] as readonly PanelField<Snapshot>[],
    settleSeconds: PANEL_SETTLE_SECONDS,
    explanation:
      'M-phase accumulation with high cycling-rate history identifies the spindle poison: cells marched all the way to mitosis and were caught by the assembly checkpoint. Hydroxyurea parks them earlier, inside S. The CDK4/6-inhibited population stops before committing, at G1/S, with a clean genome. And the TP53-lost population is the one STILL CYCLING with a heavy lesion load — the only option whose problem is an absent guardian rather than an applied drug. Location of arrest plus lesion load separates all four, exactly as it does on a real cell-cycle analysis.',
  },
];
