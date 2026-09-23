import type { ModuleCase } from '@/shared/cases/types';
import type { ElectrolytePresetName } from './engine/presets';
import { SODIUM_PANEL, type ElectrolyteSnapshot } from './panel';

export type ElectrolyteCase = ModuleCase<ElectrolytePresetName, ElectrolyteSnapshot>;

/**
 * Three beds, one sodium between them.
 *
 * They were chosen to be the three causes that produce almost the same serum number and are
 * treated in opposite directions — water restriction, saline, and stopping the intake — which
 * is the whole reason the hyponatraemia workup exists, and the reason the panel carries
 * volume status and urine osmolality rather than sodium alone. Nothing here is new
 * physiology; what is new is that the number belongs to somebody, which is the difference
 * between reading a panel and deciding what to do next.
 *
 * Observations are absent on purpose. `chart` points at `SODIUM_PANEL`, so the four rows are
 * read off the settled engine at the bedside and checked against it in `cases.test.ts`.
 */
export const ELECTROLYTE_CASES: readonly ElectrolyteCase[] = [
  {
    id: 'sandra-siadh',
    bed: 'C03',
    name: 'Sandra',
    age: 64,
    oneLiner: 'Small-cell lung cancer, confused, euvolaemic, sodium low',
    presentation:
      'Known small-cell lung cancer, brought in confused after her daughter found her wandering the kitchen at night. She looks neither dehydrated nor oedematous, her pressure is steady, and she takes no diuretic. The laboratory reports a low sodium, and the house officer is already writing up a litre of normal saline on the grounds that low sodium means give sodium.',
    preset: 'siadh',
    chart: SODIUM_PANEL,
    task: 'Decide whether that bag of saline will help her or harm her.',
    teaching:
      'A concentrated urine in a hyponatraemic patient who is NOT volume-deplete: the ADH is coming from somewhere the feedback loop cannot switch off, and here the history names it. Saline would be excreted as concentrated urine while the water stayed — the sodium number barely moving while the patient gains volume they do not need. This is the bed where fluid restriction, not infusion, is the treatment, and the exact opposite of Edna two beds down, whose identical sodium wants saline and nothing else. Same number, opposite bag.',
    questionIds: ['pattern-siadh'],
  },
  {
    id: 'edna-hypovolaemic',
    bed: 'C04',
    name: 'Edna',
    age: 81,
    oneLiner: 'Elderly, vomiting and diarrhoea for days, dry and hypotensive',
    presentation:
      'Several days of vomiting and diarrhoea that she tried to ride out at home because she did not want to bother anyone. She is hypotensive, tachycardic, her mucous membranes are dry and her skin stays tented. Her sodium is low — much the same number Sandra carries — and the registrar, fresh from being told never to give saline to a hyponatraemia, is hesitating over the fluids.',
    preset: 'hypovolemicHyponatremia',
    chart: SODIUM_PANEL,
    task: 'Say why the rule learned on Sandra does not apply to Edna.',
    teaching:
      'The contracted ECF volume is the whole diagnosis, with the raised potassium as the corroborating clue: a volume-deplete patient runs a roaring renin-angiotensin-aldosterone axis, which retains the sodium and shifts the potassium. Her ADH is entirely appropriate — faced with a choice between defending volume and defending tonicity, the body defends volume every time and accepts the low sodium as the price. So saline here is not a mistake but the treatment, and withholding it out of a misremembered rule would leave her under-resuscitated. Read the volume, not the sodium.',
    questionIds: ['pattern-hypovolemic-hyponatraemia'],
  },
  {
    id: 'martin-polydipsia',
    bed: 'C05',
    name: 'Martin',
    age: 47,
    oneLiner: 'Schizophrenia, known water drinking, confused and fitting',
    presentation:
      'Schizophrenia, known to the community team for drinking extraordinary volumes of water. Found confused on the ward round and then fitted briefly in front of two nurses. His sodium is low like the other two beds, but his examination is otherwise unremarkable — euvolaemic, no oedema, kidneys previously normal. His carer says the water bottles by his chair have needed refilling all week.',
    preset: 'polydipsia',
    chart: SODIUM_PANEL,
    task: 'Name the single row that settles which of the three hyponatraemias this is.',
    teaching:
      'A maximally dilute urine, the opposite of both other beds: his kidney is working perfectly, ADH appropriately switched off, excreting water as fast as it can — and he is simply drinking faster than that. This is the one hyponatraemia where the kidney is not part of the problem, so neither saline nor restriction does the work; stopping the intake does. The urine osmolality is the row that makes the call, which is why it is sent on every hyponatraemia before anything is infused or restricted.',
    questionIds: ['pattern-polydipsia'],
  },
];
