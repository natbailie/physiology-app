import type { ModuleCase } from '@/shared/cases/types';
import type { ExercisePresetName } from './engine/presets';
import { EFFORT_PANEL, type ExerciseSnapshot } from './panel';

export type ExerciseCase = ModuleCase<ExercisePresetName, ExerciseSnapshot>;

/**
 * Two beds, one ceiling between them.
 *
 * They were chosen to be the pair that asks the same question from opposite ends: what does
 * this heart do at its limit, and what does it do at rest. One collapses because demand
 * exceeds supply; the other barely needs to beat because supply arrives in bucketfuls — and
 * both are routinely misread as pathology in the wrong direction. Nothing here is new
 * physiology; what is new is that the numbers belong to somebody, which is the difference
 * between reading a panel and deciding what to do next.
 *
 * Observations are absent on purpose. `chart` points at `EFFORT_PANEL`, so the six rows are
 * read off the settled engine at the bedside and checked against it in `cases.test.ts`.
 */
export const EXERCISE_CASES: readonly ExerciseCase[] = [
  {
    id: 'callum-exhaustion',
    bed: 'J01',
    name: 'Callum',
    age: 23,
    oneLiner: 'Untrained, hits the wall, VO2 flat while lactate climbs',
    presentation:
      'Referred to the exercise lab after abandoning a charity bike ride halfway, convinced something is wrong with his heart. On the ergometer he cycles into rapidly rising effort while his oxygen uptake stops climbing and his lactate climbs steeply. He wants to know whether the test found disease, and what number he should train to.',
    preset: 'untrainedExhaustion',
    chart: EFFORT_PANEL,
    task: 'Say whether the test found disease or a ceiling.',
    teaching:
      'A flat VO2 while effort continues is the definition of VO2max: demand exceeds supply and the difference is paid anaerobically, so lactate and fatigue climb together while uptake sits pinned. There is no disease here — only a low ceiling, and the test ends when VO2 plateaus rather than when he stops pedalling for exactly that reason. Training raises the ceiling; nothing on the day does. Contrast Helen, whose heart barely needs to beat at rest for the opposite reason: hers is a high ceiling idling, his is a low one maxed out.',
    questionIds: ['untrained-hits-the-wall'],
  },
  {
    id: 'helen-bradycardia',
    bed: 'J02',
    name: 'Helen',
    age: 26,
    oneLiner: 'Endurance athlete, resting rate 46, normal echo, ?pathology',
    presentation:
      'An endurance runner referred by her GP, who found a resting heart rate of 46 and wrote "?heart block" on the referral. Her echocardiogram is completely normal with a normal cardiac output, she is asymptomatic, and she is privately worried the referral means something was spotted. She asks whether she needs a pacemaker.',
    preset: 'athleteRest',
    chart: EFFORT_PANEL,
    task: 'Decide whether this is an efficient pump or a failing one.',
    teaching:
      'Training enlarges stroke volume, so the same cardiac output arrives in fewer, bigger beats: resting bradycardia with a normal echo and normal output reflects fitness, not failure, and every other readout staying normal is what separates it from pathology. The same enlargement is why such athletes reach extraordinary outputs during exercise — their resting stroke volume starts near where other people peak. She needs reassurance and a corrected referral, not a device. Contrast Callum, whose high numbers at low workloads mean a ceiling, where hers at rest mean headroom.',
    questionIds: ['athlete-resting-bradycardia'],
  },
];
