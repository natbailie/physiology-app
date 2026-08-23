import type { PredictQuestion } from '@/shared/assessment/types';
import type { MembraneDerived, MembraneInputs, MembraneState } from './engine/types';
import type { MembranePresetName } from './engine/presets';

type Snapshot = { state: MembraneState; derived: MembraneDerived };
export type MembraneQuestion = PredictQuestion<MembraneInputs, MembranePresetName, Snapshot>;

export const MEMBRANE_QUESTIONS: readonly MembraneQuestion[] = [
  {
    id: 'hyperkalaemia-resting-potential',
    stem: 'A patient with renal failure develops a serum potassium of 8 mmol/L. Their sodium, temperature and channel densities are all normal.',
    setup: { preset: 'normal' },
    intervention: { label: 'Extracellular potassium rises to 8 mmol/L.', inputs: { extracellularK: 8 } },
    prompt: 'What happens to the resting membrane potential?',
    watch: 'the resting potential',
    correctDirection: 'rises',
    explanation:
      'It rises toward zero — the cell depolarises. Resting potential sits close to the potassium equilibrium potential because the membrane is most permeable to potassium at rest, and by the Nernst relation raising extracellular potassium makes that equilibrium less negative. Note the direction of the word: "rises" here means less negative, which is depolarisation. Everything hyperkalaemia does to excitable tissue follows from this one shift.',
    metric: (s) => s.derived.restingPotentialMv,
  },
  {
    id: 'hyperkalaemia-excitability',
    stem: 'The same patient, with the same potassium of 8 mmol/L. Their membrane is now sitting closer to threshold than it was before.',
    setup: { preset: 'normal' },
    intervention: { label: 'Extracellular potassium rises to 8 mmol/L.', inputs: { extracellularK: 8 } },
    prompt: 'What happens to excitability?',
    watch: 'excitability',
    correctDirection: 'falls',
    explanation:
      'This is the trap. The cell is closer to threshold, so it ought to be easier to fire — and yet it becomes harder. Sodium inactivation (the h gate) is CLOSED by depolarisation, so a chronically depolarised cell sits with much of its sodium current already unavailable. There is not enough inward current left to mount an upstroke. That is why hyperkalaemia causes weakness and asystole rather than excitation, and why the resting potential and excitability move in opposite directions.',
    metric: (s) => s.derived.excitability,
  },
  {
    id: 'demyelination-velocity',
    stem: 'A patient develops a demyelinating neuropathy. The axons themselves are intact and can still generate action potentials normally.',
    setup: { preset: 'normal' },
    intervention: { label: 'Myelination falls to 15% of normal.', inputs: { myelination: 0.15 } },
    prompt: 'What happens to conduction velocity?',
    watch: 'conduction velocity',
    correctDirection: 'falls',
    explanation:
      'Velocity collapses while the ability to fire at all is preserved, and separating those two ideas explains a great deal of neurology. Myelin allows saltatory conduction between nodes of Ranvier, making a myelinated fibre roughly an order of magnitude faster than an unmyelinated one of the same diameter. Strip it and the impulse must propagate continuously instead. Demyelination is therefore a CONDUCTION problem, not an excitability one — which is why nerve conduction studies, rather than the presence or absence of a response, are what make the diagnosis.',
    metric: (s) => s.derived.conductionVelocityMPerS,
  },

  {
    id: 'local-anaesthetic-blocks-sodium',
    stem: 'A local anaesthetic is infiltrated around a nerve. The potassium channels and the myelin are untouched.',
    setup: { preset: 'normal' },
    intervention: { label: 'Sodium channel availability collapses.', inputs: { gNaMaxDensity: 0.2 } },
    prompt: 'What happens to conduction velocity?',
    watch: 'the conduction velocity',
    correctDirection: 'falls',
    explanation:
      'Velocity falls because propagation depends on each patch of membrane depolarising the next one past threshold, and blocking sodium channels reduces the current available to do it. The clinically important consequence is selectivity: small unmyelinated pain fibres have less reserve than large myelinated motor fibres, so they fail first. That is why a local anaesthetic can abolish pain while leaving power and touch largely intact, and why the order of loss is predictable.',
    metric: (s) => s.derived.conductionVelocityMPerS,
  },
  {
    id: 'hypothermia-slows-conduction',
    stem: 'A limb is cooled substantially. The nerve is structurally normal and no drug has been given.',
    setup: { preset: 'normal' },
    intervention: { label: 'Temperature falls to 28°C.', inputs: { temperature: 28 } },
    prompt: 'What happens to conduction velocity?',
    watch: 'the conduction velocity',
    correctDirection: 'falls',
    explanation:
      'Conduction slows, because the gating of the channels is a chemical process and cooling slows it — the time constants lengthen, so each patch of membrane takes longer to depolarise the next. Two things follow. Cooling is genuinely analgesic, which is why ice helps an injury beyond reducing swelling. And a nerve conduction study performed on a cold limb reports slowing that is not there once the patient is warmed, which is why temperature is controlled during the test.',
    metric: (s) => s.derived.conductionVelocityMPerS,
  },
  {
    id: 'low-sodium-lowers-overshoot',
    stem: 'A patient becomes profoundly hyponatraemic. Their potassium, temperature and myelin are all normal.',
    setup: { preset: 'normal' },
    intervention: { label: 'Extracellular sodium falls sharply.', inputs: { extracellularNa: 105 } },
    prompt: 'What happens to the sodium equilibrium potential?',
    watch: 'the sodium equilibrium potential',
    correctDirection: 'falls',
    explanation:
      'E_Na falls toward zero, because it is set by the ratio of extracellular to intracellular sodium and reducing the outside term shrinks the gradient. The action potential overshoots toward E_Na, so a lower value means a smaller overshoot and a weaker upstroke. Note the contrast with potassium: hyperkalaemia is dangerous because it moves the RESTING potential, where hyponatraemia moves the ceiling the spike reaches. Both are electrical, they act on opposite ends of the action potential, and their clinical pictures are nothing alike.',
    metric: (s) => s.derived.eNa,
  },
];
