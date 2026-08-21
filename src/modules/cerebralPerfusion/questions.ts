import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type { CerebralDerived, CerebralInputs, CerebralInternalState } from './engine/types';
import type { CerebralPresetName } from './engine/presets';
import { perturbDrainCsf } from './engine/engine';

type Snapshot = { state: CerebralInternalState; derived: CerebralDerived };
export type CerebralQuestion = ModuleQuestion<CerebralInputs, CerebralPresetName, Snapshot>;

const PANEL: readonly PanelField<Snapshot>[] = [
  { label: 'ICP', unit: 'mmHg', value: (s) => s.derived.intracranialPressureMmHg, decimals: 0 },
  { label: 'CPP', unit: 'mmHg', value: (s) => s.derived.cerebralPerfusionPressureMmHg, decimals: 0 },
  { label: 'Cerebral blood flow', value: (s) => s.derived.cerebralBloodFlow, decimals: 0 },
  { label: 'Reserve remaining', unit: 'mL', value: (s) => s.derived.compensatoryReserveMl, decimals: 0, tolerance: 0.2 },
  { label: 'Cerebral blood volume', unit: 'mL', value: (s) => s.derived.cerebralBloodVolumeMl, decimals: 0 },
];

const SETTLE = 4000;

export const CEREBRAL_QUESTIONS: readonly CerebralQuestion[] = [
  {
    id: 'normal-pressure-no-reserve',
    stem: 'A patient with a slowly growing tumour has a completely normal intracranial pressure and no headache. The neurosurgeon is nonetheless concerned.',
    answer: 'compensatedMass',
    options: ['compensatedMass', 'normal', 'decompensatedMass', 'hydrocephalus'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'The pressure is normal and the reserve is gone — and the reserve is what matters. CSF and venous blood have been displaced to accommodate the mass, which is exactly what the fixed box permits until it does not. This patient sits at the knee of the pressure-volume curve, where the next few millilitres of anything, a small bleed or a little oedema, will do what the first sixty did not. A normal intracranial pressure is reassuring about the present and says nothing about the margin.',
  },
  {
    id: 'hyperaemic-passive-flow',
    stem: 'A patient some days after a severe head injury has a normal intracranial pressure but a blood pressure that has been allowed to run high. Their cerebral blood flow is well above normal.',
    answer: 'lostAutoregulation',
    options: ['lostAutoregulation', 'normal', 'compensatedMass', 'hyperventilated'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Flow is following pressure passively, which means autoregulation has been lost — and that is the finding, not the high flow itself. With autoregulation intact this blood pressure would have produced an entirely normal flow. Abolish it and the same pressure becomes hyperaemia, just as a low pressure would become ischaemia. That is why blood pressure is controlled deliberately after a head injury rather than merely kept "adequate".',
  },
  {
    id: 'small-volume-big-pressure',
    stem: 'A patient has a large intracranial mass and a markedly raised pressure. Their perfusion pressure has fallen but their pulse is still normal.',
    answer: 'decompensatedMass',
    options: ['decompensatedMass', 'compensatedMass', 'venousObstruction', 'lostAutoregulation'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'The reserve is gone and the mass has pushed well beyond it, so the exponential part of the curve is doing the work: the pressure is high and every further millilitre is expensive. Note what that steepness also means — removing a small volume now buys a large fall in pressure, which is why an external ventricular drain is so effective at this end of the curve and does almost nothing at the other.',
  },
  {
    id: 'hyperventilation-lowers-icp',
    stem: 'A patient with a large intracranial mass has a dangerously raised pressure. While definitive treatment is arranged, the team increases the minute ventilation.',
    setup: { preset: 'hypoventilated' },
    intervention: { label: 'PaCO2 is brought down to 26 mmHg.', inputs: { paCO2MmHg: 26 } },
    prompt: 'What happens to intracranial pressure?',
    watch: 'ICP',
    correctDirection: 'falls',
    settleSeconds: 3000,
    observeSeconds: 3000,
    explanation:
      'It falls, and quickly. CO2 is the most powerful cerebral vasodilator there is, so lowering it constricts the vessels, shrinks cerebral blood volume, and removes volume from a box that has none to spare. It is the fastest lever anyone has. But watch the flow readout at the same time: the constriction that bought the pressure also cut perfusion, which is why this is a bridge to definitive treatment and not a treatment itself.',
    metric: (s) => s.derived.intracranialPressureMmHg,
  },
  {
    id: 'drain-at-the-steep-end',
    stem: 'A patient with a raised intracranial pressure and no compensatory reserve has an external ventricular drain inserted. Only a small volume is removed.',
    setup: { preset: 'decompensatedMass' },
    intervention: { label: '15 mL of CSF is drained.', perturb: (state) => perturbDrainCsf(state, 15) },
    prompt: 'What happens to intracranial pressure?',
    watch: 'ICP',
    correctDirection: 'falls',
    settleSeconds: 3000,
    observeSeconds: 1200,
    explanation:
      'A small volume produces a large fall, because the patient is on the steep part of the pressure-volume curve — the same steepness that made them deteriorate so suddenly now works in their favour. Try the identical drain on the compensated preset and almost nothing happens, since there the curve is flat. Where a patient sits on that curve determines not only how they will deteriorate but how much any intervention will achieve.',
    metric: (s) => s.derived.intracranialPressureMmHg,
  },
  {
    id: 'venous-pressure-limits-perfusion',
    stem: 'A patient is being nursed head-down with a tight cervical collar. Nothing inside their skull is abnormal.',
    setup: { preset: 'normal' },
    intervention: { label: 'Cerebral venous outflow pressure rises to 22 mmHg.', inputs: { venousOutflowPressureMmHg: 22 } },
    prompt: 'What happens to cerebral perfusion pressure?',
    watch: 'perfusion pressure',
    correctDirection: 'falls',
    settleSeconds: 2000,
    observeSeconds: 2000,
    explanation:
      'Perfusion pressure falls, because a vessel is compressed by whatever surrounds it and the downstream pressure is now the venous one rather than the intracranial one. Nothing inside the skull has changed. CSF absorption also fails, since it needs a gradient into the venous sinus, so pressure climbs from that direction too. This is why sitting the patient up and straightening the neck is the first and cheapest manoeuvre in a rising intracranial pressure.',
    metric: (s) => s.derived.cerebralPerfusionPressureMmHg,
  },
];
