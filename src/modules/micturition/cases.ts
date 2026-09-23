import type { ModuleCase } from '@/shared/cases/types';
import type { MicturitionPresetName } from './engine/presets';
import { BLADDER_PANEL, type MicturitionSnapshot } from './panel';

export type MicturitionCase = ModuleCase<MicturitionPresetName, MicturitionSnapshot>;

/**
 * Three beds, three failures of the same storage programme.
 *
 * They were chosen to be the presentations that look alike in the waiting room — all three
 * leak — and divide on the urodynamic panel into detrusor, sphincter and pump failures with
 * opposite managements. Nothing here is new physiology; what is new is that the numbers
 * belong to somebody, which is the difference between reading a panel and deciding what to
 * do next.
 *
 * Observations are absent on purpose. `chart` points at `BLADDER_PANEL`, so the five rows
 * are read off the settled engine at the bedside and checked against it in `cases.test.ts`.
 */
export const MICTURITION_CASES: readonly MicturitionCase[] = [
  {
    id: 'ray-detrusor-overactivity',
    bed: 'D01',
    name: 'Ray',
    age: 65,
    oneLiner: 'Sudden urgency with small-volume frequency, cannot hold on',
    presentation:
      'A 65-year-old man referred for sudden, uncontrollable urgency with small-volume frequency through the day and twice at night. He cannot get to the toilet in time and has started planning every outing around toilets. Examination is unremarkable, the prostate is moderately enlarged but soft, and a bladder scan after voiding shows almost nothing left behind. He wants to know why the urge arrives with no warning.',
    preset: 'detrusorOveractivity',
    chart: BLADDER_PANEL,
    task: 'Say whether the fault is in the pump or in the valve.',
    questionIds: ['involuntary-contraction'],
    teaching:
      'The detrusor is contracting at volumes well below the normal threshold — the parasympathetic reflex fires prematurely and the pressure spikes above what the sphincter can hold, which is exactly the urgency he describes. The sphincter itself is competent and the bladder empties, so this is a pump firing out of turn rather than a valve failing to hold. That is why the treatment calms the detrusor instead of tightening anything: bladder training and antimuscarinics, the opposite of the pelvic floor work Mary needs next door. Compare her panel, where the detrusor is quiet and the sphincter is the failure.',
  },
  {
    id: 'mary-stress-incontinence',
    bed: 'D02',
    name: 'Mary',
    age: 58,
    oneLiner: 'Leaks on coughing and lifting, no urgency between episodes',
    presentation:
      'A 58-year-old woman, three vaginal deliveries, who leaks urine when she coughs, sneezes or lifts her shopping. Between episodes there is no urgency at all — she voids normally and on time — which she finds almost more distressing, because nothing warns her. Examination shows a mild cystocele and a cough test that reproduces the leak immediately. She has been cutting down on fluids to cope, and wants to know whether anything can be done without surgery.',
    preset: 'stressIncontinence',
    chart: BLADDER_PANEL,
    task: 'Work out why urge-suppressing drugs would do nothing for her.',
    questionIds: ['weak-closure'],
    teaching:
      'The sphincter closing pressure sits far below normal while the detrusor is quiet: even without any bladder contraction, ordinary intravesical pressure at moderate volumes exceeds what the valve can hold, so coughing leaks and urgency never features. Drugs that calm the detrusor answer a question her bladder is not asking — the failure is mechanical, in support and closure, which is why supervised pelvic floor training is first-line and a sling is second. Contrast Ray, whose competent sphincter would make a sling pointless. Same waiting room, opposite operations.',
  },
  {
    id: 'stan-overflow',
    bed: 'D03',
    name: 'Stan',
    age: 76,
    oneLiner: 'Diabetic, palpable bladder, dribbling, cannot start voiding',
    presentation:
      'A 76-year-old man with long-standing diabetes, brought by his son because he has been unable to initiate voiding for most of the day and his underclothes are constantly damp. The bladder is palpable nearly to the umbilicus. He feels little urge despite the volume, and what comes out arrives as a dribble that never becomes a stream. His son asks whether a catheter will be needed permanently.',
    preset: 'overflowIncontinence',
    chart: BLADDER_PANEL,
    task: 'Explain why a bladder this full generates almost no pressure.',
    questionIds: ['cannot-empty'],
    teaching:
      'Volume near capacity with almost no detrusor tone: the motor neuropathy of diabetes has denervated the smooth muscle, so the pump cannot answer the stretch no matter how loud the afferent signal gets. Pressure stays low because pressure here is active tone, not passive stretch — and the sphincter becomes the only thing between a full bladder and the outside, dribbling at the margin. Neither Ray overactive detrusor drugs nor Mary sling logic applies; the bladder needs emptying, the residual needs measuring, and the question underneath is glycaemic control over years, not plumbing over days.',
  },
];
