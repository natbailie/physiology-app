import type { ModuleCase } from '@/shared/cases/types';
import type { ThermoPresetName } from './engine/presets';
import { THERMO_PANEL, type ThermoSnapshot } from './panel';

export type ThermoCase = ModuleCase<ThermoPresetName, ThermoSnapshot>;

/**
 * Two beds, one high thermometer between them.
 *
 * They were chosen to be the pair the whole module exists to separate: a defended temperature
 * against an overwhelmed one. Same fever-range numbers, opposite set points, opposite
 * treatments — blankets for one would cook the other, and ice for one would be fought off by
 * the other. Nothing here is new physiology; what is new is that the numbers belong to
 * somebody, which is the difference between reading a panel and deciding what to do next.
 *
 * Observations are absent on purpose. `chart` points at `THERMO_PANEL`, so the five rows are
 * read off the settled engine at the bedside and checked against it in `cases.test.ts`.
 */
export const THERMO_CASES: readonly ThermoCase[] = [
  {
    id: 'neil-fever',
    bed: 'I01',
    name: 'Neil',
    age: 47,
    oneLiner: 'Chest infection, shivering under blankets, thermometer reads 39',
    presentation:
      'Two days of cough and pleuritic pain, now shivering violently under three blankets with teeth chattering and skin pale and cool to touch — yet the thermometer reads 39. He feels freezing and keeps asking for more covers. His partner wants to know whether the blankets are driving the temperature up and should come off.',
    preset: 'feverViral',
    chart: THERMO_PANEL,
    task: 'Decide whether the blankets stay on or come off.',
    teaching:
      'The set point has been raised by pyrogen-driven prostaglandins, so a core of 39 is still below where the hypothalamus wants it: he experiences genuine cold and generates heat to reach it, which is exactly what shivering under blankets with a high reading means. The blankets stay — and an antipyretic works not by cooling him but by lowering the defended point, which is why the fever then "breaks" into sweats. Contrast Gordon, whose point never moved: blankets on him would trap heat nothing is defending, and ice is the treatment instead.',
    questionIds: ['hot-but-feeling-cold'],
  },
  {
    id: 'gordon-heatstroke',
    bed: 'I02',
    name: 'Gordon',
    age: 29,
    oneLiner: 'Collapsed runner, hot and barely sweating, core 40.6',
    presentation:
      'Collapsed at the finish of a summer race held in humid conditions. Core temperature 40.6, skin hot but barely sweating despite the heat, consciousness fluctuating. The event medics have started fanning and tepid sponging, and a bystander is arguing that a fever this high needs paracetamol while somebody else runs for ice.',
    preset: 'heatStrokeExertional',
    chart: THERMO_PANEL,
    task: 'Say what failed, and what fixes it within the hour.',
    teaching:
      'Nine-fold metabolic production in humid air with impaired sweating has overwhelmed defences that never moved: the set point sits at normal while storage runs hundreds of watts positive. Hot dry skin past 40 means evaporation has failed completely, which is the emergency inside the emergency — cooling must be immediate and external, because no physiology will fix a ledger this far out of balance. Paracetamol is pointless here: there is no raised point to lower. Contrast Neil, whose identical-range temperature is defended and would simply re-assert itself against the ice.',
    questionIds: ['collapsed-runner-hot-dry'],
  },
];
