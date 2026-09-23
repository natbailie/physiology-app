import type { ModuleCase } from '@/shared/cases/types';
import type { GiPresetName } from './engine/presets';
import { GI_PANEL, type GiSnapshot } from './panel';

export type GiCase = ModuleCase<GiPresetName, GiSnapshot>;

/**
 * Two beds, one raised gastrin between them.
 *
 * They were chosen to be the pair that shares a laboratory number and means opposite things
 * by it: autonomous drive with crashed pH against drug-induced drive with high pH. Nothing
 * here is new physiology; what is new is that the numbers belong to somebody, which is the
 * difference between reading a panel and deciding what to do next.
 *
 * Observations are absent on purpose. `chart` points at `GI_PANEL`, so the five rows are
 * read off the settled engine at the bedside and checked against it in `cases.test.ts`.
 */
export const GI_CASES: readonly GiCase[] = [
  {
    id: 'victor-gastrinoma',
    bed: 'H01',
    name: 'Victor',
    age: 52,
    oneLiner: 'Recurrent ulcers, chronic diarrhoea, gastrin sky-high',
    presentation:
      'Three duodenal ulcers in eighteen months, each treated and each back, plus watery diarrhoea that no stool test has explained. His gastrin has come back many times the upper limit, and a junior has suggested the laboratory must have mixed up the sample. He eats normally and takes no acid suppression. His brother wants to know whether this is just bad luck with ulcers.',
    preset: 'gastrinoma',
    chart: GI_PANEL,
    task: 'Say where the gastrin is coming from, and what the acid is doing downstream.',
    teaching:
      'Autonomous gastrin bypasses the somatostatin brake completely, so acid output runs far above anything meal-driven physiology reaches and the pH crashes: severe, multiple, distally-sited ulcers, and diarrhoea because the acid flood overwhelms duodenal bicarbonate and inactivates pancreatic enzymes downstream. No feedback loop can switch a tumour off, which is why suppression alone keeps failing him — he needs the source found, with high-dose blockade holding the line meanwhile. Contrast Paula, whose identical raised gastrin sits beside a high pH and means the drug is working.',
    questionIds: ['gastrinoma-bypasses-brake'],
  },
  {
    id: 'paula-ppi-gastrin',
    bed: 'H02',
    name: 'Paula',
    age: 58,
    oneLiner: 'Years on omeprazole, raised gastrin found on routine bloods',
    presentation:
      'Chronic reflux controlled for years on daily omeprazole, doing well and asking for nothing. Routine bloods ordered for another reason have come back with a raised gastrin, and the laboratory has flagged a possible gastrinoma. She has no ulcers, no diarrhoea, no weight loss — nothing except the number, and a referral letter half written.',
    preset: 'ppiTherapy',
    chart: GI_PANEL,
    task: 'Decide whether that gastrin number is alarming or expected.',
    teaching:
      'Expected: the PPI blocks the final pump, acid falls, and the somatostatin brake that acid used to apply comes off — so gastrin climbs by design, not by disease. The pH row is what separates her from Victor in the next bed: high here, crashed there, for the same raised gastrin. That is also why the drug must be stopped before gastrin is ever measured to investigate a suspected gastrinoma — measure through the blockade and every treated patient looks like a tumour. Cancel the referral, not the prescription.',
    questionIds: ['ppi-final-pathway', 'ppi-raises-gastrin'],
  },
];
