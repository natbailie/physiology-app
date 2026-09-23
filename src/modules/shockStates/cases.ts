import type { ModuleCase } from '@/shared/cases/types';
import type { ShockPresetName } from './engine/presets';
import { SHOCK_PANEL, type ShockSnapshot } from './panel';

export type ShockCase = ModuleCase<ShockPresetName, ShockSnapshot>;

/**
 * Three beds, each a scenario this module has always been able to produce.
 *
 * They were chosen to be the three that look alike and are treated in opposite directions —
 * which is the whole reason the module exists, and the reason its own preset comments read like
 * case notes already. Nothing here is new physiology; what is new is that the numbers belong to
 * somebody, which is the difference between reading a panel and deciding what to do next.
 *
 * Observations are absent on purpose. `chart` points at `SHOCK_PANEL`, so the six rows are read
 * off the settled engine at the bedside and checked against it in `cases.test.ts`.
 */
export const SHOCK_CASES: readonly ShockCase[] = [
  {
    id: 'amina-trauma',
    bed: 'A04',
    name: 'Amina',
    age: 24,
    oneLiner: 'Motorcycle collision, cool peripheries, heart rate 112',
    presentation:
      'Brought in forty minutes after coming off a motorbike at speed. She is talking to you, apologetic about the fuss, and her blood pressure is one of the better ones on the board. Her hands are cold, her pulse pressure is narrow, and the abdomen is tender in the left upper quadrant. Nothing has been given yet. The registrar wants to know whether this can wait for the CT scanner.',
    preset: 'haemorrhagic',
    chart: SHOCK_PANEL,
    task: 'Decide whether the blood pressure is telling you what you think it is.',
    teaching:
      'Both filling pressures are empty and the resistance is up: there is not enough blood in the circuit and the circulation has clamped down to hide it. Read the cardiac index against the pressure and the two disagree — the index has collapsed while the pressure is merely unremarkable. That gap IS the compensation, and it holds until it does not, which is why a young patient with a normal blood pressure can arrive stable and be peri-arrest twenty minutes later. Note the haemoglobin: whole blood is being lost, so the concentration barely moves. A normal haemoglobin does not exclude a major bleed.',
    questionIds: ['empty-on-both-sides', 'reflex-was-holding-the-pressure'],
  },
  {
    id: 'george-post-mi',
    bed: 'A07',
    name: 'George',
    age: 68,
    oneLiner: 'Breathless four days after an anterior MI, systolic 84',
    presentation:
      'Four days out from an anterior infarct, and since this morning he cannot lie flat. He is grey, the pressure has drifted down through the day, and his lungs are wet to the mid-zones. The nurse has started a 500 mL bag because the pressure is low, which is the reflex the last six patients on this ward rewarded. The numbers from his PA catheter are on the screen.',
    preset: 'cardiogenic',
    chart: SHOCK_PANEL,
    task: 'Say whether the fluid running into his arm is helping him.',
    teaching:
      'Low output with BOTH filling pressures raised is a pump that cannot clear what reaches it. The high wedge is blood damming back into the lungs — that is the breathlessness, directly — and the CVP follows because a congested pulmonary circulation loads the right heart in turn. Filling was never the problem here, so the bolus has nowhere to go but the wedge. The identical bag of fluid that rescues Amina in the next bed drowns this man, and the only thing standing between the two decisions is naming the state before treating the pressure.',
    questionIds: ['full-on-both-sides', 'fluid-in-cardiogenic'],
  },
  {
    id: 'ruth-warm-shock',
    bed: 'B02',
    name: 'Ruth',
    age: 71,
    oneLiner: 'Two days of fever, warm and vasodilated, lactate climbing',
    presentation:
      'Admitted with a urinary source and two days of fever. She is warm to the fingertips, her pressure is low and her hands are pink rather than mottled. The team has read the mixed venous saturation off the catheter and are reassured by it — it is higher than anyone expected — but the lactate has gone up again since the last gas. Somebody suggests she may simply need more inotropy.',
    preset: 'septic',
    chart: SHOCK_PANEL,
    task: 'Work out whether that mixed venous saturation is good news.',
    teaching:
      'Output is high, resistance is on the floor, and the mixed venous saturation is high alongside a markedly raised lactate. That combination resolves only one way: oxygen is being delivered in abundance and returned unused, because the tissue cannot extract it. A high SvO₂ is reassuring next to a normal lactate and damning next to this one — it is the extraction defect, not adequate delivery. Contrast Amina, whose low SvO₂ means her tissue is taking everything it can from too little. More inotropy treats the wrong half of the equation; the answer is vasopressors and source control.',
    questionIds: ['high-svo2-with-lactate'],
  },
];
