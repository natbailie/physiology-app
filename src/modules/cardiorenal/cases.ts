import type { ModuleCase } from '@/shared/cases/types';
import type { PresetName } from './engine/presets';
import { CARDIORENAL_PANEL, type CardiorenalSnapshot } from './panel';

export type CardiorenalCase = ModuleCase<PresetName, CardiorenalSnapshot>;

/**
 * Two patients whose numbers overlap and whose organs do not.
 *
 * Both are oliguric, both are retaining salt and water, and both have a RAAS axis running hard.
 * Which organ started it is the question, and it is the one that decides the treatment.
 */
export const CARDIORENAL_CASES: readonly CardiorenalCase[] = [
  {
    id: 'margaret-heart-failure',
    bed: 'D03',
    name: 'Margaret',
    age: 79,
    oneLiner: 'Ankles swelling, breathless on stairs, passing little urine',
    presentation:
      'Her ankles have been swelling for a fortnight and she now sleeps on three pillows. She is passing less urine than she used to and has gained four kilograms without eating more. Her creatinine has crept up, and the medical team are discussing whether the kidneys are the problem and whether to stop her diuretic.',
    preset: 'heartFailure',
    chart: CARDIORENAL_PANEL,
    task: 'Work out which organ is failing, and what the RAAS axis is responding to.',
    teaching:
      'The cardiac output is down and everything else on the chart follows from that one fact. The kidney is not diseased — it is underperfused, so it reads the low flow as low volume and turns RAAS on to defend the pressure. That retains salt and water, which raises the volume, which loads a ventricle that could not cope with the last litre either. The rising creatinine is a consequence, not a second diagnosis, and the loop only breaks by treating the pump. This is why the same axis that saves a bleeding patient slowly drowns this one.',
    questionIds: ['failing-ventricle-volume', 'raas-defends-pressure-not-flow'],
  },
  {
    id: 'derek-kidney-failure',
    bed: 'D08',
    name: 'Derek',
    age: 61,
    oneLiner: 'Long-standing hypertension, creatinine doubled, oedematous',
    presentation:
      'Hypertensive for twenty years and poorly controlled for most of them. His creatinine has doubled over eighteen months and he is now puffy around the eyes in the mornings. His heart sounds are normal and his ejection fraction was reported as preserved six weeks ago. The pressure remains high despite three agents.',
    preset: 'kidneyFailure',
    chart: CARDIORENAL_PANEL,
    task: 'Explain why the pressure is high when Margaret’s, next door, is low.',
    teaching:
      'Here the kidney is the lesion rather than the victim. Filtration has fallen at a perfectly adequate perfusing pressure, so salt and water accumulate and the volume rises — and because the pump is intact it converts that extra volume into pressure rather than into congestion behind a failing ventricle. That is the whole difference between these two beds. RAAS is raised in both, but in Margaret it is compensating for flow the heart is not delivering, and in Derek it is a damaged kidney misreading a pressure that was never low.',
    questionIds: ['kidney-failure-pressure', 'failing-kidney-raises-raas'],
  },
];
