import type { ModuleCase } from '@/shared/cases/types';
import type { RespPresetName } from './engine/presets';
import { ABG_PANEL, type RespSnapshot } from './panel';

export type RespCase = ModuleCase<RespPresetName, RespSnapshot>;

/**
 * Three gases that look like each other and are not.
 *
 * Chosen the way the shock beds were: each pair is a mistake somebody actually makes. A low
 * bicarbonate that is compensation versus a low bicarbonate that is the disease; a raised PaCO2
 * that has been there for years versus one that arrived this morning.
 */
export const RESP_CASES: readonly RespCase[] = [
  {
    id: 'nadia-dka',
    bed: 'C01',
    name: 'Nadia',
    age: 19,
    oneLiner: 'Vomiting, breathing deeply, three days of thirst',
    presentation:
      'Nineteen, newly unwell, and breathing in a way the triage nurse described as "sighing". She has been thirsty for three days and vomiting since last night. Her respiratory rate is 32 and her chest is clear. The house officer has noted the fast breathing and is asking whether she needs something for anxiety.',
    preset: 'dkaMetabolicAcidosis',
    chart: ABG_PANEL,
    task: 'Say what the breathing is doing, and whether to slow it down.',
    teaching:
      'The low bicarbonate and the wide anion gap are the disease: unmeasured ketoacids are consuming buffer. The low PaCO2 is not a second problem, it is the answer to the first — Kussmaul breathing blowing off CO2 to hold the pH up, and it is the only thing keeping her out of a far worse number. Sedating that respiratory drive would remove her compensation and drop the pH straight down. Check Winter’s formula against the PaCO2 here: the compensation is appropriate, which is itself the finding.',
    questionIds: ['dka-kussmaul', 'abg-gap-vs-non-gap'],
  },
  {
    id: 'brian-copd',
    bed: 'C05',
    name: 'Brian',
    age: 74,
    oneLiner: 'Long-standing COPD, PaCO2 raised, pH nearly normal',
    presentation:
      'Seventy-four, forty pack-years, and short of breath on the flat for as long as anyone has recorded. He has come in for something else entirely and a routine gas has come back with a PaCO2 the F1 describes as frightening. He is comfortable, orientated and cross about the wait. Somebody has already asked whether he needs intubating.',
    preset: 'copdChronicAcidosis',
    chart: ABG_PANEL,
    task: 'Decide whether this gas is an emergency or a baseline.',
    teaching:
      'The PaCO2 is high and the pH is nearly normal, and that combination takes time to build: the kidney has spent weeks retaining bicarbonate to buy the pH back. A respiratory acidosis this well compensated is by definition chronic, so the number is his normal rather than his crisis. Treating the figure instead of the patient is how a comfortable man ends up ventilated. What would worry you is the same PaCO2 with a pH of 7.20 and a bicarbonate that has not moved — that gas is hours old, not years.',
    questionIds: ['abg-compensated-retainer', 'copd-oxygen-hypercapnia'],
  },
  {
    id: 'colin-salicylate',
    bed: 'C09',
    name: 'Colin',
    age: 34,
    oneLiner: 'Confused and hyperventilating, ringing in the ears',
    presentation:
      'Brought in confused, sweating and breathing fast, with tinnitus he mentioned once before he stopped making sense. No history is available. The team have seen the low PaCO2 and the fast breathing and are working on a respiratory alkalosis, which fits the pH. Then the anion gap comes back.',
    preset: 'salicylatePoisoning',
    chart: ABG_PANEL,
    task: 'Account for every row. One disorder will not do it.',
    teaching:
      'There are two disorders here at once, which is why no single label fits the gas. Salicylate stimulates the respiratory centre directly — that is the primary respiratory alkalosis and the low PaCO2 — while simultaneously uncoupling oxidative phosphorylation and generating organic acid, which is the raised anion gap. Neither is compensation for the other; both are the poison. The give-away is arithmetic rather than intuition: compute the expected compensation for each and it overshoots, because a second process is running alongside.',
    questionIds: ['abg-salicylate-two-disorders'],
  },
];
